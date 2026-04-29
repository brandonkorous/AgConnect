# 03 — Applicant Review: API (Employer Side)

All endpoints under `/v1/employer/applications/*`. Auth requires `userRole === 'employer'`. RLS scopes to their own jobs.

## GET /v1/employer/inbox

Cross-posting application list — newest first.

Query: `?status=applied|reviewed|hired|rejected|withdrawn&jobId=<uuid>&limit=20&cursor=...`

Response:

```ts
const InboxResponse = z.object({
  applications: z.array(ApplicationCardSchema),
  nextCursor: z.string().nullable(),
  unreadCount: z.number(),                     // count of applications with no employer view event
});

const ApplicationCardSchema = z.object({
  id: z.string().uuid(),
  status: AppStatusEnum,
  appliedAt: z.string().datetime(),
  job: z.object({ id: z.string().uuid(), titleEn: z.string(), titleEs: z.string(), county: CountyEnum }),
  worker: z.object({
    firstName: z.string(),
    lastInitial: z.string(),                  // privacy: full name shown only on detail
    county: CountyEnum,
    skillsMatchCount: z.number(),
    certifications: z.array(CertSummarySchema),
  }),
  unread: z.boolean(),
});
```

## GET /v1/employer/jobs/:jobId/applicants

Per-posting kanban data.

Response:

```ts
const KanbanResponse = z.object({
  columns: z.object({
    applied:  z.array(ApplicationCardSchema),
    reviewed: z.array(ApplicationCardSchema),
    hired:    z.array(ApplicationCardSchema),
  }),
  rejectedCount: z.number(),     // hidden by default; expose via separate fetch
});
```

## GET /v1/employer/applications/:id

Single application with full worker profile (subject to redaction rules — phone shown only after employer interaction):

```ts
const ApplicationDetailResponse = z.object({
  application: ApplicationSchema,
  job: JobPostingSchema,
  worker: z.object({
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string(),               // visible to employer once application exists
    email: z.string().email().nullable(),
    county: CountyEnum,
    zipCode: z.string().nullable(),
    skills: z.array(z.string()),
    certifications: z.array(CertSummarySchema),
    experience: z.array(ResumeExperienceSchema),
    education: z.array(ResumeEducationSchema),
    availability: AvailabilitySchema,
  }),
  events: z.array(ApplicationEventSchema),
  employerNote: z.string().nullable(),
});
```

Side effect: marks the application as read for the employer (not currently tracked in MVP — logged in `auth_events` for future).

## POST /v1/employer/applications/:id/transition

Single status transition.

```ts
const TransitionBody = z.discriminatedUnion('toStatus', [
  z.object({
    toStatus: z.literal('reviewed'),
    note: z.string().max(2000).optional(),
  }),
  z.object({
    toStatus: z.literal('hired'),
    wageOffered: z.number().min(0).max(500),       // required
    startDate: z.string().date(),                    // required
    note: z.string().max(2000).optional(),
  }),
  z.object({
    toStatus: z.literal('rejected'),
    rejectionReason: z.enum(['not_qualified', 'too_far', 'position_filled', 'no_response', 'other']).optional(),
    rejectionReasonText: z.string().max(500).optional(),
  }),
]);
```

Server:

1. Verify state machine permits transition.
2. Update `applications` row.
3. Insert `application_events` row.
4. Trigger worker SMS / email per [10-worker/04-application-tracker/06-messaging.md](../../10-worker/04-application-tracker/06-messaging.md).
5. If `hired`, increment `job_postings.hireCount`. If `hireCount >= positionsTotal`, auto-transition job to `filled` (background job).

Response: `{ application: ApplicationSchema }`.

## POST /v1/employer/applications/bulk-transition

Bulk update — for "mass reject everyone still in Applied".

```ts
const BulkBody = z.object({
  applicationIds: z.array(z.string().uuid()).min(1).max(100),
  toStatus: z.enum(['reviewed', 'rejected']),
  rejectionReason: z.enum(['not_qualified', 'too_far', 'position_filled', 'no_response', 'other']).optional(),
}).strict();
```

Server: per-id transition with errors collected; partial success returned:

```ts
const BulkResponse = z.object({
  succeeded: z.array(z.string().uuid()),
  failed: z.array(z.object({ id: z.string().uuid(), error: z.string() })),
});
```

Hire is NOT bulk-allowed (each hire requires wage + start date).

## POST /v1/employer/applications/:id/note

Save a private note. Doesn't trigger any worker notification.

```ts
const NoteBody = z.object({ note: z.string().max(2000) });
```

## GET /v1/employer/applications/:id/notes/history

Note edit history. Out of scope for MVP — last note wins; previous content overwritten.

## Errors

| code | http | when |
|---|---|---|
| `invalid_transition` | 422 | state machine forbids |
| `wage_required` | 422 | hire without wage |
| `start_date_required` | 422 | hire without start |
| `cross_employer` | 404 | trying to access another employer's application (RLS hides) |
