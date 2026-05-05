// audit-required:exempt — Resend webhooks update email_log status mirrors;
// the durable email send record is the email_log row itself, and it is
// already audited at send time.
import { Hono } from 'hono';
import { Webhook } from 'svix';
import { EmailStatus, SuppressionReason, type Tx } from '@agconn/db';
import { ok, err } from '@agconn/api-client/server';
import { webhookMiddleware, type TenantVars } from '../middleware/tenantContext';

type ResendEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.complained'
  | 'email.bounced'
  | 'email.opened'
  | 'email.clicked'
  | 'email.failed';

type ResendEvent = {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    to: string[];
    from: string;
    subject: string;
    bounce?: { type?: string; subType?: string; message?: string };
  };
};

let cachedWebhook: Webhook | null = null;

function getWebhook(): Webhook {
  if (cachedWebhook) return cachedWebhook;
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) throw new Error('RESEND_WEBHOOK_SECRET is not set');
  cachedWebhook = new Webhook(secret);
  return cachedWebhook;
}

async function applyEvent(db: Tx, event: ResendEvent): Promise<void> {
  const providerId = event.data.email_id;
  if (!providerId) return;

  const log = await db.emailLog.findUnique({ where: { providerId } });
  if (!log) {
    console.warn('[webhook] resend event for unknown provider_id', {
      providerId,
      type: event.type,
    });
    return;
  }

  const now = new Date();

  switch (event.type) {
    case 'email.delivered':
      if (!log.deliveredAt) {
        await db.emailLog.update({
          where: { id: log.id },
          data: { status: EmailStatus.delivered, deliveredAt: now },
        });
      }
      return;

    case 'email.bounced': {
      await db.emailLog.update({
        where: { id: log.id },
        data: {
          status: EmailStatus.bounced,
          bouncedAt: now,
          errorMsg: event.data.bounce?.message?.slice(0, 500) ?? null,
        },
      });
      const isHard = event.data.bounce?.type !== 'Soft';
      if (isHard) {
        await db.emailSuppression.upsert({
          where: { email: log.toEmail.toLowerCase() },
          update: { reason: SuppressionReason.hard_bounce },
          create: {
            email: log.toEmail.toLowerCase(),
            reason: SuppressionReason.hard_bounce,
            source: 'resend_webhook',
          },
        });
      }
      return;
    }

    case 'email.complained':
      await db.emailLog.update({
        where: { id: log.id },
        data: { status: EmailStatus.complained, complainedAt: now },
      });
      await db.emailSuppression.upsert({
        where: { email: log.toEmail.toLowerCase() },
        update: { reason: SuppressionReason.complaint },
        create: {
          email: log.toEmail.toLowerCase(),
          reason: SuppressionReason.complaint,
          source: 'resend_webhook',
        },
      });
      return;

    case 'email.failed':
      await db.emailLog.update({
        where: { id: log.id },
        data: {
          status: EmailStatus.failed,
          failedAt: now,
          errorMsg: 'resend_failed',
        },
      });
      return;

    case 'email.sent':
    case 'email.delivery_delayed':
    case 'email.opened':
    case 'email.clicked':
      // sent/opened/clicked are tracked elsewhere or not material to status;
      // delivery_delayed is a soft signal — we don't suppress on a single delay.
      return;
  }
}

export const resendWebhookRoutes = new Hono<{ Variables: TenantVars }>();

resendWebhookRoutes.post('/', async (c) => {
  const rawBody = await c.req.text();
  const headers = {
    'svix-id': c.req.header('svix-id') ?? '',
    'svix-timestamp': c.req.header('svix-timestamp') ?? '',
    'svix-signature': c.req.header('svix-signature') ?? '',
  };

  let event: ResendEvent;
  try {
    event = getWebhook().verify(rawBody, headers) as ResendEvent;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'invalid_signature';
    console.warn('[webhook] resend signature verification failed', { message });
    return err(c, 401, 'unauthenticated', 'Webhook signature verification failed');
  }

  // Verification done OUTSIDE the tx-bound middleware so an invalid signature
  // doesn't open a transaction. Now run the DB work inside webhook role.
  await webhookMiddleware('webhooks')(c, async () => {
    await applyEvent(c.var.db, event);
  });

  return ok(c, { received: true });
});
