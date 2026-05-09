import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { adminMiddleware, type AdminVars } from '../../middleware/adminContext.js';
import type { AuditCtxVars } from '../../middleware/audit.js';
import {
  getEvent,
  listByActor,
  listByCorrelation,
  listByResource,
  listEvents,
  redactActor,
  verifyEvent,
} from './service.js';
import { listAuditQuery, redactBody } from './schemas.js';

export const adminAuditRoutes = new Hono<{ Variables: AdminVars & AuditCtxVars }>();

adminAuditRoutes.use('*', adminMiddleware('admin'));

adminAuditRoutes.get('/events', validate('query', listAuditQuery), async (c) => {
  const q = c.var.body;
  const result = await listEvents(c.var.db, q);
  await c.var.audit.log({
    action: 'admin.data.exported',
    metadata: {
      exportType: 'audit.events.list',
      rowCount: result.events.length,
      filterDigest: JSON.stringify(q),
    },
  });
  return ok(c, result);
});

adminAuditRoutes.get('/events/:id', async (c) => {
  const idStr = c.req.param('id');
  let id: bigint;
  try {
    id = BigInt(idStr);
  } catch {
    return err(c, 422, 'validation_failed', 'Invalid event id', { fields: { id: 'must be a numeric id' } });
  }

  const verifyParam = c.req.query('verify') === 'true';
  if (verifyParam) {
    const result = await verifyEvent(c.var.db, id);
    if (!result) return err(c, 404, 'not_found');
    return ok(c, result);
  }

  const event = await getEvent(c.var.db, id);
  if (!event) return err(c, 404, 'not_found');
  return ok(c, { event });
});

adminAuditRoutes.get('/correlations/:correlationId', async (c) => {
  const correlationId = c.req.param('correlationId');
  if (!/^[0-9a-f-]{36}$/i.test(correlationId)) {
    return err(c, 422, 'validation_failed', 'Invalid correlation id');
  }
  const events = await listByCorrelation(c.var.db, correlationId);
  return ok(c, { events });
});

adminAuditRoutes.get('/actor/:actorId/timeline', validate('query', listAuditQuery), async (c) => {
  const actorId = c.req.param('actorId');
  const result = await listByActor(c.var.db, actorId, c.var.body);
  return ok(c, result);
});

adminAuditRoutes.get('/resource/:resourceType/:resourceId/history', async (c) => {
  const events = await listByResource(
    c.var.db,
    c.req.param('resourceType'),
    c.req.param('resourceId'),
  );
  return ok(c, { events });
});

adminAuditRoutes.post('/redact', validate('json', redactBody), async (c) => {
  const body = c.var.body;

  const confirm = c.req.header('x-confirm');
  if (!confirm && !body.dryRun) {
    return err(c, 428, 'confirmation_required', 'Second-factor confirmation required');
  }

  const result = await redactActor(c.var.db, body);

  if (!body.dryRun) {
    await c.var.audit.log({
      action: 'admin.audit.redacted',
      resourceId: body.actorId,
      metadata: {
        targetActorId: body.actorId,
        eventCount: result.redactedCount,
        requestId: body.requestId,
      },
    });
  }

  return ok(c, result);
});
