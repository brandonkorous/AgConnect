import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isStrayAction } from './stray-action.ts';

test('a next-action header on /api is stray', () => {
  assert.equal(isStrayAction('/api', 'cachefn'), true);
  assert.equal(isStrayAction('/api/reports/placement/export', 'x'), true);
});

test('page actions and plain /api calls are not stray', () => {
  assert.equal(isStrayAction('/reports', 'abc123'), false);
  assert.equal(isStrayAction('/api/reports/placement/export', null), false);
  assert.equal(isStrayAction('/apiary', 'x'), false);
});
