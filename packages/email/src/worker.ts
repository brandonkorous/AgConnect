import type { Job } from 'pg-boss';
import { prisma, type Tx } from '@agconn/db';
import {
  QUEUE_NAMES,
  getBoss,
  type WaitlistConfirmJob,
  type WaitlistWelcomeJob,
} from './queue';
import { sendWaitlistConfirm, sendWaitlistWelcome } from './sender';
import { signConfirmToken, signUnsubscribeToken } from './tokens';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function publicWebUrl(): string {
  return (process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

function publicApiUrl(): string {
  return (process.env.PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');
}

function buildConfirmUrl(token: string, locale: 'en' | 'es'): string {
  return `${publicWebUrl()}/${locale}/confirm?token=${encodeURIComponent(token)}`;
}

function buildHomeUrl(locale: 'en' | 'es'): string {
  return `${publicWebUrl()}/${locale}`;
}

function buildUnsubscribeUrl(token: string, locale: 'en' | 'es'): string {
  return `${publicWebUrl()}/${locale}/unsubscribe?token=${encodeURIComponent(token)}`;
}

function buildOneClickUnsubscribeUrl(token: string): string {
  return `${publicApiUrl()}/v1/landing/unsubscribe?token=${encodeURIComponent(token)}`;
}

/**
 * Wraps a unit of email work in a tenant-scoped Postgres transaction.
 * RLS policies require `app.role = 'service'` and `app.tenant_id = <tenantId>`
 * for the worker's reads/writes to succeed.
 */
async function withTenantTx<T>(tenantId: string, fn: (db: Tx) => Promise<T>): Promise<T> {
  if (!UUID_RE.test(tenantId)) {
    throw new Error(`worker received invalid tenantId: ${tenantId}`);
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

async function handleWaitlistConfirm(job: Job<WaitlistConfirmJob>): Promise<void> {
  const { waitlistId, tenantId, email, locale } = job.data;

  await withTenantTx(tenantId, async (db) => {
    const row = await db.waitlist.findUnique({ where: { id: waitlistId } });
    if (!row || row.confirmedAt || row.unsubscribedAt) {
      return;
    }

    const [confirmToken, unsubToken] = await Promise.all([
      signConfirmToken(waitlistId),
      signUnsubscribeToken(waitlistId),
    ]);

    await sendWaitlistConfirm(db, {
      to: email,
      locale,
      confirmUrl: buildConfirmUrl(confirmToken, locale),
      unsubscribeUrl: buildUnsubscribeUrl(unsubToken, locale),
      oneClickUnsubscribeUrl: buildOneClickUnsubscribeUrl(unsubToken),
      waitlistId,
      tenantId,
    });
  });
}

async function handleWaitlistWelcome(job: Job<WaitlistWelcomeJob>): Promise<void> {
  const { waitlistId, tenantId, email, locale } = job.data;

  await withTenantTx(tenantId, async (db) => {
    const row = await db.waitlist.findUnique({ where: { id: waitlistId } });
    if (!row || !row.confirmedAt || row.welcomedAt || row.unsubscribedAt) {
      return;
    }

    const unsubToken = await signUnsubscribeToken(waitlistId);

    await sendWaitlistWelcome(db, {
      to: email,
      locale,
      homeUrl: buildHomeUrl(locale),
      unsubscribeUrl: buildUnsubscribeUrl(unsubToken, locale),
      oneClickUnsubscribeUrl: buildOneClickUnsubscribeUrl(unsubToken),
      waitlistId,
      tenantId,
    });

    await db.waitlist.update({
      where: { id: waitlistId },
      data: { welcomedAt: new Date() },
    });
  });
}

export type EmailWorkerHandle = {
  stop: () => Promise<void>;
};

export async function runEmailWorker(): Promise<EmailWorkerHandle> {
  const boss = await getBoss();

  await boss.work<WaitlistConfirmJob>(
    QUEUE_NAMES.waitlistConfirm,
    { batchSize: 5, pollingIntervalSeconds: 2 },
    async (jobs) => {
      for (const job of jobs) {
        try {
          await handleWaitlistConfirm(job);
        } catch (err) {
          console.error('[worker] waitlist confirm failed', { jobId: job.id, err });
          throw err;
        }
      }
    },
  );

  await boss.work<WaitlistWelcomeJob>(
    QUEUE_NAMES.waitlistWelcome,
    { batchSize: 5, pollingIntervalSeconds: 2 },
    async (jobs) => {
      for (const job of jobs) {
        try {
          await handleWaitlistWelcome(job);
        } catch (err) {
          console.error('[worker] waitlist welcome failed', { jobId: job.id, err });
          throw err;
        }
      }
    },
  );

  console.log('[worker] email worker started — listening on', Object.values(QUEUE_NAMES));

  return {
    stop: async () => {
      await boss.stop({ graceful: true, timeout: 10_000 });
    },
  };
}
