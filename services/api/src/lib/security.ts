import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

const PROD_ORIGINS = ['https://agconn.com', 'https://www.agconn.com', 'https://admin.agconn.com'];
const DEV_ORIGINS = ['http://localhost:3000', 'http://localhost:3100'];

type Env = Record<string, string | undefined>;

// Browser origins allowed to call the API with credentials. CORS_EXTRA_ORIGINS adds more (comma list).
export function allowedOrigins(env: Env = process.env): Set<string> {
  const extra = (env.CORS_EXTRA_ORIGINS ?? '').split(',').map((o) => o.trim());
  const configured = [env.PUBLIC_WEB_URL, env.NEXT_PUBLIC_ADMIN_URL, ...extra];
  const dev = env.NODE_ENV === 'production' ? [] : DEV_ORIGINS;
  return new Set([...PROD_ORIGINS, ...dev, ...configured].filter((o): o is string => !!o));
}

export function corsMiddleware(origins: Set<string> = allowedOrigins()) {
  return cors({
    origin: (origin) => (origins.has(origin) ? origin : null),
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
    exposeHeaders: ['x-correlation-id'],
    credentials: true,
  });
}

// HSTS, nosniff, frame and referrer headers; same-site CORP so agconn.com can still embed API files.
export const securityHeaders = () => secureHeaders({ crossOriginResourcePolicy: 'same-site' });
