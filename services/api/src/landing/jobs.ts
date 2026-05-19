import { Hono } from 'hono';
import { ok, err } from '@agconn/api-client/server';
import { JobStatus, type County } from '@agconn/db';
import { anonymousMiddleware, type AnonymousVars } from '../middleware/tenantContext.js';
import { publicJobsQuerySchema, type PublicJobsSort } from './schemas.js';

// Anonymous read-only job browse — used by SEO surfaces at /[locale]/jobs.
// Reads are scoped by the marketplace RLS policy on `job_postings`, which
// permits the `anonymous` role to SELECT active, non-deleted rows across
// every tenant. No app-layer tenant filter required.

export const publicJobsRoutes = new Hono<{ Variables: AnonymousVars }>();
publicJobsRoutes.use('*', anonymousMiddleware('landing'));

publicJobsRoutes.get('/', async (c) => {
    const url = new URL(c.req.url);
    const parsed = publicJobsQuerySchema.safeParse({
        county: url.searchParams.get('county') ?? undefined,
        sort: url.searchParams.get('sort') ?? undefined,
        limit: url.searchParams.get('limit') ?? undefined,
        cursor: url.searchParams.get('cursor') ?? undefined,
    });
    if (!parsed.success) {
        return err(c, 400, 'invalid_query');
    }
    const { county, sort, limit, cursor } = parsed.data;

    let keyset: ReturnType<typeof keysetWhere> | null = null;
    if (cursor) {
        const decoded = decodeCursor(cursor);
        if (!decoded) return err(c, 400, 'invalid_cursor');
        // A cursor is only valid for the sort it was minted under — replaying
        // it under a different sort would walk the wrong keyset and emit a
        // corrupt page.
        if (decoded.sort !== sort) return err(c, 400, 'cursor_sort_mismatch');
        keyset = keysetWhere(sort, decoded);
    }

    const where = {
        status: JobStatus.active,
        deletedAt: null,
        ...(county ? { county: county as County } : {}),
        ...(keyset ?? {}),
    };

    const rows = await c.var.db.jobPosting.findMany({
        where,
        orderBy: orderByFor(sort),
        take: limit + 1,
        include: { employer: { select: { legalName: true, dbaName: true } } },
    });

    const slice = rows.slice(0, limit);
    const hasMore = rows.length > limit;
    const last = slice[slice.length - 1];
    const nextCursor =
        hasMore && last ? encodeCursor(sort, last) : null;

    return ok(c, {
        jobs: slice.map(shapePublicJob),
        nextCursor,
    });
});

publicJobsRoutes.get('/:slug', async (c) => {
    const slug = c.req.param('slug');
    const job = await c.var.db.jobPosting.findFirst({
        where: { seoSlug: slug, deletedAt: null },
        include: { employer: { select: { legalName: true, dbaName: true } } },
    });
    if (!job) return err(c, 404, 'not_found');
    // A slug that once published but is now closed/filled or whose draft was
    // pulled returns 410 — tells crawlers to drop the URL and lets the frontend
    // render a "this listing has closed" page instead of a generic 404.
    if (job.status !== JobStatus.active) return err(c, 410, 'job_gone');

    return ok(c, {
        ...shapePublicJob(job),
        descriptionEn: job.descriptionEn,
        descriptionEs: job.descriptionEs,
        applyBy: job.applyBy?.toISOString().slice(0, 10) ?? null,
        publishedAt: job.publishedAt?.toISOString() ?? null,
    });
});

publicJobsRoutes.get('/sitemap/list', async (c) => {
    const rows = await c.var.db.jobPosting.findMany({
        where: { status: JobStatus.active, deletedAt: null },
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

function shapePublicJob(j: {
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
        legalName: string;
        dbaName: string | null;
    } | null;
}) {
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
            j.employer?.dbaName ??
            j.employer?.legalName ??
            'AGCONN employer',
        employerVerified: Boolean(j.employer),
        skills: j.skills,
        housing: j.housing,
        transport: j.transport,
        createdAt: j.createdAt.toISOString(),
    };
}

interface CursorData {
    sort: PublicJobsSort;
    k: string; // sort-key value: ISO date for recent/start_soon, decimal string for wage_*
    id: string;
}

function orderByFor(sort: PublicJobsSort) {
    switch (sort) {
        case 'wage_desc':
            return [{ wageMin: 'desc' as const }, { id: 'desc' as const }];
        case 'wage_asc':
            return [{ wageMin: 'asc' as const }, { id: 'asc' as const }];
        case 'start_soon':
            return [{ startDate: 'asc' as const }, { id: 'asc' as const }];
        case 'recent':
        default:
            return [{ createdAt: 'desc' as const }, { id: 'desc' as const }];
    }
}

function keysetWhere(sort: PublicJobsSort, cur: CursorData) {
    switch (sort) {
        case 'wage_desc':
            return { OR: [{ wageMin: { lt: cur.k } }, { wageMin: cur.k, id: { lt: cur.id } }] };
        case 'wage_asc':
            return { OR: [{ wageMin: { gt: cur.k } }, { wageMin: cur.k, id: { gt: cur.id } }] };
        case 'start_soon': {
            const d = new Date(cur.k);
            return { OR: [{ startDate: { gt: d } }, { startDate: d, id: { gt: cur.id } }] };
        }
        case 'recent':
        default: {
            const d = new Date(cur.k);
            return { OR: [{ createdAt: { lt: d } }, { createdAt: d, id: { lt: cur.id } }] };
        }
    }
}

function encodeCursor(
    sort: PublicJobsSort,
    row: { createdAt: Date; startDate: Date; wageMin: { toString: () => string }; id: string },
): string {
    const k =
        sort === 'recent'
            ? row.createdAt.toISOString()
            : sort === 'start_soon'
                ? row.startDate.toISOString()
                : row.wageMin.toString();
    return Buffer.from(JSON.stringify({ sort, k, id: row.id })).toString('base64url');
}

function decodeCursor(s: string): CursorData | null {
    try {
        const o = JSON.parse(Buffer.from(s, 'base64url').toString('utf8')) as Record<string, unknown>;
        const { sort, k, id } = o;
        if (typeof k !== 'string' || typeof id !== 'string') return null;
        if (
            sort !== 'recent' &&
            sort !== 'wage_desc' &&
            sort !== 'wage_asc' &&
            sort !== 'start_soon'
        ) {
            return null;
        }
        return { sort, k, id };
    } catch {
        return null;
    }
}
