// Identity-keystone consumer (docs/00-foundation/13-onboarding-identity-remediation/).
// Drains sms.provision: ensures a Clerk user exists for the inbound phone,
// upserts the local User row keyed by the real Clerk id (never an sms_* id),
// and hands off the confirm SMS to the sms.send queue. Idempotent end to end —
// safe under duplicate inbound and pg-boss retries.

import type { Job, PgBoss } from 'pg-boss';
import { prisma } from '@agconn/db';
import { UserRole, Lang } from '@agconn/db';
import { ensureClerkUserByPhone } from '@agconn/auth';
import {
  enqueueSms,
  SMS_PROVISION_QUEUE,
  type SmsProvisionJob,
} from '@agconn/sms';
import {
  auditRegistry,
  canonicalize,
  computeHmac,
  hmacKeys,
  initHmacKeysFromEnv,
  type AuditEventInput,
} from '@agconn/audit';

// Platform-level operations (workers / opt-in) live under the system tenant,
// matching the prior inbound opt-in path. SMS log + audit rows must reference
// a real tenant; the system tenant is the right home.
const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000000';

initHmacKeysFromEnv();

async function emitOptInPending(userId: string, meta: Record<string, unknown>): Promise<void> {
  const action = 'system.sms.opt_in_pending';
  const entry = auditRegistry[action];
  const input: AuditEventInput = {
    tenantId: SYSTEM_TENANT_ID,
    occurredAtMs: Date.now(),
    actorType: 'system',
    actorId: null,
    actorRole: 'system',
    actorIp: null,
    actorUserAgent: null,
    action,
    resourceType: entry.resourceType,
    resourceId: userId,
    outcome: 'success',
    correlationId: null,
    metadata: meta,
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

async function handle(job: Job<SmsProvisionJob>): Promise<void> {
  const { phone, locale, keyword } = job.data;
  const lang = locale === 'en' ? Lang.en : Lang.es;

  const { clerkUserId, created } = await ensureClerkUserByPhone(phone, {
    role: UserRole.worker,
    locale: lang,
  });

  // Upsert keyed by the real Clerk id. create sets the pending-confirm state;
  // update is deliberately minimal — it backfills the phone but never clobbers
  // smsOptInState / onboarded / consent for a user who already exists (e.g.
  // a prior web signup texting the keyword). The clerk user.created webhook
  // reconciles role/lang/email idempotently and does not touch these fields.
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.role = 'webhook'`);
    await tx.user.upsert({
      where: { id: clerkUserId },
      update: { phone },
      create: {
        id: clerkUserId,
        role: UserRole.worker,
        phone,
        preferredLang: lang,
        smsOptInState: 'pending_confirm',
      },
    });
  });

  await emitOptInPending(clerkUserId, { phone, keyword, locale, clerkCreated: created });

  await enqueueSms({
    tenantId: SYSTEM_TENANT_ID,
    userId: clerkUserId,
    template: 'sms.optin.confirm',
    vars: {},
    jobKey: `optin-confirm-${clerkUserId}`,
  });

  console.log('[provision] ensured clerk user', {
    created,
    userIdTail: clerkUserId.slice(-6),
    keyword,
  });
}

export async function startProvisionWorker(boss: PgBoss): Promise<void> {
  await boss.createQueue(SMS_PROVISION_QUEUE);
  await boss.work<SmsProvisionJob>(
    SMS_PROVISION_QUEUE,
    { batchSize: 1, pollingIntervalSeconds: 2 },
    async (jobs) => {
      for (const j of jobs) {
        try {
          await handle(j);
        } catch (err) {
          console.error('[provision] failed', { id: j.id, err });
          throw err;
        }
      }
    },
  );
  console.log('[provision] started — listening on', SMS_PROVISION_QUEUE);
}
