import { test } from 'node:test';
import assert from 'node:assert/strict';
import { poolConfig } from './pools.js';

test('pool connections stay warm instead of closing after 10 s', () => {
  const cfg = poolConfig('landing', 8, 'postgresql://u:p@db.test/x');
  assert.equal(cfg.idleTimeoutMillis, 300_000);
  assert.equal(cfg.keepAlive, true);
  assert.equal(cfg.max, 8);
  assert.equal(cfg.application_name, 'agconn-landing');
});
