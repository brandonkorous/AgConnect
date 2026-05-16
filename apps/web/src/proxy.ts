import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import type { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

// Next 16 calls this file `proxy.ts` (renamed from `middleware.ts`).
// next-intl handles locale prefixing for marketing + app shell;
// Clerk wraps it so authenticated routes can call auth() server-side.
//
// Public routes (landing, waitlist, offline, auth pages, monitoring tunnel):
//   anyone can hit them without a Clerk session.
// Everything else under /[locale]/dashboard, /[locale]/admin, etc. requires
// a Clerk session.
//
// When Clerk env keys are missing (dev without auth), we fall through to
// pure intl middleware so the marketing surface keeps working.

const intl = createIntlMiddleware(routing);

const isPublicRoute = createRouteMatcher([
  '/',
  '/:locale',
  '/:locale/sign-in(.*)',
  '/:locale/sign-up(.*)',
  '/:locale/worker/sign-up(.*)',
  '/:locale/employer/sign-up(.*)',
  '/:locale/sso-callback(.*)',
  '/:locale/offline',
  '/:locale/confirm',
  '/:locale/unsubscribe',
  '/:locale/jobs(.*)',
  '/:locale/training(.*)',
  '/:locale/verify(.*)',
  '/:locale/faq',
  '/:locale/impact',
  '/:locale/resources(.*)',
  '/:locale/about',
  '/:locale/contact',
  '/:locale/employers',
  '/:locale/partners',
  '/:locale/press(.*)',
  '/:locale/trust',
  '/:locale/careers(.*)',
  '/:locale/skills-wallet',
  '/:locale/worker-rights',
  '/:locale/promotora',
  '/:locale/privacy',
  '/:locale/terms',
  '/:locale/subprocessors',
  '/:locale/sms-consent',
  '/:locale/accessibility',
  '/:locale/workers',
  '/:locale/how-it-works',
  '/:locale/pricing',
  '/api/(.*)',
  '/icons/(.*)',
  '/monitoring(.*)',
  '/sw.js',
  '/manifest.webmanifest',
  '/llms.txt',
  '/robots.txt',
  '/sitemap.xml',
]);

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export default clerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        await auth.protect();
      }
      return intl(req as unknown as NextRequest);
    })
  : ((req: NextRequest): NextResponse | Promise<NextResponse> => intl(req));

export const config = {
  matcher: ['/((?!api|_next|_vercel|__dev|og|monitoring|.*\\..*).*)'],
};
