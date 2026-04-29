# 05 — SMS Pipeline: API & Worker

The SMS pipeline exposes three internal interfaces (callable from any feature) plus two webhook endpoints.

## Internal API (TypeScript, in `packages/sms`)

### enqueueSms

```ts
// packages/sms/src/index.ts
export interface EnqueueSmsArgs {
  tenantId: string;
  userId: string;                 // for opt-out + locale lookup; required
  template: TemplateName;          // type-narrowed enum from packages/sms/templates
  vars?: Record<string, string>;   // interpolation vars
  scheduledFor?: Date;             // explicit schedule; otherwise compute quiet-hours defer
  jobKey?: string;                 // idempotency key (e.g., "welcome-{userId}")
}

export async function enqueueSms(args: EnqueueSmsArgs): Promise<{ jobId: string }> {
  const job = await pgBoss.send('send-sms', args, {
    singletonKey: args.jobKey,        // idempotency
    startAfter: args.scheduledFor ?? computeQuietHoursDefer(),
    retryLimit: 3,
    retryBackoff: true,                // 30s, 5m, 30m
  });
  return { jobId: job };
}
```

Callers never call Twilio directly. Always go through `enqueueSms`.

### Worker process

`apps/api/src/workers/send-sms.ts` runs as a separate Kubernetes Deployment with its own image (or as a sidecar container — see [10-infra-cicd](../10-infra-cicd/)).

```ts
pgBoss.work<EnqueueSmsArgs>('send-sms', { teamSize: 5 }, async (job) => {
  const { tenantId, userId, template, vars } = job.data;

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.phone) return;        // user deleted or no phone

  // Opt-out check
  const optOut = await db.smsOptOut.findUnique({ where: { phone: user.phone } });
  if (optOut) {
    await db.smsLog.create({ data: { tenantId, userId, template, locale: user.preferredLang, toPhone: user.phone, body: '', status: 'dropped', optedOutAt: optOut.optedOutAt, vars } });
    return;
  }

  const tpl = templates[template][user.preferredLang];
  const body = interpolate(tpl, vars ?? {});
  const log = await db.smsLog.create({ data: { tenantId, userId, template, locale: user.preferredLang, toPhone: user.phone, body, vars, status: 'sending' } });

  try {
    const msg = await twilio.messages.create({
      to: user.phone,
      messagingServiceSid: process.env.TWILIO_MSID,
      body,
      statusCallback: `${process.env.API_PUBLIC_URL}/webhooks/twilio/status?logId=${log.id}`,
    });
    await db.smsLog.update({ where: { id: log.id }, data: { providerSid: msg.sid, status: 'sent', sentAt: new Date() } });
  } catch (err: any) {
    await db.smsLog.update({ where: { id: log.id }, data: { status: 'failed', failedAt: new Date(), errorCode: err.code } });
    throw err;            // pg-boss handles retry
  }
});
```

### Twilio wrapper

```ts
// packages/sms/src/twilio.ts
import twilio from 'twilio';
export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
);
```

Singleton; reused across the worker process.

### Quiet-hours computation

```ts
// packages/sms/src/quiet-hours.ts
import { DateTime } from 'luxon';

const TZ = 'America/Los_Angeles';
const START_HOUR = 21;   // 9 PM
const END_HOUR = 7;      // 7 AM

export function computeQuietHoursDefer(now = DateTime.now()): Date {
  const local = now.setZone(TZ);
  const hour = local.hour;
  if (hour >= END_HOUR && hour < START_HOUR) return now.toJSDate();   // not in quiet hours

  // In quiet hours — compute next 7:00 AM Pacific
  let target = local.set({ hour: END_HOUR, minute: 0, second: 0, millisecond: 0 });
  if (local.hour >= START_HOUR) target = target.plus({ days: 1 });
  return target.toJSDate();
}
```

## Webhook endpoints (Hono routes — unauthenticated, signature-verified)

### POST /webhooks/twilio/status

Twilio delivery status callback. Validates the signature using `twilio.validateRequest()`.

```ts
twilioWebhookRouter.post('/status', async (c) => {
  const valid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    c.req.header('x-twilio-signature') ?? '',
    `${process.env.API_PUBLIC_URL}${c.req.path}`,
    await c.req.parseBody(),
  );
  if (!valid) throw new HTTPException(401);

  const body = await c.req.parseBody() as Record<string, string>;
  const logId = c.req.query('logId');
  const status = body.MessageStatus;          // queued, sending, sent, delivered, failed, undelivered

  if (logId) {
    await db.smsLog.update({
      where: { id: logId },
      data: {
        status: mapTwilioStatus(status),
        deliveredAt: status === 'delivered' ? new Date() : undefined,
        failedAt: ['failed', 'undelivered'].includes(status) ? new Date() : undefined,
        errorCode: body.ErrorCode ?? undefined,
      },
    });
  }
  return c.text('OK');
});
```

### POST /webhooks/twilio/inbound

Inbound SMS handler. For MVP, only handles STOP keyword.

```ts
twilioWebhookRouter.post('/inbound', async (c) => {
  // signature validation as above
  const body = await c.req.parseBody() as Record<string, string>;
  const text = (body.Body ?? '').trim().toUpperCase();
  const from = body.From;       // E.164

  if (['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'].includes(text)) {
    await db.smsOptOut.upsert({
      where: { phone: from },
      create: { phone: from, source: 'STOP' },
      update: {},
    });
  }
  // Twilio's auto-response handles confirmation; we just record.
  return c.text('OK');
});
```

> **Inferred:** STOP/HELP auto-replies are handled by Twilio Console settings, not our code. This is the recommended pattern — it ensures FCC compliance even if our app is down. Verify Twilio Messaging Service has the default keywords enabled.

## Errors

| code | http | when |
|---|---|---|
| `invalid_signature` | 401 | Twilio webhook signature invalid |
| `template_not_found` | 500 | (internal) — template name not in dictionary |
| `interpolation_failed` | 500 | required var missing in template render |

These last two should never reach a client; they fail the pg-boss job with a Sentry alert.
