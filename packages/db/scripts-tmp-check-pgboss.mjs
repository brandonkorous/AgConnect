import pg from 'pg';
const { Client } = pg;
const c = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/agconn' });
await c.connect();
const counts = await c.query(`
  SELECT
    (SELECT COUNT(*)::int FROM pgboss.job_common WHERE state IN ('created','retry','active')) AS pending_jobs,
    (SELECT COUNT(*)::int FROM pgboss.queue) AS queues,
    (SELECT COUNT(*)::int FROM pgboss.schedule) AS schedules
`);
console.log('pgboss state:', counts.rows[0]);
await c.end();
