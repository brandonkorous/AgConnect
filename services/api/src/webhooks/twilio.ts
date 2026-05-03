import { Hono } from 'hono';
import { ok, err } from '@agconn/api-client/server';
import { validateTwilioSignature, enqueueSms } from '@agconn/sms';
import { prisma, SmsStatus, AppStatus } from '@agconn/db';
import { emitSystemAudit } from '../middleware/audit';

// Twilio webhook contracts:
//   /v1/webhooks/twilio/status   — message status callback. Body is form-encoded;
//                                  query string (?logId=...) carries our row id.
//   /v1/webhooks/twilio/inbound  — inbound SMS (STOP keyword handler only).
//
// Both URLs are unauthenticated but require a valid X-Twilio-Signature header
// computed from the public URL + form params. Without TWILIO_AUTH_TOKEN, every
// request 401s.

function publicApiUrl(c: { req: { url: string } }): string {
  // Prefer PUBLIC_API_URL when set so we match what Twilio used to compute the
  // signature, even when the API is behind a proxy that rewrites Host. Fall
  // back to the request URL in dev.
  const fromEnv = process.env.PUBLIC_API_URL;
  if (fromEnv) {
    const url = new URL(c.req.url);
    return new URL(`${url.pathname}${url.search}`, fromEnv).toString();
  }
  return c.req.url;
}

function mapTwilioStatus(s: string | undefined): SmsStatus | null {
  switch ((s ?? '').toLowerCase()) {
    case 'queued':
      return 'queued';
    case 'sending':
      return 'sending';
    case 'sent':
      return 'sent';
    case 'delivered':
      return 'delivered';
    case 'failed':
    case 'undelivered':
      return 'failed';
    default:
      return null;
  }
}

export const twilioWebhookRoutes = new Hono();

twilioWebhookRoutes.post('/status', async (c) => {
  const params = Object.fromEntries(new URLSearchParams(await c.req.text())) as Record<string, string>;
  const valid = validateTwilioSignature({
    signature: c.req.header('x-twilio-signature'),
    url: publicApiUrl(c),
    params,
  });
  if (!valid) {
    return err(c, 401, 'unauthenticated', 'invalid Twilio signature');
  }

  const logId = c.req.query('logId');
  const status = mapTwilioStatus(params.MessageStatus);
  if (!logId || !status) {
    return ok(c, { received: true });
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.role = 'webhook'`);
    await tx.smsLog.update({
      where: { id: logId },
      data: {
        status,
        deliveredAt: status === 'delivered' ? now : undefined,
        failedAt: status === 'failed' ? now : undefined,
        errorCode: params.ErrorCode || undefined,
      },
    });
  });

  return ok(c, { received: true });
});

const STOP_KEYWORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']);

twilioWebhookRoutes.post('/inbound', async (c) => {
  const params = Object.fromEntries(new URLSearchParams(await c.req.text())) as Record<string, string>;
  const valid = validateTwilioSignature({
    signature: c.req.header('x-twilio-signature'),
    url: publicApiUrl(c),
    params,
  });
  if (!valid) {
    return err(c, 401, 'unauthenticated', 'invalid Twilio signature');
  }

  const text = (params.Body ?? '').trim().toUpperCase();
  const from = params.From ?? '';

  if (from && STOP_KEYWORDS.has(text)) {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.role = 'webhook'`);
      await tx.smsOptOut.upsert({
        where: { phone: from },
        create: { phone: from, source: 'STOP' },
        update: {},
      });
    });
    await emitSystemAudit({
      action: 'system.sms.opt_out_received',
      resourceType: 'sms_opt_out',
      resourceId: from,
      metadata: { phone: from, source: 'STOP' },
    });
    return ok(c, { received: true });
  }

  // SMS-apply keyword routing — workers text APPLY-ALMD (or whatever the
  // job's keyword is) to apply. Match the first whitespace-delimited token
  // case-insensitively against sms_keywords.
  const tokens = text.split(/\s+/);
  for (const token of tokens) {
    if (token.length < 4 || token.length > 24) continue;
    const keyword = await prisma.smsKeyword.findFirst({
      where: { keyword: { equals: token, mode: 'insensitive' }, active: true },
    });
    if (!keyword || keyword.kind !== 'job_apply') continue;

    await handleJobApply({ keyword, fromPhone: from });
    return ok(c, { received: true, keyword: token });
  }

  return ok(c, { received: true });
});

async function handleJobApply(args: {
  keyword: { id: string; tenantId: string; keyword: string; entityId: string };
  fromPhone: string;
}): Promise<void> {
  const { keyword, fromPhone } = args;
  if (!fromPhone) return;

  const job = await prisma.jobPosting.findFirst({
    where: { id: keyword.entityId, deletedAt: null, status: 'active' },
    include: { employer: { include: { employerProfile: true } } },
  });
  if (!job) return;

  // Resolve worker by phone. If unknown, send a "we couldn't find your
  // account" reply — onboarding flow handles registration separately.
  const worker = await prisma.user.findFirst({
    where: { phone: fromPhone, role: 'worker', deletedAt: null },
  });
  if (!worker) {
    await emitSystemAudit({
      action: 'system.sms.dropped',
      resourceType: 'sms_log',
      resourceId: '',
      metadata: { template: 'sms.apply.unknown_phone', reason: 'unknown_worker', toPhone: fromPhone },
    });
    return;
  }

  // Idempotent: skip if this worker already applied to this job.
  const existing = await prisma.application.findFirst({
    where: { jobId: job.id, workerId: worker.id },
  });

  let applicationId = existing?.id;
  if (!existing) {
    const created = await prisma.application.create({
      data: {
        tenantId: job.tenantId,
        jobId: job.id,
        workerId: worker.id,
        status: AppStatus.applied,
        countyAtApply: job.county,
        skillsAtApply: [],
      },
    });
    applicationId = created.id;
  }

  // Bump keyword usage so the employer can see SMS-apply traffic.
  await prisma.smsKeyword.update({
    where: { id: keyword.id },
    data: { lastUsedAt: new Date() },
  });

  const employer =
    job.employer.employerProfile?.dbaName ??
    job.employer.employerProfile?.legalName ??
    'AgConn employer';
  await enqueueSms({
    tenantId: job.tenantId,
    userId: worker.id,
    template: 'sms.apply.confirmed',
    vars: { jobTitle: job.titleEn, employer },
    jobKey: `apply-confirm-${applicationId}`,
  });
}
