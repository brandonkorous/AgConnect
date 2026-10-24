import { asService, AlertChannel, JobStatus, type Db, type SavedSearch } from '@agconn/db';
import type { enqueueSms } from '@agconn/sms';

// Every tick scans active saved searches, finds JobPostings posted since the
// last notification, and enqueues an SMS for each match. Bounded to one SMS
// per saved-search per tick so we don't blast a worker with 50 messages.

export type SavedSearchTickDeps = {
  db: Pick<Db, 'savedSearch' | 'jobPosting'>;
  enqueue: typeof enqueueSms;
};

// saved_searches and job_postings are FORCE RLS with role-only policies, so the tick runs as 'service'.
export const savedSearchTick = asService(
  async (deps: SavedSearchTickDeps, now: Date = new Date()): Promise<void> => {
    const searches = await deps.db.savedSearch.findMany({
      where: {
        alertActive: true,
        alertChannel: { in: [AlertChannel.sms, AlertChannel.both] },
        deletedAt: null,
      },
      take: 500,
    });
    for (const s of searches) {
      try {
        await notifyOne(deps, s, now);
      } catch (e) {
        console.error('[saved-search-dispatcher] match failed', {
          savedSearchId: s.id,
          err: e instanceof Error ? e.message : String(e),
        });
      }
    }
  },
);

async function notifyOne(deps: SavedSearchTickDeps, s: SavedSearch, now: Date): Promise<void> {
  const since = s.lastNotifiedAt ?? new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const filters = (s.filters as Record<string, unknown>) ?? {};
  const match = await deps.db.jobPosting.findFirst({
    where: {
      status: JobStatus.active,
      deletedAt: null,
      publishedAt: { gt: since },
      ...buildFiltersWhere(filters),
    },
    orderBy: { publishedAt: 'desc' },
  });
  if (!match || !match.seoSlug) return;

  // Saved searches are platform-level (worker-owned, bucket 2); the SMS is
  // attributed to the matched job's tenant so smsLog/auditEvent rows land
  // on the employer who triggered the alert.
  await deps.enqueue({
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
  await deps.db.savedSearch.update({ where: { id: s.id }, data: { lastNotifiedAt: now } });
}

export function buildFiltersWhere(filters: Record<string, unknown>): Record<string, unknown> {
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
