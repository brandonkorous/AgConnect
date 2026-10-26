import { test } from 'node:test';
import assert from 'node:assert/strict';
import { poolConfig, poolSize } from './pools.js';

test('pool connections stay warm instead of closing after 10 s', () => {
  const cfg = poolConfig('landing', 8, 'postgresql://u:p@db.test/x');
  assert.equal(cfg.idleTimeoutMillis, 300_000);
  assert.equal(cfg.keepAlive, true);
  assert.equal(cfg.max, 8);
  assert.equal(cfg.application_name, 'agconn-landing');
});

test('DB_POOL_MAX caps a pool and DB_POOL_<NAME> sets one', () => {
  assert.equal(poolSize('worker', {}), 15);
  assert.equal(poolSize('worker', { DB_POOL_MAX: '3' }), 3);
  assert.equal(poolSize('wallet', { DB_POOL_MAX: '8' }), 5);
  assert.equal(poolSize('worker', { DB_POOL_MAX: '3', DB_POOL_WORKER: '6' }), 6);
  assert.equal(poolSize('worker', { DB_POOL_MAX: 'nope' }), 15);
});
