# 04 — Worker Search: API

All endpoints under `/v1/employer/workers/*`. Auth: `userRole === 'employer'` AND `employer_profile.plan` in `['monthly', 'annual']` (Pro+).

## GET /v1/employer/workers

Search workers.

Query:

```ts
const WorkerSearchQuery = z
    .object({
        county: z.array(CountyEnum).optional(),
        skills: z.array(z.string().min(1).max(60)).optional(),
        certTopics: z.array(z.string()).optional(), // e.g., ['tractor_safety']
        availabilityDay: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).optional(),
        availabilityTime: z.enum(['am', 'pm', 'either']).optional(),
        q: z.string().max(120).optional(), // free-text against skills + experience.title (light)
        limit: z.coerce.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
    })
    .strict();
```

Response:

```ts
const WorkerSearchResponse = z.object({
    workers: z.array(WorkerCardSchema),
    nextCursor: z.string().nullable(),
    total: z.number().optional(), // omitted if too expensive at scale
});

const WorkerCardSchema = z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastInitial: z.string(),                                      // "L" — full last name only when relationship exists
    lastName: z.string().optional(),                              // present only when relationship exists
    county: CountyEnum,
    skills: z.array(z.string()),
    matchScore: z.number().int(),
    certifications: z.array(
        z.object({
            name: z.string(),
            issuer: z.string().nullable(),
            source: z.enum(['agconn', 'self']),
        }),
    ),
    availability: AvailabilitySchema,                             // safe — no PII
    experienceCount: z.number().int(),
    // Contact info: present only when (employer, worker) have a relationship
    // (hired application, accepted invitation, or any non-withdrawn application).
    phone: z.string().optional(),
    email: z.string().email().optional(),
    relationship: z.enum(['hired', 'invited', 'applied']).optional(),  // why contact is visible
});
```

Side effect: writes a `worker_search_log` row.

## GET /v1/employer/workers/:id

Single-worker preview. Same redaction as search results — no contact info.

```ts
const WorkerPreviewResponse = z.object({
    worker: WorkerCardSchema.extend({
        experience: z.array(ResumeExperienceSchema),
        education: z.array(ResumeEducationSchema),
        languages: z.array(z.string()),
    }),
});
```

## POST /v1/employer/workers/:id/invite

Invite worker to apply to a specific posting.

```ts
const InviteBody = z
    .object({
        jobId: z.string().uuid(),
        message: z.string().max(500).optional(),
    })
    .strict();
```

Server:

1. Verify the job belongs to the employer and is `active`.
2. Verify no existing invitation for `(employerId, workerId, jobId)`.
3. Verify worker has not already applied (don't invite duplicates).
4. Insert `worker_invitations` row.
5. Enqueue invite SMS.

Response: `{ invitation: WorkerInvitationSchema }`.

Errors: `already_invited`, `already_applied`, `job_not_active`, `worker_not_eligible`.

## GET /v1/employer/invitations

List employer's invitations + status.

## Worker-side: invitation handling

Worker side endpoint:

### GET /v1/me/invitations

Worker's incoming invitations.

### POST /v1/me/invitations/:id/accept

Accept → creates an `applications` row + decrements as if applying.

### POST /v1/me/invitations/:id/decline

Decline. Closes invitation. No worker SMS to employer (just a status update visible to employer).

## Errors

| code                  | http | when                                 |
| --------------------- | ---- | ------------------------------------ |
| `plan_required_pro`   | 402  | Free plan accessing search           |
| `already_invited`     | 409  | duplicate invite                     |
| `already_applied`     | 409  | worker already applied               |
| `job_not_active`      | 422  | invite to closed/draft job           |
| `worker_not_eligible` | 422  | worker not onboarded or soft-deleted |
| `cross_tenant`        | 404  | (RLS) worker in another tenant       |

## Invite SMS template

`worker.invitation`:

|      | EN                                                                                                                       | ES                                                                                                                      |
| ---- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Body | {employer} invited you to apply for {jobTitle} (${wageMin}-${wageMax}/hr in {county}). View: agconn.com/invitations/{id} | {employer} te invitó a aplicar para {jobTitle} (${wageMin}-${wageMax}/hr en {county}). Ver: agconn.com/invitations/{id} |
