import { expect, test } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3001';

test.describe('API smoke', () => {
  test('GET /health returns ok envelope', async ({ request }) => {
    const res = await request.get(`${API_BASE}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, data: { status: 'ok' } });
  });

  test('GET /v1/profile without auth returns 401 envelope', async ({ request }) => {
    const res = await request.get(`${API_BASE}/v1/profile`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('unauthenticated');
  });

  test('GET /v1/landing/jobs is publicly accessible', async ({ request }) => {
    const res = await request.get(`${API_BASE}/v1/landing/jobs`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data.jobs)).toBe(true);
  });

  test('GET /v1/landing/training is publicly accessible', async ({ request }) => {
    const res = await request.get(`${API_BASE}/v1/landing/training`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data.programs)).toBe(true);
  });
});
