import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiAccess, bearerFallback } from './admin-access.ts';

test('bearer fallback is never used in production', () => {
  assert.equal(bearerFallback('secret', 'production'), null);
});

test('bearer fallback works in dev and test', () => {
  assert.equal(bearerFallback('secret', 'development'), 'Bearer secret');
  assert.equal(bearerFallback('secret', 'test'), 'Bearer secret');
});

test('no token means no fallback', () => {
  assert.equal(bearerFallback('', 'development'), null);
});

test('anonymous callers are unauthenticated', () => {
  assert.equal(apiAccess(null, null, false), 'unauthenticated');
  assert.equal(apiAccess(undefined, 'org_1', true), 'unauthenticated');
});

test('signed-in non-admins are forbidden', () => {
  assert.equal(apiAccess('user_1', null, false), 'forbidden');
  assert.equal(apiAccess('user_1', 'org_1', false), 'forbidden');
  assert.equal(apiAccess('user_1', null, true), 'forbidden');
});

test('admins are allowed', () => {
  assert.equal(apiAccess('user_1', 'org_1', true), 'allow');
});
