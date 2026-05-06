import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { County, JobStatus, PrismaNamespace as Prisma, type Tx } from '@agconn/db';
import {
  CreateSavedSearchBody,
  JobsQuery,
  PatchSavedSearchBody,
  SavedSearchFiltersSchema,
} from '@agconn/schemas';
import { requireAuth, type AuthVars } from '../middleware/authContext';
import type { AuditCtxVars } from '../middleware/audit';

export const jobsRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();

// All worker-facing job routes require auth. Public/anonymous browsing
// is served via Next.js RSC reading directly through the service-role tenant
// middleware (separate router); not built here.
jobsRoutes.use('*', requireAuth('jobs'));

jobsRoutes.get('/', validate('query', JobsQuery), async (c) => {
  const q = c.var.body;

  const limit = q.limit;
  const cursor = q.cursor ? decodeCursor(q.cursor) : null;

  const counties = q.county?.length ? (q.county as County[]) : null;

  // For full-text searches we hit the `search_vector` GIN index directly
  // via raw SQL — Prisma doesn't understand tsvector. For everything else
  // we fall through to the standard query builder. This keeps the search
  // query bilingual + sub-millisecond at scale.
  let rows: Array<{
    id: string;
    seoSlug: string | null;
    titleEn: string;
    titleEs: string;
    county: County;
    city: string | null;
    wageMin: { toString: () => string };
    wageMax: { toString: () => string };
    wageUnit: string;
    startDate: Date;
    endDate: Date | null;
    skills: string[];
    housing: boolean;
    transport: boolean;
    createdAt: Date;
    employer: {
      employerProfile: { legalName: string; dbaName?: string | null } | null;
      email: string | null;
    } | null;
  }>;

  if (q.q) {
    const tsQuery = q.q
      .split(/\s+/)
      .filter(Boolean)
      .map((tok) => tok.replace(/[^\p{L}\p{N}_]/gu, '') + ':*')
      .filter(Boolean)
      .join(' & ');

    const cursorClause = cursor
      ? Prisma.sql`AND (created_at, id) < (${cursor.createdAt}, ${cursor.id}::uuid)`
      : Prisma.empty;
    const ids = await c.var.db.$queryRaw<{ id: string; created_at: Date }[]>(Prisma.sql`
      SELECT id, created_at
      FROM "job_postings"
      WHERE status = 'active'::"JobStatus"
        AND deleted_at IS NULL
        AND search_vector @@ to_tsquery('simple', ${tsQuery})
        ${cursorClause}
      ORDER BY ts_rank(search_vector, to_tsquery('simple', ${tsQuery})) DESC,
               created_at DESC, id DESC
      LIMIT ${limit + 1}
    `);
    if (ids.length === 0) {
      rows = [];
    } else {
      rows = await c.var.db.jobPosting.findMany({
        where: {
          id: { in: ids.map((r) => r.id) },
          deletedAt: null,
          ...(counties ? { county: { in: counties } } : {}),
          ...(q.skills?.length ? { skills: { hasSome: q.skills } } : {}),
          ...(q.wageMin !== undefined ? { wageMax: { gte: q.wageMin } } : {}),
          ...(q.wageMax !== undefined ? { wageMin: { lte: q.wageMax } } : {}),
          ...(q.startBefore ? { startDate: { lte: new Date(q.startBefore) } } : {}),
          ...(q.startAfter ? { startDate: { gte: new Date(q.startAfter) } } : {}),
        },
        include: { employer: { include: { employerProfile: true } } },
      });
      // Preserve FTS rank ordering returned from the raw query.
      const order = new Map(ids.map((r, i) => [r.id, i]));
      rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    }
  } else {
    const where = {
      status: JobStatus.active,
      deletedAt: null,
      ...(counties ? { county: { in: counties } } : {}),
      ...(q.skills?.length ? { skills: { hasSome: q.skills } } : {}),
      ...(q.wageMin !== undefined ? { wageMax: { gte: q.wageMin } } : {}),
      ...(q.wageMax !== undefined ? { wageMin: { lte: q.wageMax } } : {}),
      ...(q.startBefore ? { startDate: { lte: new Date(q.startBefore) } } : {}),
      ...(q.startAfter ? { startDate: { gte: new Date(q.startAfter) } } : {}),
      ...(cursor
        ? {
            OR: [
              { createdAt: { lt: cursor.createdAt } },
              { createdAt: cursor.createdAt, id: { lt: cursor.id } },
            ],
          }
        : {}),
    };

    const orderBy =
      q.sort === 'wage_high'
        ? [{ wageMax: 'desc' as const }, { id: 'desc' as const }]
        : q.sort === 'starts_soon'
          ? [{ startDate: 'asc' as const }, { id: 'desc' as const }]
          : [{ createdAt: 'desc' as const }, { id: 'desc' as const }];

    rows = await c.var.db.jobPosting.findMany({
      where,
      orderBy,
      take: limit + 1,
      include: {
        employer: { include: { employerProfile: true } },
      },
    });
  }

  const slice = rows.slice(0, limit);
  const hasMore = rows.length > limit;
  const last = slice[slice.length - 1];
  const nextCursor =
    hasMore && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null;

  // Total + crop-facet counts use the same filter set as the result list but
  // ignore cursor pagination. cropCounts also drops the skills filter so the
  // chip n's reflect "what would match if I toggled this crop on", not the
  // recursive intersection.
  const totalWhere = {
    status: JobStatus.active,
    deletedAt: null,
    ...(counties ? { county: { in: counties } } : {}),
    ...(q.wageMin !== undefined ? { wageMax: { gte: q.wageMin } } : {}),
    ...(q.wageMax !== undefined ? { wageMin: { lte: q.wageMax } } : {}),
    ...(q.startBefore ? { startDate: { lte: new Date(q.startBefore) } } : {}),
    ...(q.startAfter ? { startDate: { gte: new Date(q.startAfter) } } : {}),
  };

  const CROPS = ['grape', 'almond', 'tomato', 'citrus', 'strawberry', 'lettuce'] as const;
  const [totalCount, ...cropCountList] = await Promise.all([
    c.var.db.jobPosting.count({
      where: {
        ...totalWhere,
        ...(q.skills?.length ? { skills: { hasSome: q.skills } } : {}),
      },
    }),
    ...CROPS.map((crop) =>
      c.var.db.jobPosting.count({
        where: { ...totalWhere, skills: { has: crop } },
      }),
    ),
  ]);
  const cropCounts = Object.fromEntries(
    CROPS.map((crop, i) => [crop, cropCountList[i] ?? 0]),
  ) as Record<(typeof CROPS)[number], number>;

  // Lightweight analytics for content-gap detection.
  await c.var.db.searchView.create({
    data: {
      workerId: c.var.userId,
      filters: q as object,
      resultCount: slice.length,
    },
  });

  return ok(c, {
    jobs: slice.map((j) => shapeJobCard(j)),
    nextCursor,
    totalCount,
    cropCounts,
  });
});

jobsRoutes.get('/recommended', async (c) => {
  const profile = await c.var.db.workerProfile.findUnique({ where: { id: c.var.userId } });
  if (!profile?.county) return ok(c, { jobs: [] });

  const rows = await c.var.db.jobPosting.findMany({
    where: {
      status: JobStatus.active,
      deletedAt: null,
      county: profile.county,
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 30,
    include: { employer: { include: { employerProfile: true } } },
  });

  const ranked = rows
    .map((j) => ({
      ...j,
      matchScore: j.skills.filter((s) => profile.skills.includes(s)).length,
    }))
    .sort(
      (a, b) =>
        b.matchScore - a.matchScore || b.createdAt.getTime() - a.createdAt.getTime(),
    )
    .slice(0, 5);

  return ok(c, {
    jobs: ranked.map((j) => ({ ...shapeJobCard(j), matchScore: j.matchScore })),
  });
});

jobsRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const job = await c.var.db.jobPosting.findFirst({
    where: { seoSlug: slug, status: JobStatus.active, deletedAt: null },
    include: { employer: { include: { employerProfile: true } } },
  });
  if (!job) return err(c, 404, 'not_found');

  const application = await c.var.db.application.findFirst({
    where: { jobId: job.id, workerId: c.var.userId, deletedAt: null },
  });

  return ok(c, {
    ...shapeJobCard(job),
    descriptionEn: job.descriptionEn,
    descriptionEs: job.descriptionEs,
    applyBy: job.applyBy?.toISOString().slice(0, 10) ?? null,
    status: job.status,
    publishedAt: job.publishedAt?.toISOString() ?? null,
    applicationStatus: application?.status ?? null,
    applicationId: application?.id ?? null,
    dailyStartTime: job.dailyStartTime
      ? job.dailyStartTime.toISOString().slice(11, 16)
      : null,
    dailyEndTime: job.dailyEndTime
      ? job.dailyEndTime.toISOString().slice(11, 16)
      : null,
    workingDays: job.workingDays,
    payFrequency: job.payFrequency,
    mealsProvided: job.mealsProvided,
    pickupPoint: job.pickupPoint,
    positionsTotal: job.positionsTotal,
    hireCount: job.hireCount,
  });
});

// Saved searches -----------------------------------------------------------

export const savedSearchRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
savedSearchRoutes.use('*', requireAuth('jobs'));

savedSearchRoutes.get('/', async (c) => {
  const rows = await c.var.db.savedSearch.findMany({
    where: { workerId: c.var.userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  return ok(c, {
    savedSearches: rows.map(shapeSavedSearch),
  });
});

savedSearchRoutes.post('/', validate('json', CreateSavedSearchBody), async (c) => {
  const body = c.var.body;

  if (body.alertActive && (body.alertChannel === 'sms' || body.alertChannel === 'both')) {
    const user = await c.var.db.user.findUnique({ where: { id: c.var.userId } });
    if (!user?.phone) return err(c, 422, 'validation_failed', 'phone_required');
  }

  // 'none' is a UI-level synonym for "no alerts". Persist it as the default
  // channel with alertActive=false so the DB enum (sms|email|both) stays clean.
  const persistChannel: 'sms' | 'email' | 'both' =
    body.alertChannel === 'none' ? 'sms' : body.alertChannel;
  const persistActive = body.alertChannel === 'none' ? false : body.alertActive;

  const created = await c.var.db.savedSearch.create({
    data: {
      workerId: c.var.userId,
      name: body.name ?? null,
      filters: body.filters as object,
      alertChannel: persistChannel,
      alertActive: persistActive,
    },
  });

  await c.var.audit.log({
    action: 'worker.profile.updated',
    resourceId: c.var.userId,
    metadata: { fields: 'saved_search.create' },
  });

  return ok(c, shapeSavedSearch(created));
});

savedSearchRoutes.patch('/:id', validate('json', PatchSavedSearchBody), async (c) => {
  const id = c.req.param('id');
  const body = c.var.body;
  const existing = await c.var.db.savedSearch.findFirst({
    where: { id, workerId: c.var.userId, deletedAt: null },
  });
  if (!existing) return err(c, 404, 'not_found');

  const patchChannel: 'sms' | 'email' | 'both' | undefined =
    body.alertChannel === 'none' ? 'sms' : body.alertChannel;
  const patchActive =
    body.alertChannel === 'none' ? false : body.alertActive ?? undefined;

  const updated = await c.var.db.savedSearch.update({
    where: { id },
    data: {
      name: body.name === null ? null : body.name ?? undefined,
      filters: body.filters as object | undefined,
      alertChannel: patchChannel,
      alertActive: patchActive,
    },
  });
  return ok(c, shapeSavedSearch(updated));
});

savedSearchRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await c.var.db.savedSearch.findFirst({
    where: { id, workerId: c.var.userId, deletedAt: null },
  });
  if (!existing) return err(c, 404, 'not_found');
  await c.var.db.savedSearch.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await c.var.audit.log({
    action: 'worker.profile.updated',
    resourceId: c.var.userId,
    metadata: { fields: 'saved_search.delete' },
  });
  return ok(c, { ok: true });
});

// Helpers ------------------------------------------------------------------

function shapeJobCard(j: {
  id: string;
  seoSlug: string | null;
  titleEn: string;
  titleEs: string;
  county: County;
  city: string | null;
  wageMin: { toString: () => string } | number;
  wageMax: { toString: () => string } | number;
  wageUnit: string;
  startDate: Date;
  endDate: Date | null;
  skills: string[];
  housing: boolean;
  transport: boolean;
  createdAt: Date;
  employer: {
    employerProfile: { legalName: string; dbaName?: string | null } | null;
    email: string | null;
  } | null;
}) {
  // Worker-facing routes only return active jobs, which always have a slug
  // (enforced by the slug_when_active CHECK). Non-active rows shouldn't reach
  // this shaper; if they do, surface as an empty slug rather than crashing.
  return {
    id: j.id,
    seoSlug: j.seoSlug ?? '',
    titleEn: j.titleEn,
    titleEs: j.titleEs,
    county: j.county,
    city: j.city,
    wageMin: Number(j.wageMin.toString()),
    wageMax: Number(j.wageMax.toString()),
    wageUnit: j.wageUnit,
    startDate: j.startDate.toISOString().slice(0, 10),
    endDate: j.endDate ? j.endDate.toISOString().slice(0, 10) : null,
    employerName:
      j.employer?.employerProfile?.dbaName ??
      j.employer?.employerProfile?.legalName ??
      'AgConn employer',
    employerVerified: Boolean(j.employer?.employerProfile),
    skills: j.skills,
    housing: j.housing,
    transport: j.transport,
    createdAt: j.createdAt.toISOString(),
  };
}

function shapeSavedSearch(s: {
  id: string;
  name: string | null;
  filters: unknown;
  alertChannel: string;
  alertActive: boolean;
  lastNotifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: s.id,
    name: s.name,
    filters: s.filters,
    alertChannel: s.alertChannel,
    alertActive: s.alertActive,
    lastNotifiedAt: s.lastNotifiedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

function encodeCursor(cur: { createdAt: Date; id: string }): string {
  return Buffer.from(`${cur.createdAt.toISOString()}|${cur.id}`).toString('base64url');
}

function decodeCursor(s: string): { createdAt: Date; id: string } | null {
  try {
    const decoded = Buffer.from(s, 'base64url').toString('utf8');
    const [iso, id] = decoded.split('|');
    if (!iso || !id) return null;
    return { createdAt: new Date(iso), id };
  } catch {
    return null;
  }
}

// Tx export for callers (unused; kept for parity with other route files).
export type _Tx = Tx;
