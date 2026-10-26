// pg-boss lives in the pgboss schema, which a migration creates and db-role.sql gives to agconn_app.
// createSchema stays off: CREATE SCHEMA IF NOT EXISTS checks CREATE on the database first, which agconn_app lacks.
export function pgBossOptions(connectionString: string) {
  return { connectionString, schema: 'pgboss', createSchema: false };
}
