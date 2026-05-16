import { Hono } from 'hono';
import { ok, err } from '@agconn/api-client/server';
import { JobStatus, type County } from '@agconn/db';
import { anonymousMiddleware, type AnonymousVars } from '../middleware/tenantContext.js';

// Anonymous read-only job browse — used by SEO surfaces at /[locale]/jobs.
// Reads are scoped by the marketplace RLS policy on `job_postings`, which
// permits the `anonymous` role to SELECT active, non-deleted rows across
// every tenant. No app-layer tenant filter required.

export const publicJobsRoutes = new Hono<{ Variables: AnonymousVars }>();
publicJobsRoutes.use('*', anonymousMiddleware('landing'));

const PAGE_SIZE = 20;

publicJobsRoutes.get('/', async (c) => {
    const url = new URL(c.req.url);
    const county = url.searchParams.get('county') ?? undefined;
    const cursor = url.searchParams.get('cursor') ?? undefined;

    const decoded = cursor ? decodeCursor(cursor) : null;

    const where = {
        status: JobStatus.active,
        deletedAt: null,
        ...(county ? { county: county as County } : {}),
        ...(decoded
            ? {
                OR: [
                    { createdAt: { lt: decoded.createdAt } },
                    { createdAt: decoded.createdAt, id: { lt: decoded.id } },
                ],
            }
            : {}),
    };

    const rows = await c.var.db.jobPosting.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: PAGE_SIZE + 1,
        include: { employer: { select: { legalName: true, dbaName: true } } },
    });

    const slice = rows.slice(0, PAGE_SIZE);
    const hasMore = rows.length > PAGE_SIZE;
    const last = slice[slice.length - 1];
    const nextCursor =
        hasMore && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null;

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
