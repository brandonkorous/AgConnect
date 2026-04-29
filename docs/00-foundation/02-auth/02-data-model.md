# 02 — Auth: Data Model

## users (mirrored from Clerk)

Defined in [10-worker/01-onboarding/02-data-model.md](../../10-worker/01-onboarding/02-data-model.md). The `id` column equals the Clerk `userId`. Mirror fields (`role`, `preferredLang`, `phone`, `email`) are kept in sync via webhook.

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

We store a strict shape in Clerk `publicMetadata`. Validated at every webhook + at write.

```ts
// packages/shared-types/src/auth.ts
export const PublicMetadataSchema = z.object({
  role: z.enum(['worker', 'employer', 'training_org', 'admin']),
  preferred_lang: z.enum(['en', 'es']).default('es'),
  tenant_id: z.string().uuid().optional(),    // workers only
  onboarded: z.boolean().default(false),
}).strict();
```

`publicMetadata` is readable on the client (visible in JWT). Don't put secrets here. PII like phone/email lives in Clerk's primary fields, not `publicMetadata`.

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
