import { wizelensHono } from '@wizeworks/lens-node';
import { startWizeLens } from '@agconn/db/wizelens';

// WizeLens request tracing: each request's timeline with its Prisma queries and
// outgoing fetches (Supabase, Clerk, Stripe, Twilio, Resend). Dashboard at
// http://localhost:3001/_wizelens in development; send-only in production.
// See packages/db/src/wizelens.ts for when it is on.
//
// index.ts imports this module before any route, so the Prisma hook is set
// before the first pool is built.

export const wizelens = startWizeLens('agconn-api');

/** Hono middleware. Mount it first so its span wraps every other middleware. */
export const wizelensMiddleware = wizelens ? wizelensHono(wizelens) : undefined;
