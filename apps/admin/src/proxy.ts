import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';
import {
  adminClerkPublishableKey,
  adminClerkSecretKey,
  clerkConfigured,
} from './lib/clerk';
import { isStrayAction } from './lib/stray-action';

// Next 16 calls this file `proxy.ts` (renamed from `middleware.ts`).
//
// Admin uses a dedicated Clerk instance — separate publishableKey/secretKey
// from apps/web. Public routes are limited to the sign-in surface and the
// 403 page; everything else requires a session. The admin-org membership
// assertion runs in src/lib/admin-auth.ts (server-side) because it needs to
// call the Clerk API, which doesn't belong in edge middleware.

function strayAction(req: NextRequest): NextResponse | undefined {
  if (!isStrayAction(req.nextUrl.pathname, req.headers.get('next-action'))) return undefined;
  return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 });
}

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/forbidden',
  '/sso-callback(.*)',
  '/monitoring(.*)',
]);

export default clerkConfigured
  ? clerkMiddleware(
      async (auth, req) => {
        const stray = strayAction(req);
        if (stray) return stray;
        if (!isPublicRoute(req)) {
          await auth.protect();
        }
      },
      {
        publishableKey: adminClerkPublishableKey,
        secretKey: adminClerkSecretKey,
      },
    )
  : (req: NextRequest): NextResponse | undefined => strayAction(req);

export const config = {
  // /api entries: every /api path (export.csv included) runs Clerk, so handlers can read the session.
  matcher: ['/((?!api|_next|_vercel|__dev|og|.*\\..*).*)', '/api', '/api/(.*)'],
};
