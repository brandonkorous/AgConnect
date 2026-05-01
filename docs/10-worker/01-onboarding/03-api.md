# 01 — Worker Onboarding: API

All endpoints under `/v1/onboarding/*` unless noted. All require Clerk auth EXCEPT phone-OTP send/verify (handled entirely by Clerk's hosted SMS OTP — we don't proxy it).

Tenant resolution: standard `tenantMiddleware` runs on every request. For users mid-onboarding who don't yet have a `users` row, the middleware uses the fallback path described in [00-foundation/01-multi-tenancy/08-edge-cases.md](../../00-foundation/01-multi-tenancy/08-edge-cases.md).

## POST /v1/onboarding/start

Idempotent: creates the `users` row from Clerk if not present. Called once after Clerk OTP verification completes.

Request body: empty (Clerk session has all needed data).

Server logic:

1. Get `userId`, `phoneNumber` from Clerk session.
2. Resolve `tenantId` (Clerk org metadata → URL slug → default).
3. `INSERT ... ON CONFLICT (id) DO NOTHING` into `users` with `role = worker`, `preferred_lang = es`.
4. If conflict on `(tenantId, phone)` from a different `id`, return 409 (account merge or restore flow needed — admin support).
5. Compute `phoneHash` and store.
6. Return current user state.

Response:

```ts
const StartResponse = z.object({
  user: UserSchema,
  next_step: z.enum(['language', 'resume_upload', 'profile_review', 'county', 'skills', 'availability', 'complete']),
});
```

`next_step` derivation: looks at `worker_profiles` columns and returns the first incomplete step in the canonical order.

## PATCH /v1/onboarding/language

Set preferred language. May be called any time during onboarding.

Request: `{ lang: 'en' | 'es' }`
Response: `{ user, next_step }`

Side effect: Clerk `publicMetadata.preferred_lang` updated via `clerkClient.users.updateUser()` so it survives across sessions.

## POST /v1/onboarding/resume

Upload a resume. Multipart form-data with field `file`. Accept PDF, DOCX. Max 10 MB.

Server logic:

1. Validate MIME type and size.
2. Generate object path: `resumes/{tenantId}/{userId}/{ISO-timestamp}.{ext}`.
3. Stream upload to Supabase Storage (no full-buffer in memory).
4. Enqueue pg-boss job `parse-resume` with `{ userId, objectPath }`.
5. Return immediately with the poll URL.

Response (202 Accepted):

```ts
z.object({
  status: z.literal('parsing'),
  poll_url: z.string(),                  // /v1/onboarding/resume/status
  estimated_seconds: z.number(),         // typical 8-15s
});
```

## GET /v1/onboarding/resume/status

Poll for parser completion. UI polls every 2s, max 60s before offering manual fallback.

Response (in-progress):

```ts
z.object({ status: z.literal('parsing') });
```

Response (parsed):

```ts
z.object({
  status: z.literal('parsed'),
  resume: ResumeSchema,                  // see resume-parser/02-data-model.md
  warnings: z.array(z.string()),         // human-readable, e.g., "couldn't determine end_date for job 2"
});
```

The parsed resume is also saved to `worker_profiles.resume` so the next call to `/start` reflects it.

Response (failed):

```ts
z.object({
  status: z.literal('failed'),
  reason: z.enum(['unreadable', 'unsupported_format', 'too_large', 'parser_error']),
  fallback: z.literal('manual_entry'),
});
```

## PATCH /v1/onboarding/profile

Save reviewed/edited profile data. May be called multiple times during onboarding (autosave on field blur).

Request:

```ts
const PatchProfileBody = z.object({
  resume: ResumeSchema.partial().optional(),
  county: z.enum(['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare']).optional(),
  zipCode: z.string().regex(/^\d{5}$/).optional(),
  skills: z.array(z.string().min(1).max(60)).max(20).optional(),
  availability: AvailabilitySchema.optional(),
  email: z.string().email().optional(),    // optional; populated to users.email
});
```

Response: `{ user, profile, next_step }`.

Server creates `worker_profiles` row on first call if absent (with `firstName`/`lastName` from `resume.contact` if present, else placeholders to be filled in profile review).

## POST /v1/onboarding/waitlist

Capture interest from users outside the 5 supported counties.

Request:

```ts
const WaitlistBody = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  county: z.string().min(2).max(80),
  preferredLang: z.enum(['en', 'es']).default('es'),
}).refine((b) => b.email || b.phone, 'email_or_phone_required');
```

Response: `{ status: 'queued' }`.

## POST /v1/onboarding/complete

Finalize onboarding. Validates the profile is complete enough to apply to jobs.

Required at completion:

- `worker_profiles.firstName`, `lastName`
- `worker_profiles.county`
- `worker_profiles.skills.length >= 1`
- `worker_profiles.availability` with at least 1 half-day `true`

If valid:

1. Set `worker_profiles.onboardedAt = now()`.
2. Enqueue welcome SMS (`pg-boss` job `welcome-sms`).
3. If `users.email` set, enqueue welcome email.
4. Return `{ status: 'complete', redirect: '/[locale]/jobs' }`.

If invalid: 422 with the list of missing fields.

```ts
const CompleteErrorResponse = z.object({
  code: z.literal('profile_incomplete'),
  missing: z.array(z.enum(['firstName', 'lastName', 'county', 'skills', 'availability'])),
});
```

## Errors

| code | http | when |
|---|---|---|
| `unauthenticated` | 401 | No Clerk session |
| `phone_already_registered_other_tenant` | 409 | Phone exists under a different tenant |
| `phone_collision_same_tenant` | 409 | Phone exists in same tenant under a different Clerk user (admin merge needed) |
| `resume_too_large` | 413 | Upload > 10 MB |
| `resume_unsupported` | 415 | Not PDF or DOCX |
| `resume_parse_failed` | 422 | Parser returned no usable data — fallback to manual |
| `profile_incomplete` | 422 | `complete` called before required fields set; body lists missing fields |
| `county_unsupported` | 400 | Patch with county not in enum (UI prevents this; defensive) |
