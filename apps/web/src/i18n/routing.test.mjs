import { test } from 'node:test';
import assert from 'node:assert/strict';

test('the NEXT_LOCALE cookie is Secure in production', async () => {
  process.env.NODE_ENV = 'production';
  const { routing } = await import('./routing.ts');
  assert.equal(routing.localeCookie.secure, true);
});
