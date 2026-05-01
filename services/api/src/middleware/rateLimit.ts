import type { MiddlewareHandler } from 'hono';
import { err } from '@agconn/api-client/server';

type Bucket = { count: number; resetAt: number };

type Window = {
  windowMs: number;
  max: number;
  store: Map<string, Bucket>;
};

function take(window: Window, key: string, now: number): boolean {
  const bucket = window.store.get(key);
  if (!bucket || bucket.resetAt < now) {
    window.store.set(key, { count: 1, resetAt: now + window.windowMs });
    return true;
  }
  if (bucket.count >= window.max) return false;
  bucket.count++;
  return true;
}

function gc(store: Map<string, Bucket>, now: number): void {
  if (store.size < 1000) return;
  for (const [key, bucket] of store) {
    if (bucket.resetAt < now) store.delete(key);
  }
}

function clientIp(c: Parameters<MiddlewareHandler>[0]): string {
  const fwd = c.req.header('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  const real = c.req.header('x-real-ip');
  if (real) return real;
  return 'unknown';
}

export function rateLimit(opts: { windows: { windowMs: number; max: number }[] }): MiddlewareHandler {
  const windows: Window[] = opts.windows.map((w) => ({
    windowMs: w.windowMs,
    max: w.max,
    store: new Map(),
  }));

  return async (c, next) => {
    const ip = clientIp(c);
    const now = Date.now();

    for (const w of windows) {
      gc(w.store, now);
      if (!take(w, ip, now)) {
        return err(c, 429, 'rate_limited');
      }
    }
    await next();
  };
}
