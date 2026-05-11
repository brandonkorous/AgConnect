import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import type { NextRequest, NextResponse } from 'next/server';
import {
  adminClerkPublishableKey,
  adminClerkSecretKey,
  clerkConfigured,
} from './lib/clerk';

// Next 16 calls this file `proxy.ts` (renamed from `middleware.ts`).
//
// Admin uses a dedicated Clerk instance — separate publishableKey/secretKey
// from apps/web. Public routes are limited to the sign-in surface and the
// 403 page; everything else requires a session. The admin-org membership
// assertion runs in src/lib/admin-auth.ts (server-side) because it needs to
// call the Clerk API, which doesn't belong in edge middleware.

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/forbidden',
  '/sso-callback(.*)',
  '/monitoring(.*)',
]);

export default clerkConfigured
  ? clerkMiddleware(
      async (auth, req) => {
        if (!isPublicRoute(req)) {
          await auth.protect();
        }
      },
      {
        publishableKey: adminClerkPublishableKey,
        secretKey: adminClerkSecretKey,
      },
    )
  : (_req: NextRequest): NextResponse | undefined => undefined;

export const config = {
  matcher: ['/((?!api|_next|_vercel|__dev|og|.*\\..*).*)'],
};
