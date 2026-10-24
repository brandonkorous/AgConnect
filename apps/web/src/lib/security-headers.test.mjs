import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECURITY_HEADERS } from './security-headers.ts';

const byKey = Object.fromEntries(SECURITY_HEADERS.map((h) => [h.key, h.value]));

test('HSTS, nosniff and a report-only CSP are sent', () => {
  assert.match(byKey['Strict-Transport-Security'], /^max-age=31536000/);
  assert.equal(byKey['X-Content-Type-Options'], 'nosniff');
  assert.match(byKey['Content-Security-Policy-Report-Only'], /default-src 'self'/);
  assert.match(byKey['Content-Security-Policy-Report-Only'], /frame-ancestors/);
});
