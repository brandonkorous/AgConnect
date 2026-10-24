import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as route from './route.ts';

const METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

test('a stray server-action POST to /api gets 404 JSON', async () => {
  const req = new Request('https://example.test/api', {
    method: 'POST',
    headers: { 'next-action': 'x', rsc: '1' },
  });
  const res = await route.POST(req);
  assert.equal(res.status, 404);
  assert.equal(res.headers.get('content-type'), 'application/json');
});

test('every method answers 404', async () => {
  for (const m of METHODS) assert.equal((await route[m]()).status, 404, m);
});
