import type { Job } from 'pg-boss';
import { prisma, type Tx } from '@agconn/db';
import {
  auditRegistry,
  canonicalize,
  computeHmac,
  hmacKeys,
  initHmacKeysFromEnv,
  type AuditEventInput,
} from '@agconn/audit';
import { getSmsBoss, SMS_QUEUE, type SmsJob } from './queue.js';
import { renderSms, smsTemplates, type SmsTemplateName, type TemplateVars } from './templates/index.js';
import { isQuietHours } from './quiet-hours.js';
import { classifyTwilioError, getMessagingServiceSid, getTwilioClient } from './twilio.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

initHmacKeysFromEnv();

function publicApiUrl(): string {
  return (process.env.PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');
}

async function withTenantTx<T>(tenantId: string, fn: (db: Tx) => Promise<T>): Promise<T> {
  if (!UUID_RE.test(tenantId)) {
    throw new Error(`sms-worker received invalid tenantId: ${tenantId}`);
  }
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.role = 'service'`);
      await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`);
      return fn(tx);
    },
    { timeout: 60_000, maxWait: 10_000 },
  );
}

async function emitAudit(args: {
  tenantId: string;
  action: 'system.sms.sent' | 'system.sms.dropped' | 'system.sms.failed';
  outcome: 'success' | 'failure';
  resourceId: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  const entry = auditRegistry[args.action];
  const input: AuditEventInput = {
    tenantId: args.tenantId,
    occurredAtMs: Date.now(),
    actorType: 'system',
    actorId: null,
    actorRole: 'system',
    actorIp: null,
    actorUserAgent: null,
    action: args.action,
    resourceType: entry.resourceType,
    resourceId: args.resourceId,
    outcome: args.outcome,
    correlationId: null,
    metadata: args.metadata,
  };
  const { key, version } = hmacKeys.current();
  const eventHmac = computeHmac(canonicalize(input), key);

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.role = 'system'`);
    await tx.auditEvent.create({
      data: {
        tenantId: input.tenantId,
        occurredAt: new Date(input.occurredAtMs),
        actorType: input.actorType,
        actorId: input.actorId,
        actorRole: input.actorRole,
        action: input.action,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        outcome: input.outcome,
        correlationId: input.correlationId,
        metadata: input.metadata as object,
        eventHmac: Uint8Array.from(eventHmac),
        eventHmacV: version,
      },
    });
  });
}

async function handleSmsJob<T extends SmsTemplateName>(job: Job<SmsJob<T>>): Promise<void> {
  const { tenantId, userId, template, vars, bypassQuietHours } = job.data;

  if (!bypassQuietHours && isQuietHours()) {
    throw new Error('quiet-hours-deferred');
  }

  const tpl = smsTemplates[template];
  if (!tpl) {
    throw new Error(`sms-worker: unknown template ${template}`);
  }

  await withTenantTx(tenantId, async (db) => {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || !user.phone) {
      const dropped = await db.smsLog.create({
        data: {
          tenantId,
          userId,
          template,
          locale: user?.preferredLang ?? 'es',
          toPhone: '',
          body: '',
          vars: vars as object,
          status: 'dropped',
        },
      });
      await emitAudit({
        tenantId,
        action: 'system.sms.dropped',
        outcome: 'failure',
        resourceId: dropped.id,
        metadata: { template, reason: 'no_phone' },
      });
      return;
    }

    const optOut = await prisma.smsOptOut.findUnique({ where: { phone: user.phone } });
    if (optOut) {
      const dropped = await db.smsLog.create({
        data: {
          tenantId,
          userId,
          template,
          locale: user.preferredLang,
          toPhone: user.phone,
          body: '',
          vars: vars as object,
          status: 'dropped',
          optedOutAt: optOut.optedOutAt,
        },
      });
      await emitAudit({
        tenantId,
        action: 'system.sms.dropped',
        outcome: 'failure',
        resourceId: dropped.id,
        metadata: { template, reason: 'opted_out', toPhone: user.phone },
      });
      return;
    }

    const body = renderSms(template, user.preferredLang, vars as TemplateVars<T>);
    const log = await db.smsLog.create({
      data: {
        tenantId,
        userId,
        template,
        locale: user.preferredLang,
        toPhone: user.phone,
        body,
        vars: vars as object,
        status: 'sending',
      },
    });

    const skipSend = process.env.TWILIO_DRY_RUN === '1' || !process.env.TWILIO_ACCOUNT_SID;

    if (skipSend) {
      console.warn('[sms] dry run — skipping Twilio send', { logId: log.id, template });
      await db.smsLog.update({
        where: { id: log.id },
        data: { status: 'sent', sentAt: new Date(), providerSid: 'dry-run' },
      });
      await emitAudit({
        tenantId,
        action: 'system.sms.sent',
        outcome: 'success',
        resourceId: log.id,
        metadata: { template, dryRun: true, toPhone: user.phone },
      });
      return;
    }

    try {
      const client = getTwilioClient();
      const msg = await client.messages.create({
        to: user.phone,
        messagingServiceSid: getMessagingServiceSid(),
        body,
        statusCallback: `${publicApiUrl()}/v1/webhooks/twilio/status?logId=${log.id}`,
      });
      await db.smsLog.update({
        where: { id: log.id },
        data: { status: 'sent', sentAt: new Date(), providerSid: msg.sid },
      });
      await emitAudit({
        tenantId,
        action: 'system.sms.sent',
        outcome: 'success',
        resourceId: log.id,
        metadata: { template, providerSid: msg.sid, toPhone: user.phone },
      });
    } catch (err) {
      const cls = classifyTwilioError(err);
      await db.smsLog.update({
        where: { id: log.id },
        data: { status: 'failed', failedAt: new Date(), errorCode: cls.code },
      });
      await emitAudit({
        tenantId,
        action: 'system.sms.failed',
        outcome: 'failure',
        resourceId: log.id,
        metadata: { template, errorCode: cls.code, errorMessage: cls.message, toPhone: user.phone },
      });
      if (cls.retryable) throw err;
    }
  });
}

export type SmsWorkerHandle = {
  stop: () => Promise<void>;
};

export async function runSmsWorker(): Promise<SmsWorkerHandle> {
  const boss = await getSmsBoss();

  await boss.work<SmsJob>(
    SMS_QUEUE,
    { batchSize: 5, pollingIntervalSeconds: 2 },
    async (jobs) => {
      for (const job of jobs) {
        try {
          await handleSmsJob(job);
        } catch (err) {
          console.error('[sms-worker] job failed', { jobId: job.id, template: job.data.template, err });
          throw err;
        }
      }
    },
  );

  console.log('[sms-worker] started — listening on', SMS_QUEUE);

  return {
    stop: async () => {
      await boss.stop({ graceful: true, timeout: 10_000 });
    },
  };
}
