# 02 — Resume Editor: API

All endpoints under `/v1/profile/*`. Worker-only (tenant-scoped to their own row via RLS).

## GET /v1/profile

Read the current worker's full profile.

Response:

```ts
const ProfileResponse = z.object({
  user: UserSchema,
  workerProfile: z.object({
    firstName: z.string(),
    lastName: z.string(),
    zipCode: z.string().nullable(),
    county: CountyEnum.nullable(),
    skills: z.array(z.string()),
    certifications: z.array(CertificationSchema),
    availability: AvailabilitySchema,
    resume: ResumeSchema.nullable(),
    resumeRawUrl: z.string().nullable(),
    onboardedAt: z.string().datetime().nullable(),
    updatedAt: z.string().datetime(),
  }),
});
```

## PATCH /v1/profile

Update any subset of fields. Autosaves invoke this with diffed sub-objects.

Request:

```ts
const PatchProfileBody = z.object({
  firstName: z.string().min(1).max(60).optional(),
  lastName:  z.string().min(1).max(60).optional(),
  email:     z.string().email().nullable().optional(),
  zipCode:   z.string().regex(/^\d{5}$/).nullable().optional(),
  county:    CountyEnum.optional(),
  skills:    z.array(z.string().min(1).max(60)).max(20).optional(),
  availability: AvailabilitySchema.optional(),
  resume: ResumeSchema.partial().optional(),       // partial allowed; merged onto existing
}).strict();
```

Server: deep-merge `resume` partial onto existing. Other fields replaced wholesale.

Response: `{ workerProfile: ..., user: ... }`.

## PATCH /v1/profile/resume/experience/:index

Convenience endpoint for replacing a single experience item (avoids client-side merging of arrays):

```ts
const Body = ResumeSchema.shape.experience.element;        // single experience object
```

Server: replaces `resume.experience[index]` if `0 <= index < resume.experience.length`. 404 if out of range.

Similar endpoints for `education/:index` and `certifications/:index`. Skills are managed at the top level (whole array replace).

## POST /v1/profile/resume/experience

Append a new experience. Body is a single experience object. Returns the new index.

Similar for education, certifications.

## DELETE /v1/profile/resume/experience/:index

Remove an experience item. Returns the updated profile.

Similar for education, certifications.

## POST /v1/profile/resume/reupload

Re-upload a resume file. Overwrites the structured `resume` after re-parse. Body: same multipart form-data as `/v1/onboarding/resume`.

Server logic:

1. Save new file to Blob (`resumes/{tenantId}/{userId}/<timestamp>.<ext>`).
2. Enqueue `parse-resume` job.
3. Return `{ status: 'parsing', poll_url: '/v1/profile/resume/status' }`.

Worker must explicitly confirm overwrite in the UI before this is called (warn-before-overwrite is a UI concern; API allows the call).

## GET /v1/profile/resume/status

Same shape as `/v1/onboarding/resume/status`. Used post-reupload.

## GET /v1/profile/preview-as-employer

Returns the redacted profile shape an employer would see (e.g., phone redacted unless application exists; some fields hidden by employer plan tier).

```ts
const PreviewAsEmployerResponse = z.object({
  firstName: z.string(),
  lastNameInitial: z.string(),                  // "L." not "Lopez"
  county: CountyEnum,
  skills: z.array(z.string()),
  experience: z.array(...),
  certifications: z.array(...),
  // phone, email, exact location HIDDEN until application
});
```

## Errors

| code | http | when |
|---|---|---|
| `validation_failed` | 422 | body fails Zod schema |
| `index_out_of_range` | 404 | PATCH/DELETE on non-existent index |
| `resume_too_large` / `resume_unsupported` | 413/415 | re-upload size/format errors |
| `not_onboarded` | 403 | profile editor accessed before completing onboarding (rare; UI redirects) |
