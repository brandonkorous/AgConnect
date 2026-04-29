# 05 — Training Browser: API

Worker-facing endpoints under `/v1/training/*`. Org-facing under `/v1/org/training/*`.

## GET /v1/training

List active training programs in the tenant. Auth optional.

Query:

```ts
const TrainingQuery = z.object({
  county: z.array(CountyEnum).optional(),
  funder: z.array(z.enum(['CDFA', 'F3', 'CalOSBA', 'EDD', 'other'])).optional(),
  topics: z.array(z.string()).optional(),
  startBefore: z.string().date().optional(),
  startAfter: z.string().date().optional(),
  q: z.string().max(120).optional(),
  hasCapacity: z.coerce.boolean().optional(),    // filter out full
  limit: z.coerce.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
}).strict();
```

Response: `{ programs: ProgramCardSchema[], nextCursor: string | null }`.

## GET /v1/training/:slug

Single program detail.

```ts
const ProgramDetailResponse = z.object({
  program: ProgramFullSchema,
  enrollment: EnrollmentSchema.nullable(),    // current worker's enrollment if any
  spotsLeft: z.number(),
});
```

## POST /v1/training/:id/enroll

Worker enrolls in a program.

Server logic:

1. Verify worker `onboardedAt != null`.
2. Verify program `status = 'active'` and `enrolledCount < capacity`.
3. Verify no existing enrollment for `(programId, workerId)`.
4. Insert `enrollments` row with status `enrolled`.
5. Atomically increment `training_programs.enrolledCount` (UPDATE ... WHERE enrolledCount < capacity).
6. If post-increment count reaches capacity, set program `status = 'full'`.
7. Enqueue SMS + email (`training.enrolled`).
8. Return enrollment + program.

Response:

```ts
const EnrollResponse = z.object({
  enrollment: EnrollmentSchema,
  program: ProgramFullSchema,
});
```

Errors:

| code | http |
|---|---|
| `not_onboarded` | 403 |
| `program_not_found` | 404 |
| `program_full` | 409 |
| `program_not_active` | 422 |
| `already_enrolled` | 409 |

## POST /v1/training/:id/unenroll

Worker drops out of a program (only before completion).

Server:

1. Verify enrollment exists with status `enrolled`.
2. Update status to `dropped`, set `droppedAt`.
3. Decrement `enrolledCount`. If status was `full`, revert to `active`.
4. No notification by default (the worker took the action).

## GET /v1/me/enrollments

Worker's enrollments.

Query: `?status=upcoming|completed|dropped&limit=20&cursor=...`

`upcoming` → status = `enrolled` AND program.startDate >= now()

## Org-facing endpoints

### POST /v1/org/training

Create a training program. Requires `userRole === 'training_org'`.

```ts
const CreateProgramBody = z.object({
  titleEn: z.string().min(1).max(120),
  titleEs: z.string().min(1).max(120),
  summaryEn: z.string().max(280).optional(),
  summaryEs: z.string().max(280).optional(),
  descriptionEn: z.string().min(20).max(5000),
  descriptionEs: z.string().min(20).max(5000),
  funder: FunderEnum,
  county: CountyEnum,
  locationName: z.string().min(1).max(200),
  locationAddress: z.string().min(1).max(300),
  capacity: z.number().int().min(1).max(500),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  sessionTimes: SessionTimesSchema,
  topics: z.array(z.string()).max(10),
  certName: z.string().max(120).optional(),
}).strict();
```

Server: insert program with `status: draft`. Org-controlled transition to `active`.

### PATCH /v1/org/training/:id

Update before active: any field. Once `active`: only `descriptionEn/Es`, `sessionTimes`, `endDate` (extending ok, shortening warns).

### POST /v1/org/training/:id/publish

Transition `draft` → `active`. Validates required fields.

### PATCH /v1/org/training/:id/status

Transition to `closed` or `canceled`. If canceled, all `enrolled` enrollments → `dropped`, optional cancellation SMS to all enrolled workers.

### PATCH /v1/org/enrollments/:id

Update enrollment status. Triggers cert generation on `completed`:

```ts
const UpdateEnrollmentBody = z.object({
  status: z.enum(['completed', 'dropped']),
  noShow: z.boolean().optional(),
}).strict();
```

Server:

1. Verify caller is the program's org or admin.
2. Update status, set `completedAt` or `droppedAt`.
3. If `completed`: enqueue `generate-certificate` job (see [00-foundation/08-certificate-generation/03-api.md](../../00-foundation/08-certificate-generation/03-api.md)).
4. Insert `application_events` style audit (or `enrollment_events` table — out of scope for MVP, just rely on `auth_events`).

### GET /v1/org/training/:id/roster

List enrolled workers for the program. Org-only.

```ts
const RosterResponse = z.object({
  enrollments: z.array(EnrollmentSchema.extend({
    workerName: z.string(),
    workerPhone: z.string().nullable(),
    workerEmail: z.string().nullable(),
  })),
});
```

> **Inferred:** Org sees worker phone for offline coordination (calling no-shows). Privacy-sensitive — limit access to enrolled workers only, not all platform workers.
