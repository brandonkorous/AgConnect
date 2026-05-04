import { expect, test } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3001';
const FAKE_UUID = '00000000-0000-0000-0000-000000000000';

// Auth gating contract for every employer endpoint touched by /employer/crews.
// All routes under /v1/employer/* require an authenticated employer session.
// Without it the API must answer with a 401 envelope shaped:
//   { ok: false, error: { code: "unauthenticated", message, toast } }

test.describe('employer crews/shifts/hires API · auth gate', () => {
  const cases: Array<{ method: 'GET' | 'POST' | 'PATCH' | 'DELETE'; path: string }> = [
    { method: 'GET', path: '/v1/employer/crews' },
    { method: 'POST', path: '/v1/employer/crews' },
    { method: 'GET', path: `/v1/employer/crews/${FAKE_UUID}` },
    { method: 'PATCH', path: `/v1/employer/crews/${FAKE_UUID}` },
    { method: 'DELETE', path: `/v1/employer/crews/${FAKE_UUID}` },
    { method: 'POST', path: `/v1/employer/crews/${FAKE_UUID}/members` },
    { method: 'DELETE', path: `/v1/employer/crews/${FAKE_UUID}/members/u_x` },
    { method: 'POST', path: `/v1/employer/crews/${FAKE_UUID}/foreman` },
    { method: 'GET', path: '/v1/employer/shifts' },
    { method: 'POST', path: '/v1/employer/shifts' },
    { method: 'GET', path: `/v1/employer/shifts/${FAKE_UUID}` },
    { method: 'PATCH', path: `/v1/employer/shifts/${FAKE_UUID}` },
    { method: 'DELETE', path: `/v1/employer/shifts/${FAKE_UUID}` },
    { method: 'POST', path: `/v1/employer/shifts/${FAKE_UUID}/assign` },
    { method: 'PATCH', path: `/v1/employer/shifts/${FAKE_UUID}/assignments/${FAKE_UUID}` },
    { method: 'POST', path: `/v1/employer/shifts/${FAKE_UUID}/duplicate` },
    { method: 'GET', path: '/v1/employer/hires' },
    {
      method: 'GET',
      path: '/v1/employer/weather/forecast?lat=36.74&lng=-119.78&date=2026-06-01',
    },
  ];

  for (const c of cases) {
    test(`${c.method} ${c.path} returns 401 envelope when unauthenticated`, async ({
      request,
    }) => {
      const url = `${API_BASE}${c.path}`;
      const opts = c.method === 'GET' || c.method === 'DELETE' ? {} : { data: {} };
      const res =
        c.method === 'GET'
          ? await request.get(url)
          : c.method === 'POST'
            ? await request.post(url, opts)
            : c.method === 'PATCH'
              ? await request.patch(url, opts)
              : await request.delete(url);
      expect(res.status()).toBe(401);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe('unauthenticated');
      expect(typeof body.error.message).toBe('string');
    });
  }
});

// Schedule CSV export inherits the same auth gate.
test('GET /v1/employer/shifts/schedule.csv requires auth', async ({ request }) => {
  const res = await request.get(`${API_BASE}/v1/employer/shifts/schedule.csv?from=2026-05-04`);
  expect(res.status()).toBe(401);
});
