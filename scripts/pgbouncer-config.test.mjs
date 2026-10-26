import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDatabaseUrl, pgbouncerIni, pooledUrl, readEnv, userlist } from './pgbouncer-config.mjs';

const RAW = 'postgresql://agconn_app:p%40ss%22w@psql-agconn-prod-cus.postgres.database.azure.com:5432/agconn?sslmode=require';

test('reads DATABASE_URL from a dotenv body and keeps = inside the value', () => {
  assert.equal(readEnv('A=1\nDATABASE_URL=x?a=b\n', 'DATABASE_URL'), 'x?a=b');
  assert.equal(readEnv('A=1\n', 'DATABASE_URL'), undefined);
});

test('parses user, decoded password, host and database', () => {
  assert.deepEqual(parseDatabaseUrl(RAW), {
    user: 'agconn_app',
    password: 'p@ss"w',
    host: 'psql-agconn-prod-cus.postgres.database.azure.com',
    port: '5432',
    database: 'agconn',
  });
});

test('refuses a URL with no password', () => {
  assert.throws(() => parseDatabaseUrl('postgresql://agconn_app@h:5432/agconn'));
});

test('ini is transaction mode with TLS to the server and 40 server connections at most', () => {
  const ini = pgbouncerIni(parseDatabaseUrl(RAW));
  assert.match(ini, /^agconn = host=psql-agconn-prod-cus\.postgres\.database\.azure\.com port=5432 dbname=agconn$/m);
  assert.match(ini, /^pool_mode = transaction$/m);
  assert.match(ini, /^server_tls_sslmode = require$/m);
  assert.match(ini, /^default_pool_size = 20$/m);
  assert.match(ini, /^max_db_connections = 40$/m);
  assert.doesNotMatch(ini, /user=/);
});

test('userlist doubles embedded quotes', () => {
  assert.equal(userlist(parseDatabaseUrl(RAW)), '"agconn_app" "p@ss""w"\n');
});

test('pooled URL points at PgBouncer over plain in-cluster TCP', () => {
  const url = new URL(pooledUrl(RAW, 'pgbouncer.agconn.svc.cluster.local'));
  assert.equal(url.host, 'pgbouncer.agconn.svc.cluster.local:5432');
  assert.equal(url.searchParams.get('sslmode'), 'disable');
  assert.equal(decodeURIComponent(url.password), 'p@ss"w');
  assert.equal(url.pathname, '/agconn');
});
