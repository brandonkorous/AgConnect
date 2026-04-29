# 01 — Worker Onboarding: Data Model

## Tables touched

### users (insert on first auth)

```prisma
model User {
  id              String    @id @db.Uuid          // matches Clerk userId
  tenantId        String    @db.Uuid              @map("tenant_id")
  role            Role
  phone           String?
  phoneHash       String?                         @map("phone_hash")
  email           String?
  preferredLang   Lang      @default(es)          @map("preferred_lang")
  clerkOrgId      String?                         @map("clerk_org_id")
  createdAt       DateTime  @default(now())       @map("created_at")
  updatedAt       DateTime  @updatedAt            @map("updated_at")
  deletedAt       DateTime?                       @map("deleted_at")

  tenant          Tenant         @relation(fields: [tenantId], references: [id])
  workerProfile   WorkerProfile?

  @@index([tenantId])
  @@index([phone])
  @@index([phoneHash])
  @@map("users")
}

enum Role { worker employer training_org admin }
enum Lang { en es }
```

`phoneHash` is `sha256(phone_e164 + tenant_pepper)` and is used for cross-import matching (e.g., a training org imports a roster CSV — match by hash without leaking phone).

### worker_profiles (insert on completion)

```prisma
model WorkerProfile {
  id              String    @id @db.Uuid          // PK == User.id
  tenantId        String    @db.Uuid              @map("tenant_id")
  firstName       String                          @map("first_name")
  lastName        String                          @map("last_name")
  zipCode         String?                         @map("zip_code")
  county          County?
  skills          String[]
  certifications  Json      @default("[]")
  availability    Json      @default("{}")
  resume          Json?                            // ResumeSchema (see resume-parser)
  resumeRawUrl    String?                         @map("resume_raw_url")
  onboardedAt     DateTime?                        @map("onboarded_at")
  createdAt       DateTime  @default(now())       @map("created_at")
  updatedAt       DateTime  @updatedAt            @map("updated_at")

  user            User      @relation(fields: [id], references: [id])

  @@index([tenantId])
  @@index([county])
  @@map("worker_profiles")
}

enum County { Fresno Kern Kings Madera Tulare }
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

`tenantId` nullable because waitlist signups happen before tenant assignment.

## RLS

`users` and `worker_profiles` use the standard tenant isolation policy from [00-foundation/01-multi-tenancy/02-data-model.md](../../00-foundation/01-multi-tenancy/02-data-model.md). Additional self-only policy on `worker_profiles`:

```sql
CREATE POLICY worker_self_select ON worker_profiles
  FOR SELECT
  USING (
    id = current_setting('app.user_id', true)::uuid
    OR current_setting('app.role', true) IN ('admin', 'employer')
  );

CREATE POLICY worker_self_update ON worker_profiles
  FOR UPDATE
  USING (id = current_setting('app.user_id', true)::uuid)
  WITH CHECK (id = current_setting('app.user_id', true)::uuid);
```

Employers can SELECT worker profiles via the Worker Search feature (Pro+); the policy permits read but the API surface gates by plan and adds search-only redaction (see [20-employer/04-worker-search](../../20-employer/04-worker-search/)).

## Indexes

- `users(tenantId, role)` — common filter for worker counts
- `users(phone)` and `users(phoneHash)` — phone collision check during signup
- `worker_profiles(tenantId, county)` — job-matching query path
- GIN on `worker_profiles.skills` — skill matching

## Seed data

For dev, seed three workers across three counties with varied skill sets so job-match queries return non-empty results in local dev. See `packages/db/seed/workers.ts`.
