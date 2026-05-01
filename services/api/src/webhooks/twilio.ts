import { Hono } from 'hono';
import { ok, err } from '@agconn/api-client/server';
import { validateTwilioSignature } from '@agconn/sms';
import { prisma, SmsStatus } from '@agconn/db';
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
  }

  // Twilio's auto-reply handles confirmation copy; we only record.
  return ok(c, { received: true });
});
