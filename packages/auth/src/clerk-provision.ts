import { createClerkClient, type ClerkClient } from '@clerk/backend';
import { normalizeUsPhone } from '@agconn/schemas';
import { UserRole, Lang } from '@agconn/db';

// Identity keystone (docs/00-foundation/13-onboarding-identity-remediation/).
// An inbound SMS from an unknown phone provisions a real Clerk user so
// `User.id` is ALWAYS a Clerk `user_*` id — there is no `sms_*` synthetic id
// and therefore no sms-vs-clerk merge problem. Clerk's per-instance phone
// uniqueness performs the dedupe: this is the symmetric counterpart of
// services/api/src/middleware/authContext.ts `provisionFromClerk`
// (Clerk session -> DB user); this is phone -> Clerk user.

let cached: ClerkClient | null = null;

function client(): ClerkClient {
  if (cached) return cached;
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('CLERK_SECRET_KEY is required to provision Clerk users');
  }
  cached = createClerkClient({ secretKey });
  return cached;
}

export type EnsureClerkUserResult = {
  clerkUserId: string;
  created: boolean;
};

async function findByPhone(c: ClerkClient, e164: string): Promise<string | null> {
  const res = await c.users.getUserList({ phoneNumber: [e164] });
  // @clerk/backend v3 returns a paginated { data, totalCount }; older shapes
  // return a bare array. Handle both so a minor SDK bump can't strand us.
  const list = Array.isArray(res) ? res : res.data;
  return list.length > 0 ? list[0].id : null;
}

/**
 * Ensure exactly one Clerk user exists for `phone`, returning its id.
 *
 * Idempotent and race-safe: looks up by phone first; on the create path a
 * concurrent caller that already created the user surfaces as a Clerk 422
 * (duplicate identifier), which we resolve by re-reading. The phone is
 * normalized to strict E.164 via the shared normalizer so Clerk, Twilio, and
 * the DB never disagree on format.
 */
export async function ensureClerkUserByPhone(
  phone: string,
  opts: { role?: UserRole; locale?: Lang } = {},
): Promise<EnsureClerkUserResult> {
  const e164 = normalizeUsPhone(phone);
  if (!e164) {
    throw new Error(`ensureClerkUserByPhone: not a US phone: ${phone}`);
  }
  const c = client();

  const existing = await findByPhone(c, e164);
  if (existing) return { clerkUserId: existing, created: false };

  try {
    const created = await c.users.createUser({
      phoneNumber: [e164],
      skipPasswordRequirement: true,
      unsafeMetadata: {
        role: opts.role ?? UserRole.worker,
        locale: opts.locale ?? Lang.es,
      },
      // Server-only marker so the Clerk user.created webhook can tell an
      // SMS-provisioned identity from a web sign-up and NOT mislabel its
      // consent provenance as web_otp (it is sms_double_opt_in, written by
      // confirmOptIn on YES). privateMetadata is not user-writable.
      privateMetadata: { provisionedVia: 'sms' },
    });
    return { clerkUserId: created.id, created: true };
  } catch (e) {
    // Concurrent inbound for the same phone: the other call won the create.
    // Re-read and return the now-existing user rather than failing the job.
    const raced = await findByPhone(c, e164);
    if (raced) return { clerkUserId: raced, created: false };
    throw e;
  }
}

/**
 * Push a worker's name onto their Clerk user. An SMS-provisioned identity is
 * created by `ensureClerkUserByPhone` with NO name (Clerk has no name until a
 * web sign-up or this call), so without this every SMS-onboarded worker is
 * nameless in Clerk — breaking support tooling, the admin directory, and any
 * future web login that greets them by name. Called from the SMS onboarding
 * completion once first/last are captured and validated. Best-effort at the
 * call site: a Clerk failure must not fail onboarding (the WorkerProfile name
 * is the source of truth for hiring; Clerk is the identity mirror).
 */
export async function updateClerkUserName(
  clerkUserId: string,
  name: { firstName: string; lastName: string },
): Promise<void> {
  await client().users.updateUser(clerkUserId, {
    firstName: name.firstName,
    lastName: name.lastName,
  });
}
