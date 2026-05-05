import type { PgBoss } from 'pg-boss';
import { prisma, AlertChannel, JobStatus } from '@agconn/db';
import { enqueueSms } from '@agconn/sms';

const QUEUE = 'saved-search.tick';
const SCHEDULE = '*/30 * * * *'; // every 30 minutes

// Saved-search dispatcher: every 30m, scans active saved searches, finds
// JobPostings posted since the last notification, and enqueues an SMS for
// each match. Bounded to one SMS per saved-search per tick so we don't blast
// a worker with 50 messages.

export async function runSavedSearchDispatcher(boss: PgBoss): Promise<void> {
  await boss.createQueue(QUEUE);
  await boss.work(QUEUE, async () => {
    await tick();
  });
  await boss.schedule(QUEUE, SCHEDULE);
  console.log(`[saved-search-dispatcher] subscribed; cron=${SCHEDULE}`);
}

async function tick(): Promise<void> {
  const now = new Date();
  const searches = await prisma.savedSearch.findMany({
    where: {
      alertActive: true,
      alertChannel: { in: [AlertChannel.sms, AlertChannel.both] },
      deletedAt: null,
    },
    take: 500,
  });

  for (const s of searches) {
    try {
      const since = s.lastNotifiedAt ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
      const filters = (s.filters as Record<string, unknown>) ?? {};

      const where = {
        status: JobStatus.active,
        deletedAt: null,
        publishedAt: { gt: since },
        ...buildFiltersWhere(filters),
      };

      const match = await prisma.jobPosting.findFirst({
        where,
        orderBy: { publishedAt: 'desc' },
        include: { employer: { include: { employerProfile: true } } },
      });

      if (!match || !match.seoSlug) continue;

      // Saved searches are platform-level (worker-owned, bucket 2); the SMS is
      // attributed to the matched job's tenant so smsLog/auditEvent rows land
      // on the employer who triggered the alert.
      await enqueueSms({
        tenantId: match.tenantId,
        userId: s.workerId,
        template: 'job.alert',
        vars: {
          jobTitle: match.titleEn,
          county: String(match.county),
          wageMin: String(Number(match.wageMin.toString())),
          wageMax: String(Number(match.wageMax.toString())),
          slug: match.seoSlug,
        },
        jobKey: `job.alert-${s.id}-${match.id}`,
      });

      await prisma.savedSearch.update({
        where: { id: s.id },
        data: { lastNotifiedAt: now },
      });
    } catch (e) {
      console.error('[saved-search-dispatcher] match failed', {
        savedSearchId: s.id,
        err: e instanceof Error ? e.message : String(e),
      });
    }
  }
}

function buildFiltersWhere(filters: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (Array.isArray(filters.county) && filters.county.length > 0) {
    out.county = { in: filters.county as string[] };
  }
  if (Array.isArray(filters.skills) && filters.skills.length > 0) {
    out.skills = { hasSome: filters.skills as string[] };
  }
  if (typeof filters.wageMin === 'number') {
    out.wageMax = { gte: filters.wageMin };
  }
  if (typeof filters.wageMax === 'number') {
    out.wageMin = { lte: filters.wageMax };
  }
  if (typeof filters.startBefore === 'string') {
    out.startDate = { lte: new Date(filters.startBefore) };
  }
  if (typeof filters.startAfter === 'string') {
    out.startDate = {
      ...((out.startDate as object | undefined) ?? {}),
      gte: new Date(filters.startAfter),
    };
  }
  return out;
}
