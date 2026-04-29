# 02 — Auth: API & Middleware

## Hono middleware stack

```ts
// apps/api/src/index.ts
import { clerkMiddleware } from '@hono/clerk-auth';
import { tenantMiddleware } from './middleware/tenant';
import { adminMiddleware } from './middleware/admin';

const api = new Hono();

api.use('*', clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
}));

api.route('/webhooks/clerk', clerkWebhookRouter);   // unauthenticated; signature-verified
api.use('/v1/*', tenantMiddleware);                  // requires Clerk session + tenant
api.use('/admin/v1/*', adminMiddleware);             // requires Clerk session + admin role
```

`clerkMiddleware` populates `c.get('clerkAuth')` with `{ userId, sessionId, sessionClaims, orgId }` on every request. It does NOT 401 by itself; downstream middleware does.

## requireRole helpers

```ts
// apps/api/src/middleware/role.ts
export const requireRole = (roles: Role | Role[]) =>
  createMiddleware(async (c, next) => {
    const role = c.get('userRole');
    const list = Array.isArray(roles) ? roles : [roles];
    if (!list.includes(role)) throw new HTTPException(403, { message: 'wrong_role' });
    await next();
  });

// Usage:
api.get('/v1/employers', requireRole(['admin']), listEmployers);
```

## /v1/me

Read the current authenticated user.

Response:

```ts
const MeResponse = z.object({
  id: z.string().uuid(),
  role: z.enum(['worker', 'employer', 'training_org', 'admin']),
  preferredLang: z.enum(['en', 'es']),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  tenantId: z.string().uuid(),
  workerProfile: WorkerProfileSchema.optional(),
  employerProfile: EmployerProfileSchema.optional(),
});
```

## POST /v1/me/lang

Update preferred language. Sets `users.preferredLang` AND Clerk `publicMetadata.preferred_lang`.

```ts
const Body = z.object({ lang: z.enum(['en', 'es']) });
```

## POST /webhooks/clerk

Receives Clerk webhook events. Signature verified via Svix headers (Clerk uses Svix internally).

```ts
// apps/api/src/routes/webhooks/clerk.ts
import { Webhook } from 'svix';

clerkWebhookRouter.post('/', async (c) => {
  const sig = c.req.header('svix-signature');
  const ts  = c.req.header('svix-timestamp');
  const id  = c.req.header('svix-id');
  const body = await c.req.text();

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  let event: ClerkEvent;
  try {
    event = wh.verify(body, { 'svix-id': id, 'svix-timestamp': ts, 'svix-signature': sig }) as ClerkEvent;
  } catch {
    throw new HTTPException(401, { message: 'invalid_signature' });
  }

  // Insert raw event into auth_events as 'received'
  const evtRow = await db.authEvent.create({ data: { eventType: event.type, payload: event, userId: event.data.id ?? null } });

  // Process by type
  try {
    switch (event.type) {
      case 'user.created':            await handleUserCreated(event.data); break;
      case 'user.updated':            await handleUserUpdated(event.data); break;
      case 'user.deleted':            await handleUserDeleted(event.data); break;
      case 'session.created':         await handleSessionCreated(event.data); break;
      case 'organization.created':    await handleOrgCreated(event.data); break;
      case 'organizationMembership.created': await handleOrgMembership(event.data); break;
      // ... etc
      default:                        await markSkipped(evtRow.id);
    }
    await markProcessed(evtRow.id);
  } catch (err) {
    await markFailed(evtRow.id, String(err));
    throw err;   // 500 → Clerk will retry
  }

  return c.json({ ok: true });
});
```

## Webhook handlers (sync semantics)

### user.created

1. Resolve `tenantId`:
   - If event has `organization_memberships[0].organization.public_metadata.tenant_id` → use it.
   - Else if `public_metadata.tenant_id` set on user → use it.
   - Else for MVP → use the only tenant.
2. `INSERT users (id, tenantId, role, phone, email, preferredLang) VALUES ...`. `ON CONFLICT (id) DO UPDATE` on retry.
3. If `role = 'employer'`, also create empty `employer_profiles` row (filled out at FLC verification).
4. If `role = 'worker'`, create empty `worker_profiles` row (filled during onboarding).

### user.updated

Update `users.phone`, `users.email`, `users.preferredLang`, `users.role` from the event payload. If `publicMetadata.role` changed, the change is logged separately as a security event.

### user.deleted

Soft-delete: `users.deletedAt = now()`. Also revoke all active sessions via `clerkClient.sessions.revoke()` for any session not yet revoked.

### organization.created

Map to a tenant or employer:

- If the org has `publicMetadata.kind === 'tenant'` → no-op (admin created it manually).
- If `kind === 'employer'` → `INSERT employer_profiles (clerkOrgId, ...)`.

### organizationMembership.created

When a user joins an employer org, set `users.clerkOrgId` to that org. Used for tenant resolution.

## Errors

| code | http | when |
|---|---|---|
| `unauthenticated` | 401 | No Clerk session on a protected route |
| `invalid_signature` | 401 | Webhook signature verification failed |
| `wrong_role` | 403 | `requireRole` mismatch |
| `tenant_disabled` | 403 | Tenant soft-deleted |
| `webhook_replay` | 200 | Duplicate webhook (idempotent — return 200 to stop Clerk retries) |
