import { Hono } from 'hono';
import { ok, err } from '@agconn/api-client/server';
import { ProgramStatus, type County, type Funder } from '@agconn/db';
import { publicTenantMiddleware, type TenantVars } from '../middleware/tenantContext';

// Anonymous read-only training browse — used by SEO surfaces at
// /[locale]/training and /[locale]/training/[slug].

export const publicTrainingRoutes = new Hono<{ Variables: TenantVars }>();
publicTrainingRoutes.use('*', publicTenantMiddleware);

const PAGE_SIZE = 20;

publicTrainingRoutes.get('/', async (c) => {
  const url = new URL(c.req.url);
  const county = url.searchParams.get('county') ?? undefined;
  const funder = url.searchParams.get('funder') ?? undefined;
  const cursor = url.searchParams.get('cursor') ?? undefined;
  const decoded = cursor ? decodeCursor(cursor) : null;

  const where = {
    tenantId: c.var.tenantId,
    status: { in: [ProgramStatus.active, ProgramStatus.full] },
    deletedAt: null,
    ...(county ? { county: county as County } : {}),
    ...(funder ? { funder: funder as Funder } : {}),
    ...(decoded
      ? {
          OR: [
            { startDate: { gt: decoded.startDate } },
            { startDate: decoded.startDate, id: { gt: decoded.id } },
          ],
        }
      : {}),
  };

  const rows = await c.var.db.trainingProgram.findMany({
    where,
    orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
    take: PAGE_SIZE + 1,
  });

  const slice = rows.slice(0, PAGE_SIZE);
  const hasMore = rows.length > PAGE_SIZE;
  const last = slice[slice.length - 1];
  const nextCursor =
    hasMore && last ? encodeCursor({ startDate: last.startDate, id: last.id }) : null;

  return ok(c, { programs: slice.map(shape), nextCursor });
});

publicTrainingRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const program = await c.var.db.trainingProgram.findFirst({
    where: { tenantId: c.var.tenantId, seoSlug: slug, deletedAt: null },
    include: { org: { include: { employerProfile: true } } },
  });
  if (!program) return err(c, 404, 'not_found');
  if (program.status === ProgramStatus.draft || program.status === ProgramStatus.archived) {
    return err(c, 404, 'not_found');
  }

  return ok(c, {
    ...shape(program),
    descriptionEn: program.descriptionEn,
    descriptionEs: program.descriptionEs,
    locationName: program.locationName,
    locationAddress: program.locationAddress,
    sessionTimes: program.sessionTimes,
    orgName: program.org?.employerProfile?.legalName ?? 'Training organization',
    spotsLeft: Math.max(0, program.capacity - program.enrolledCount),
  });
});

publicTrainingRoutes.get('/sitemap/list', async (c) => {
  const rows = await c.var.db.trainingProgram.findMany({
    where: {
      tenantId: c.var.tenantId,
      status: { in: [ProgramStatus.active, ProgramStatus.full] },
      deletedAt: null,
    },
    orderBy: { updatedAt: 'desc' },
    take: 5000,
    select: { seoSlug: true, updatedAt: true },
  });
  return ok(c, {
    items: rows
      .filter((r) => r.seoSlug)
      .map((r) => ({ slug: r.seoSlug as string, updatedAt: r.updatedAt.toISOString() })),
  });
});

function shape(p: {
  id: string;
  seoSlug: string | null;
  titleEn: string;
  titleEs: string;
  funder: Funder;
  county: County;
  capacity: number;
  enrolledCount: number;
  startDate: Date;
  endDate: Date;
  topics: string[];
  status: ProgramStatus;
}) {
  return {
    id: p.id,
    seoSlug: p.seoSlug ?? '',
    titleEn: p.titleEn,
    titleEs: p.titleEs,
    funder: p.funder,
    county: p.county,
    capacity: p.capacity,
    enrolledCount: p.enrolledCount,
    startDate: p.startDate.toISOString(),
    endDate: p.endDate.toISOString(),
    topics: p.topics,
    status: p.status,
  };
}

function encodeCursor(cur: { startDate: Date; id: string }): string {
  return Buffer.from(`${cur.startDate.toISOString()}|${cur.id}`).toString('base64url');
}

function decodeCursor(s: string): { startDate: Date; id: string } | null {
  try {
    const decoded = Buffer.from(s, 'base64url').toString('utf8');
    const [iso, id] = decoded.split('|');
    if (!iso || !id) return null;
    return { startDate: new Date(iso), id };
  } catch {
    return null;
  }
}
