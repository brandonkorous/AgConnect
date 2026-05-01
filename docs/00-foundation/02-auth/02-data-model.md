# 02 — Auth: Data Model

## users (mirrored from Clerk)

Defined in [10-worker/01-onboarding/02-data-model.md](../../10-worker/01-onboarding/02-data-model.md). The `id` column equals the Clerk `userId`. Mirror fields (`preferredLang`, `phone`, `email`) are kept in sync via webhook.

### Role and permissions live in our DB, not Clerk

Authorization decisions are made by reading `users.role` and `users.permissions` from Postgres on every request — NOT by trusting Clerk's `publicMetadata`. Clerk is the **authentication** source (who is this session), our DB is the **authorization** source (what can they do).

```prisma
model User {
  ...
  role        UserRole                                  // worker | employer | training_org | admin
  permissions String[] @default([])                     // fine-grained scopes within role; '*' = wildcard
  ...
}
```

- **`role`** drives RLS — set via `current_setting('app.role')` in the tenant-context middleware before any query.
- **`permissions`** drives application-layer scope checks. Empty array = role's defaults are sufficient. `'*'` = full access for that role. Used only for admin sub-tiers in MVP (e.g., support admin can verify employers but not refund billing); workers/employers stay with empty arrays.
- Canonical permission strings live in `packages/schemas/src/permissions.ts`. Examples: `employers.verify`, `employers.reject`, `billing.refund`, `reports.export`, `audit.read`.
- Middleware factory: `requirePermission('employers.verify')` checks `permissions.includes(scope) || permissions.includes('*')`.

Why not put permissions in RLS? RLS stays role-only — clean coarse cuts at the DB. App layer enforces scopes. This keeps RLS readable and lets us evolve the permissions model without DDL.

> **Inferred:** Storing `permissions` as a `String[]` column is right-sized for 4 fixed roles plus a small handful of admin scopes. Promote to a `roles` / `role_permissions` M2M when (a) named role bundles are needed (`support_admin`, `billing_admin`), or (b) per-tenant role definitions arrive.

## auth_events (audit log)

Every Clerk webhook event is recorded for audit and incident response.

```prisma
model AuthEvent {
  id          String    @id @default(uuid()) @db.Uuid
  tenantId    String?   @db.Uuid              @map("tenant_id")
  userId      String?                          @map("user_id")        // matches Clerk userId
  eventType   String                           @map("event_type")     // e.g., user.created, session.created, phone_number.verified
  payload     Json
  receivedAt  DateTime  @default(now())        @map("received_at")
  processedAt DateTime?                        @map("processed_at")
  status      AuthEventStatus  @default(received)
  errorMsg    String?                          @map("error_msg")

  @@index([tenantId])
  @@index([userId])
  @@index([eventType, receivedAt])
  @@map("auth_events")
}

enum AuthEventStatus { received processed failed skipped }
```

`tenantId` is nullable because the first event for a user (`user.created`) precedes our tenant assignment.

## clerk_publicMetadata schema (canonical)

`publicMetadata` is for **session-scoped UI hints only** (e.g., preferred language for first-paint i18n). It is NEVER trusted for authorization — auth decisions read `users.role` and `users.permissions` from our DB.

```ts
// packages/schemas/src/auth.ts
export const PublicMetadataSchema = z.object({
  preferred_lang: z.enum(['en', 'es']).default('es'),
  onboarded: z.boolean().default(false),
}).strict();
```

`publicMetadata` is readable on the client (visible in JWT). Don't put secrets or authorization state here. PII like phone/email lives in Clerk's primary fields. `role` lived here historically — it's been removed because the JWT can be stale (changing a role in Clerk doesn't invalidate live sessions) and putting it here invites client code to trust it.

## privateMetadata (server-side only)

Used for feature flags or admin notes that should not appear in the JWT. Schema:

```ts
export const PrivateMetadataSchema = z.object({
  flags: z.record(z.string(), z.boolean()).default({}),
  adminNotes: z.string().optional(),
}).strict();
```

## sessions (no table)

We do not persist sessions in our DB. Clerk owns session lifecycle. The webhook records `session.created` and `session.ended` in `auth_events` for audit only.

## RLS

`auth_events` uses standard tenant isolation, plus an admin bypass:

```sql
ALTER TABLE auth_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY auth_events_admin ON auth_events
  USING (current_setting('app.role', true) = 'admin');

CREATE POLICY auth_events_self ON auth_events
  FOR SELECT
  USING (user_id = current_setting('app.user_id', true)
         AND tenant_id = current_setting('app.tenant_id', true)::uuid);
```

Workers can read their own events (useful for "recent activity" UI). Employers cannot read worker events.

## Indexes

- `auth_events(userId)` — lookup by user
- `auth_events(eventType, receivedAt)` — incident filtering ("show all `phone_number.verification_failed` in last 24h")
- `auth_events(tenantId)` — per-tenant audit reports
