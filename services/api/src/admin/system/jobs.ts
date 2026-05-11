import { Hono } from 'hono';
import { z } from 'zod';
import { ok, err, validate } from '@agconn/api-client/server';
import type { AdminOrgVars } from '../../middleware/adminClerkAuth.js';
import type { AuditCtxVars } from '../../middleware/audit.js';

// pg-boss v12+ stores jobs in pgboss.job (partitioned by queue name). States:
// created | retry | active | completed | expired | cancelled | failed.
// We read directly via raw SQL — pg-boss does not expose a query API for ops
// dashboards. The admin DB role has read access to the pgboss schema.

export const adminSystemJobsRoutes = new Hono<{ Variables: AdminOrgVars & AuditCtxVars }>();

type QueueDepthRow = {
  name: string;
  state: string;
  count: bigint;
  oldest_created_on: Date | null;
};

adminSystemJobsRoutes.get('/queues', async (c) => {
  const rows = await c.var.db.$queryRawUnsafe<QueueDepthRow[]>(
    `SELECT name, state, COUNT(*)::bigint AS count, MIN(created_on) AS oldest_created_on
     FROM pgboss.job
     WHERE state IN ('created', 'retry', 'active', 'failed')
     GROUP BY name, state
     ORDER BY name, state`,
  ).catch(() => [] as QueueDepthRow[]);

  const byQueue = new Map<
    string,
    { name: string; pending: number; retry: number; active: number; failed: number; oldestPending: string | null }
  >();
  for (const r of rows) {
    const q = byQueue.get(r.name) ?? {
      name: r.name,
      pending: 0,
      retry: 0,
      active: 0,
      failed: 0,
      oldestPending: null,
    };
    const n = Number(r.count);
    if (r.state === 'created') {
      q.pending = n;
      q.oldestPending = r.oldest_created_on?.toISOString() ?? null;
    } else if (r.state === 'retry') q.retry = n;
    else if (r.state === 'active') q.active = n;
    else if (r.state === 'failed') q.failed = n;
    byQueue.set(r.name, q);
  }

  return ok(c, { queues: [...byQueue.values()].sort((a, b) => a.name.localeCompare(b.name)) });
});

const listFailuresQuery = z
  .object({
    queue: z.string().min(1).max(120).optional(),
    state: z.enum(['failed', 'retry', 'active']).default('failed'),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  })
  .strict();

type JobRow = {
  id: string;
  name: string;
  state: string;
  retry_count: number;
  created_on: Date;
  started_on: Date | null;
  completed_on: Date | null;
  output: unknown;
  data: unknown;
};

adminSystemJobsRoutes.get('/recent', validate('query', listFailuresQuery), async (c) => {
  const q = c.var.body;
  const where: string[] = [`state = $1`];
  const params: (string | number)[] = [q.state];
  if (q.queue) {
    where.push(`name = $${params.length + 1}`);
    params.push(q.queue);
  }
  const sql =
    `SELECT id::text, name, state, retry_count, created_on, started_on, completed_on, output, data
     FROM pgboss.job
     WHERE ${where.join(' AND ')}
     ORDER BY COALESCE(completed_on, started_on, created_on) DESC
     LIMIT ${q.limit}`;
  const rows = await c.var.db.$queryRawUnsafe<JobRow[]>(sql, ...params).catch(() => [] as JobRow[]);

  return ok(c, {
    jobs: rows.map((r) => ({
      id: r.id,
      queue: r.name,
      state: r.state,
      retryCount: r.retry_count,
      createdAt: r.created_on.toISOString(),
      startedAt: r.started_on?.toISOString() ?? null,
      completedAt: r.completed_on?.toISOString() ?? null,
      data: r.data,
      output: r.output,
    })),
  });
});

const replayBody = z.object({ id: z.string().uuid() }).strict();

adminSystemJobsRoutes.post('/replay', validate('json', replayBody), async (c) => {
  if (c.var.orgRole !== 'org:super_admin') {
    return err(c, 403, 'forbidden', 'super_admin required to replay jobs');
  }
  const { id } = c.var.body;

  type LookupRow = { name: string; data: unknown };
  const found = await c.var.db
    .$queryRawUnsafe<LookupRow[]>(`SELECT name, data FROM pgboss.job WHERE id = $1::uuid LIMIT 1`, id)
    .catch(() => [] as LookupRow[]);
  if (found.length === 0) return err(c, 404, 'not_found');
  const original = found[0]!;

  // Re-insert as a fresh 'created' job. pg-boss will pick it up on the next
  // polling cycle. Idempotency keys (singleton_key) intentionally left null
  // so replays can succeed even if the original was singleton-keyed.
  type InsertedRow = { id: string };
  const inserted = await c.var.db.$queryRawUnsafe<InsertedRow[]>(
    `INSERT INTO pgboss.job (id, name, data, state, retry_limit, retry_delay, retry_backoff,
       start_after, singleton_key, expire_in, keep_until, priority)
     SELECT gen_random_uuid(), $1, $2::jsonb, 'created', retry_limit, retry_delay, retry_backoff,
            NOW(), NULL, expire_in, NOW() + INTERVAL '7 days', priority
     FROM pgboss.job WHERE id = $3::uuid LIMIT 1
     RETURNING id::text`,
    original.name,
    JSON.stringify(original.data ?? {}),
    id,
  );

  const newId = inserted[0]?.id ?? null;
  await c.var.audit.log({
    action: 'admin.job.replayed',
    resourceType: 'pgboss_job',
    resourceId: newId ?? id,
    metadata: { jobId: id, queueName: original.name },
  });

  return ok(c, { replayedAs: newId });
});
