import { PgBoss } from 'pg-boss';
import { computeQuietHoursDefer } from './quiet-hours.js';
import type { SmsTemplateName, TemplateVars } from './templates/index.js';

export const SMS_QUEUE = 'sms.send' as const;

// All callers go through this shape — never call Twilio directly. The worker
// resolves the user, locale, and opt-out state at send time, so the producer
// only needs the recipient identity + template + vars.
export type SmsJob<T extends SmsTemplateName = SmsTemplateName> = {
  tenantId: string;
  userId: string;
  template: T;
  vars: TemplateVars<T>;
  // Optional override — when omitted, quiet-hours defer kicks in automatically
  // for non-transactional templates.
  scheduledFor?: string;
  // Bypass quiet-hours hold. Reserved for time-critical templates like
  // `application.hired` or two-hour training reminders, per spec section 06.
  bypassQuietHours?: boolean;
  // When set, the SmsLog row written by the worker carries this messageId so
  // a broadcast Message can list its per-recipient delivery state.
  messageId?: string;
};

let cachedBoss: PgBoss | null = null;
let starting: Promise<PgBoss> | null = null;

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set — required for the SMS queue');
  return url;
}

export async function getSmsBoss(): Promise<PgBoss> {
  if (cachedBoss) return cachedBoss;
  if (starting) return starting;

  starting = (async () => {
    const boss = new PgBoss({
      connectionString: getDatabaseUrl(),
      schema: 'pgboss',
    });
    boss.on('error', (err: unknown) => {
      console.error('[sms pg-boss] error', err);
    });
    await boss.start();
    await boss.createQueue(SMS_QUEUE);
    cachedBoss = boss;
    return boss;
  })();

  return starting;
}

export async function stopSmsBoss(): Promise<void> {
  if (cachedBoss) {
    await cachedBoss.stop({ graceful: true, timeout: 10_000 });
    cachedBoss = null;
    starting = null;
  }
}

const SEND_OPTS = {
  retryLimit: 3,
  retryBackoff: true,
  retryDelay: 30,
  expireInSeconds: 23 * 60 * 60,
} as const;

// Templates that bypass quiet-hours by default. Two-hour training reminders
// must fire before the class; hire confirmations are time-critical for the
// worker. The opt-in AND micro-onboarding/JOBS replies are all direct
// responses to a user-initiated inbound SMS within an active two-way
// conversation — TCPA quiet-hours apply to unsolicited outreach, not to
// conversational responses the worker triggered seconds ago, and a deferred
// reply mid-flow looks like a broken service (the worker is sitting there
// having just texted their county/name). Everything else defers to 7 AM
// Pacific to comply with FCC guidance.
const QUIET_HOURS_BYPASS: ReadonlySet<SmsTemplateName> = new Set([
  'application.hired',
  'training.reminder.2h',
  'sms.optin.confirm',
  'sms.optin.welcome',
  'sms.optin.invalid',
  'sms.onboard.invalid_county',
  'sms.onboard.ask_county',
  'sms.onboard.ask_name',
  'sms.onboard.ask_skills',
  'sms.onboard.done',
  'sms.jobs.digest',
  'sms.jobs.none',
]);

export type EnqueueSmsArgs<T extends SmsTemplateName = SmsTemplateName> = SmsJob<T> & {
  // Idempotency key — defaults to template+userId so duplicate enqueues fold.
  jobKey?: string;
};

export async function enqueueSms<T extends SmsTemplateName>(
  args: EnqueueSmsArgs<T>,
): Promise<string | null> {
  const boss = await getSmsBoss();
  const bypass = args.bypassQuietHours ?? QUIET_HOURS_BYPASS.has(args.template);
  const startAfter = args.scheduledFor
    ? new Date(args.scheduledFor)
    : bypass
      ? new Date()
      : computeQuietHoursDefer();
  const singletonKey = args.jobKey ?? `${args.template}-${args.userId}`;

  const payload: SmsJob<T> = {
    tenantId: args.tenantId,
    userId: args.userId,
    template: args.template,
    vars: args.vars,
    scheduledFor: args.scheduledFor,
    bypassQuietHours: bypass,
    messageId: args.messageId,
  };

  return boss.send(SMS_QUEUE, payload, {
    ...SEND_OPTS,
    singletonKey,
    singletonSeconds: 60 * 60,
    startAfter,
  });
}
