import type { Job } from 'pg-boss';
import { runWithRlsContext, serviceDb, type Tx } from '@agconn/db';
import {
  QUEUE_NAMES,
  getBoss,
  type WaitlistConfirmJob,
  type WaitlistWelcomeJob,
  type EmployerEmailJob,
  type GrantReportEmailJob,
} from './queue.js';
import {
  sendWaitlistConfirm,
  sendWaitlistWelcome,
  sendEmployerNotice,
  sendGrantReportNotice,
} from './sender.js';
import { signConfirmToken, signUnsubscribeToken } from './tokens.js';

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

// app.role = 'service', scoped to the employer's tenant, or to NULL-tenant rows when tenantId is null.
async function withTenantTx<T>(
  tenantId: string | null,
  fn: (db: Tx) => Promise<T>,
): Promise<T> {
  if (tenantId !== null && !UUID_RE.test(tenantId)) {
    throw new Error(`worker received invalid tenantId: ${tenantId}`);
  }
  return runWithRlsContext({ role: 'service', tenantId: tenantId ?? undefined }, () =>
    serviceDb.$transaction(fn, { timeout: 60_000, maxWait: 10_000 }));
}

async function handleWaitlistConfirm(job: Job<WaitlistConfirmJob>): Promise<void> {
  const { waitlistId, email, locale } = job.data;

  await withTenantTx(null, async (db) => {
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
    });
  });
}

async function handleGrantReportEmail(job: Job<GrantReportEmailJob>): Promise<void> {
  const { template, reportRunId, to, locale, vars } = job.data;
  const downloadUrl = typeof vars['downloadUrl'] === 'string' ? vars['downloadUrl'] : '';
  if (!downloadUrl) {
    console.warn('[worker] grant report email skipped — no downloadUrl', {
      template,
      reportRunId,
    });
    return;
  }

  await withTenantTx(null, async (db) => {
    const unsubscribeUrl = `${publicWebUrl()}/${locale}/admin/reports/runs`;
    const oneClickUnsubscribeUrl = `${publicApiUrl()}/v1/landing/unsubscribe?email=${encodeURIComponent(to)}`;
    await sendGrantReportNotice(db, {
      template,
      to,
      locale,
      vars: Object.fromEntries(
        Object.entries(vars).filter((entry): entry is [string, string | number] => {
          const v = entry[1];
          return v !== null && v !== undefined && typeof v !== 'boolean';
        }),
      ),
      downloadUrl,
      unsubscribeUrl,
      oneClickUnsubscribeUrl,
      reportRunId,
    });
  });
}

async function handleEmployerEmail(job: Job<EmployerEmailJob>): Promise<void> {
  const { template, employerId, tenantId, to, locale, vars } = job.data;

  await withTenantTx(tenantId, async (db) => {
    const employer = await db.employerProfile.findUnique({ where: { id: employerId } });
    if (!employer) return;
    const recipient = to ?? employer.contactEmail;
    if (!recipient) {
      console.warn('[worker] employer email skipped — no recipient', {
        template,
        employerId,
      });
      return;
    }

    // Employers have no signed unsubscribe token; List-Unsubscribe still lets them opt out via suppression.
    const unsubscribeUrl = `${publicWebUrl()}/${locale}/employer/billing`;
    const oneClickUnsubscribeUrl = `${publicApiUrl()}/v1/landing/unsubscribe?employerId=${employerId}`;

    await sendEmployerNotice(db, {
      template,
      to: recipient,
      locale,
      vars: Object.fromEntries(
        Object.entries(vars).filter((entry): entry is [string, string | number] => {
          const v = entry[1];
          return v !== null && v !== undefined;
        }),
      ),
      webBaseUrl: publicWebUrl(),
      unsubscribeUrl,
      oneClickUnsubscribeUrl,
      employerId,
      tenantId,
    });
  });
}

async function handleWaitlistWelcome(job: Job<WaitlistWelcomeJob>): Promise<void> {
  const { waitlistId, email, locale } = job.data;

  await withTenantTx(null, async (db) => {
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

type Boss = Awaited<ReturnType<typeof getBoss>>;

// Each queue handles its jobs one at a time and rethrows, so pg-boss retries a failed job.
async function workEach<T extends object>(boss: Boss, queue: string, label: string, handle: (job: Job<T>) => Promise<void>) {
  await boss.work<T>(queue, { batchSize: 5, pollingIntervalSeconds: 2 }, async (jobs) => {
    for (const job of jobs) {
      try {
        await handle(job);
      } catch (err) {
        const template = (job.data as { template?: string }).template;
        console.error(`[worker] ${label} failed`, { jobId: job.id, template, err });
        throw err;
      }
    }
  });
}

export async function runEmailWorker(): Promise<EmailWorkerHandle> {
  const boss = await getBoss();
  await workEach<WaitlistConfirmJob>(boss, QUEUE_NAMES.waitlistConfirm, 'waitlist confirm', handleWaitlistConfirm);
  await workEach<WaitlistWelcomeJob>(boss, QUEUE_NAMES.waitlistWelcome, 'waitlist welcome', handleWaitlistWelcome);
  await workEach<EmployerEmailJob>(boss, QUEUE_NAMES.employer, 'employer email', handleEmployerEmail);
  await workEach<GrantReportEmailJob>(boss, QUEUE_NAMES.grantReport, 'grant report email', handleGrantReportEmail);
  console.log('[worker] email worker started — listening on', Object.values(QUEUE_NAMES));
  return {
    stop: async () => {
      await boss.stop({ graceful: true, timeout: 10_000 });
    },
  };
}
