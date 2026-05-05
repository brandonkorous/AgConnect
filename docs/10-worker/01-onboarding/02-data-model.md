# 01 — Worker Onboarding: Data Model

## Tables touched

### users (insert on first auth)

```prisma
model User {
  id              String    @id                   // matches Clerk userId
  tenantId        String?   @db.Uuid              @map("tenant_id")
  role            UserRole
  phone           String?
  email           String?
  preferredLang   Lang      @default(es)          @map("preferred_lang")
  onboarded       Boolean   @default(false)
  createdAt       DateTime  @default(now())       @map("created_at")
  updatedAt       DateTime  @updatedAt            @map("updated_at")

  tenant          Tenant?        @relation(fields: [tenantId], references: [id])
  workerProfile   WorkerProfile?

  @@index([tenantId])
  @@index([phone])
  @@map("users")
}

enum UserRole { worker employer training_org admin }
enum Lang { en es }
```

`User.tenantId` is nullable: it's `null` for workers (platform-level / bucket 2) and set for employer / training-org / admin users (tenant-scoped / bucket 1). The `@@index([tenantId])` is still useful because employer-side admin queries filter by it; for workers it's a sparse index of one NULL value per row.

`phoneHash` lives on `worker_profiles`, not on `users`, since hashed-phone roster matching is a worker-side concern. The hash is `sha256(phone_e164 + PHONE_HASH_PEPPER)` with a platform-wide pepper (not tenant-scoped — the hash must match across imports regardless of which employer-user uploads a roster). It's used for cross-import matching, e.g., a training org imports a roster CSV and matches existing workers by hash without leaking phone numbers.

### worker_profiles (insert on completion)

`worker_profiles` is platform-level (bucket 2 in the three-bucket tenancy model). No `tenant_id` column — workers are not partitioned by employer, and any employer with the right plan tier can search across the whole worker pool subject to the redaction rules in [20-employer/04-worker-search](../../20-employer/04-worker-search/).

```prisma
model WorkerProfile {
  id              String        @id                  // PK == User.id (Clerk userId)
  firstName       String                             @map("first_name")
  lastName        String                             @map("last_name")
  zipCode         String?                            @map("zip_code")
  county          County?
  skills          String[]      @default([])
  certifications  Json          @default("[]")
  availability    Json          @default("{}")
  resume          Json?                               // ResumeSchema (see resume-parser)
  resumeRawUrl    String?                            @map("resume_raw_url")
  parserStatus    ParserStatus?                      @map("parser_status")
  phoneHash       String?                            @map("phone_hash")
  onboardedAt     DateTime?                          @map("onboarded_at")
  createdAt       DateTime      @default(now())     @map("created_at")
  updatedAt       DateTime      @updatedAt          @map("updated_at")
  deletedAt       DateTime?                          @map("deleted_at")

  user            User          @relation(fields: [id], references: [id], onDelete: Cascade)

  @@index([county])
  @@index([phoneHash])
  @@map("worker_profiles")
}

enum County { Fresno Kern Kings Madera Tulare }
enum ParserStatus { idle parsing parsed failed }
```

GIN index on `skills` for skill-match queries:

```sql
CREATE INDEX worker_profile_skills_gin ON worker_profiles USING gin(skills);
```

### worker_profile.availability JSONB

7-day weekly schedule, half-day granularity:

```ts
// packages/shared-types/src/availability.ts
export const AvailabilitySchema = z.object({
  mon: z.object({ am: z.boolean(), pm: z.boolean() }),
  tue: z.object({ am: z.boolean(), pm: z.boolean() }),
  wed: z.object({ am: z.boolean(), pm: z.boolean() }),
  thu: z.object({ am: z.boolean(), pm: z.boolean() }),
  fri: z.object({ am: z.boolean(), pm: z.boolean() }),
  sat: z.object({ am: z.boolean(), pm: z.boolean() }),
  sun: z.object({ am: z.boolean(), pm: z.boolean() }),
  notes: z.string().max(280).optional(),
}).strict();
```

> **Inferred:** AM/PM half-day granularity is the most common scheduling unit in Central Valley harvest work. Hourly granularity is overkill; full-day granularity loses morning-shift signal. Validate with a partner training org before locking in.

### worker_profile.certifications JSONB

```ts
export const CertificationSchema = z.object({
  cert_id: z.string().uuid().optional(),     // FK-style ref to a future certifications catalog
  name: z.string().min(1),
  issuer: z.string().optional(),
  issued_at: z.string().date().optional(),    // YYYY-MM-DD
  expires_at: z.string().date().optional(),
});
export const CertificationsArraySchema = z.array(CertificationSchema);
```

For onboarding, certifications come from resume parse only — no manual entry UI. Manual cert add is in [02-resume-editor](../02-resume-editor/).

### waitlist (insert if county not supported)

```prisma
model Waitlist {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String?  @db.Uuid @map("tenant_id")
  email       String?
  phone       String?
  county      String                                       // free text — outside our 5-county enum
  preferredLang Lang   @default(es) @map("preferred_lang")
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([county])
  @@map("waitlist")
}
```

`tenantId` nullable because waitlist signups happen on the public landing page before any tenant context exists.

## RLS

See [00-foundation/01-multi-tenancy](../../00-foundation/01-multi-tenancy/) for the three-bucket model and the role catalog (`authenticated`, `service`, `webhook`, `admin`, `system`, `anonymous`).

`users` is mixed: a worker `User` row has `tenantId = null`, an employer / training-org / admin `User` row carries the tenant FK. The table-level RLS therefore allows self-row access regardless of `app.tenant_id` and additionally allows employers to read worker `User` rows that back search hits.

`worker_profiles` is platform-level (bucket 2): no tenant gate. Access is self-only for workers + cross-tenant readable for employers with the worker-search permission (employer-side gating is enforced at the API layer — RLS lets the read through).

```sql
CREATE POLICY worker_profiles_self_access ON worker_profiles
  FOR ALL
  USING (
    id = current_setting('app.user_id', true)
    OR current_setting('app.role', true) IN ('admin', 'service')
  )
  WITH CHECK (
    id = current_setting('app.user_id', true)
    OR current_setting('app.role', true) IN ('admin', 'service')
  );

CREATE POLICY worker_profiles_employer_search ON worker_profiles
  FOR SELECT
  USING (
    current_setting('app.role', true) = 'authenticated'
    AND deleted_at IS NULL
  );
```

Employers can SELECT worker profiles via the Worker Search feature (Pro+); the RLS permits the read, and the API surface gates by plan + adds search-only redaction (see [20-employer/04-worker-search](../../20-employer/04-worker-search/)).

## Indexes

- `users(tenantId)` — employer-side queries that filter to a single tenant; sparse for workers
- `users(phone)` — phone collision check during worker signup (platform-wide scan scoped at the query layer to `role = 'worker'`)
- `worker_profiles(county)` — job-matching query path (cross-tenant)
- `worker_profiles(phoneHash)` — roster import matching
- GIN on `worker_profiles.skills` — skill matching

## Seed data

For dev, seed three workers across three counties with varied skill sets so job-match queries return non-empty results in local dev. See `packages/db/seed/workers.ts`.
