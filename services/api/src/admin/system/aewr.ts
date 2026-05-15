import { Hono } from 'hono';
import { z } from 'zod';
import { ok, err, validate } from '@agconn/api-client/server';
import type { AdminOrgVars } from '../../middleware/adminClerkAuth.js';
import type { AuditCtxVars } from '../../middleware/audit.js';

// Federal H-2A Adverse Effect Wage Rate by state, set annually by USDOL ETA.
// AGCONN references this for payroll comparisons under AB 1513 and worker
// wage transparency. One row per (state_code, effective_from); effective_to
// is null while the row is current.

export const adminAewrRoutes = new Hono<{ Variables: AdminOrgVars & AuditCtxVars }>();

adminAewrRoutes.get('/', async (c) => {
    const stateCode = c.req.query('stateCode')?.toUpperCase();
    const where = stateCode ? { stateCode } : undefined;
    const rows = await c.var.db.aewrRate.findMany({
        where,
        orderBy: [{ stateCode: 'asc' }, { effectiveFrom: 'desc' }],
    });
    return ok(c, { rates: rows });
});

const aewrBody = z
    .object({
        stateCode: z
            .string()
            .length(2)
            .transform((s) => s.toUpperCase()),
        effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD'),
        effectiveTo: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD')
            .nullable()
            .optional(),
        hourlyCents: z.number().int().min(0).max(100000),
        source: z.string().max(200).nullable().optional(),
    })
    .strict();

adminAewrRoutes.post('/', validate('json', aewrBody), async (c) => {
    const b = c.var.body;
    const row = await c.var.db.aewrRate.create({
        data: {
            stateCode: b.stateCode,
            effectiveFrom: new Date(b.effectiveFrom),
            effectiveTo: b.effectiveTo ? new Date(b.effectiveTo) : null,
            hourlyCents: b.hourlyCents,
            source: b.source ?? null,
        },
    });

    await c.var.audit.log({
        action: 'admin.aewr.updated',
        resourceType: 'aewr_rate',
        resourceId: row.id,
        metadata: {
            stateCode: row.stateCode,
            effectiveFrom: row.effectiveFrom.toISOString().slice(0, 10),
            hourlyCents: row.hourlyCents,
        },
    });

    return ok(c, { row });
});

const patchBody = z
    .object({
        effectiveTo: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .nullable()
            .optional(),
        hourlyCents: z.number().int().min(0).max(100000).optional(),
        source: z.string().max(200).nullable().optional(),
    })
    .strict();

adminAewrRoutes.patch('/:id', validate('json', patchBody), async (c) => {
    const id = c.req.param('id');
    const b = c.var.body;
    const row = await c.var.db.aewrRate.update({
        where: { id },
        data: {
            effectiveTo: b.effectiveTo === undefined ? undefined : b.effectiveTo === null ? null : new Date(b.effectiveTo),
            hourlyCents: b.hourlyCents,
            source: b.source,
        },
    });

    await c.var.audit.log({
        action: 'admin.aewr.updated',
        resourceType: 'aewr_rate',
        resourceId: id,
        metadata: {
            stateCode: row.stateCode,
            effectiveFrom: row.effectiveFrom.toISOString().slice(0, 10),
            hourlyCents: row.hourlyCents,
        },
    });

    return ok(c, { row });
});

adminAewrRoutes.delete('/:id', async (c) => {
    if (c.var.orgRole !== 'org:super_admin') {
        return err(c, 403, 'forbidden', 'super_admin required to delete AEWR row');
    }
    const id = c.req.param('id');
    const row = await c.var.db.aewrRate.delete({ where: { id } });
    await c.var.audit.log({
        action: 'admin.aewr.deleted',
        resourceType: 'aewr_rate',
        resourceId: id,
        metadata: {
            stateCode: row.stateCode,
            effectiveFrom: row.effectiveFrom.toISOString().slice(0, 10),
        },
    });
    return ok(c, { deleted: true });
});
