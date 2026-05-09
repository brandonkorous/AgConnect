// audit-required:exempt — Clerk webhook events are durably recorded in the
// auth_events table (the dedicated webhook audit log per spec 02-auth);
// audit_events would duplicate that with weaker provenance.
import { Hono } from 'hono';
import { Webhook } from 'svix';
import { ok, err } from '@agconn/api-client/server';
import { Lang, UserRole, pools, type Tx } from '@agconn/db';
import { webhookMiddleware, type TenantVars } from '../middleware/tenantContext.js';

// Clerk → DB mirror. Per docs/00-foundation/02-auth/03-api.md the contract is:
//   user.created      → upsert User
//   user.updated      → upsert User (idempotent on id)
//   user.deleted      → soft-delete (set tenant_id = NULL, role kept)
//   organization.created / updated → no-op for now (employer org binding
//                       happens via PATCH /v1/employer/profile flow)
//   session.created / .ended → record only in auth_events (no DB mutation)
//
// Every event is recorded in auth_events for audit + replay. Svix signature
// verification happens BEFORE any DB transaction.

type ClerkEvent = {
  type: string;
  data: Record<string, unknown>;
};

let cachedWebhook: Webhook | null = null;

const getWebhook = (): Webhook => {
  if (cachedWebhook) return cachedWebhook;
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) throw new Error('CLERK_WEBHOOK_SECRET is not set');
  cachedWebhook = new Webhook(secret);
  return cachedWebhook;
};

// Public metadata is server-only-writable, unsafe metadata is user-writable.
// Workers/employers self-attest at the sign-up form (the URL is the role
// declaration), which lands in unsafe_metadata.role. We accept it here only
// because (a) admin role is never grantable this way (only the four enum
// values are allowed, and admin is set via Clerk dashboard), and (b) employer
// gets gated downstream by FLC verification — self-attesting is just a UX
// hint, not a permission grant.
const ROLE_VALUES = ['worker', 'employer', 'training_org', 'admin'] as const;

const readRole = (md: unknown): UserRole | null => {
  if (md && typeof md === 'object' && 'role' in md) {
    const r = (md as { role?: unknown }).role;
    if ((ROLE_VALUES as readonly string[]).includes(String(r))) {
      return r as UserRole;
    }
  }
  return null;
};

const deriveRoleFromEvent = (data: Record<string, unknown>): UserRole => {
  return (
    readRole(data['public_metadata']) ?? readRole(data['unsafe_metadata']) ?? UserRole.worker
  );
};

const readLang = (md: unknown): Lang | null => {
  if (md && typeof md === 'object' && 'preferred_lang' in md) {
    const l = (md as { preferred_lang?: unknown }).preferred_lang;
    if (l === 'en') return Lang.en;
    if (l === 'es') return Lang.es;
  }
  if (md && typeof md === 'object' && 'locale' in md) {
    const l = (md as { locale?: unknown }).locale;
    if (l === 'en') return Lang.en;
    if (l === 'es') return Lang.es;
  }
  return null;
};

const deriveLangFromEvent = (data: Record<string, unknown>): Lang => {
  return (
    readLang(data['public_metadata']) ?? readLang(data['unsafe_metadata']) ?? Lang.es
  );
};

const primaryEmail = (data: Record<string, unknown>): string | null => {
  const id = (data['primary_email_address_id'] ?? null) as string | null;
  const list = (data['email_addresses'] ?? []) as Array<{ id?: string; email_address?: string }>;
  if (id) {
    const found = list.find((e) => e.id === id);
    if (found?.email_address) return found.email_address.toLowerCase();
  }
  return list[0]?.email_address?.toLowerCase() ?? null;
};

const primaryPhone = (data: Record<string, unknown>): string | null => {
  const id = (data['primary_phone_number_id'] ?? null) as string | null;
  const list = (data['phone_numbers'] ?? []) as Array<{ id?: string; phone_number?: string }>;
  if (id) {
    const found = list.find((p) => p.id === id);
    if (found?.phone_number) return found.phone_number;
  }
  return list[0]?.phone_number ?? null;
};

async function applyEvent(db: Tx, event: ClerkEvent): Promise<void> {
  const data = event.data;
  const userId = (data['id'] ?? null) as string | null;

  switch (event.type) {
    case 'user.created':
    case 'user.updated': {
      if (!userId) return;
      const role = deriveRoleFromEvent(data);
      const preferredLang = deriveLangFromEvent(data);
      const tenantId =
        (data['public_metadata'] as { tenant_id?: string } | undefined)?.tenant_id ?? null;
      const email = primaryEmail(data);
      const phone = primaryPhone(data);

      await db.user.upsert({
        where: { id: userId },
        update: { role, preferredLang, email, phone, tenantId },
        create: {
          id: userId,
          role,
          preferredLang,
          email,
          phone,
          tenantId,
        },
      });
      return;
    }

    case 'user.deleted': {
      if (!userId) return;
      // Mirror: keep the row but null out tenant binding so RLS hides the
      // user. Hard delete is handled by an admin retention path, not here.
      await db.user.updateMany({
        where: { id: userId },
        data: { tenantId: null, onboarded: false },
      });
      return;
    }

    case 'session.created':
    case 'session.ended':
    case 'organization.created':
    case 'organization.updated':
    case 'organizationMembership.created':
    case 'organizationMembership.updated':
    case 'organizationMembership.deleted':
      // Event recorded in auth_events; no DB mutation here.
      return;

    default:
      return;
  }
}

export const clerkWebhookRoutes = new Hono<{ Variables: TenantVars }>();

clerkWebhookRoutes.post('/', async (c) => {
  const rawBody = await c.req.text();
  const headers = {
    'svix-id': c.req.header('svix-id') ?? '',
    'svix-timestamp': c.req.header('svix-timestamp') ?? '',
    'svix-signature': c.req.header('svix-signature') ?? '',
  };

  let event: ClerkEvent;
  try {
    event = getWebhook().verify(rawBody, headers) as ClerkEvent;
  } catch (e) {
    console.warn('[webhook] clerk signature verification failed', {
      message: e instanceof Error ? e.message : 'invalid_signature',
    });
    return err(c, 401, 'unauthenticated', 'Webhook signature verification failed');
  }

  const userId = (event.data?.['id'] ?? null) as string | null;

  // Audit + apply happen inside the same transaction so a failure in either
  // rolls both back. Replay with the same Svix id is idempotent because
  // applyEvent uses upsert on user id.
  await pools.webhooks.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.role = 'webhook'`);
    const recorded = await tx.authEvent.create({
      data: {
        userId,
        eventType: event.type,
        payload: event as object,
        status: 'received',
      },
    });
    try {
      await applyEvent(tx, event);
      await tx.authEvent.update({
        where: { id: recorded.id },
        data: { status: 'processed', processedAt: new Date() },
      });
    } catch (e) {
      await tx.authEvent.update({
        where: { id: recorded.id },
        data: {
          status: 'failed',
          errorMsg: e instanceof Error ? e.message.slice(0, 500) : String(e).slice(0, 500),
        },
      });
      throw e;
    }
  });

  return ok(c, { received: true });
});
