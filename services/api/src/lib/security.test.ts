import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Hono } from 'hono';
import { allowedOrigins, corsMiddleware, securityHeaders } from './security.js';

function app() {
  const a = new Hono();
  a.use('*', securityHeaders());
  a.use('*', corsMiddleware(allowedOrigins({ NODE_ENV: 'production' })));
  a.get('/x', (c) => c.text('ok'));
  return a;
}

const get = (origin?: string) => app().request('/x', { headers: origin ? { origin } : {} });

test('a listed origin is reflected with credentials', async () => {
  const res = await get('https://admin.agconn.com');
  assert.equal(res.headers.get('access-control-allow-origin'), 'https://admin.agconn.com');
  assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
});

test('any other origin gets no CORS grant', async () => {
  const res = await get('https://evil.example');
  assert.equal(res.headers.get('access-control-allow-origin'), null);
});

test('security headers are set on every response', async () => {
  const res = await get();
  assert.match(res.headers.get('strict-transport-security') ?? '', /max-age=\d+/);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('cross-origin-resource-policy'), 'same-site');
});

test('localhost is allowed only outside production', () => {
  assert.equal(allowedOrigins({ NODE_ENV: 'production' }).has('http://localhost:3000'), false);
  assert.equal(allowedOrigins({ NODE_ENV: 'development' }).has('http://localhost:3000'), true);
  assert.equal(allowedOrigins({ CORS_EXTRA_ORIGINS: 'https://a.test, https://b.test' }).has('https://b.test'), true);
});
