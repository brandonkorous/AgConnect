# 07 — Resume Parser: Data Model

## ResumeSchema (canonical)

The structured shape of a parsed resume. All workers' resumes conform to this. Defined in `packages/shared-types/src/resume.ts`.

```ts
export const ResumeSchema = z.object({
  contact: z.object({
    first_name: z.string(),
    last_name:  z.string(),
    phone:      z.string().optional(),       // E.164 normalized if possible
    email:      z.string().email().optional(),
    city:       z.string().optional(),
    zip:        z.string().regex(/^\d{5}$/).optional(),
  }),
  summary: z.string().max(2000).optional(),
  experience: z.array(z.object({
    employer:   z.string(),
    title:      z.string(),
    start_date: z.string().regex(/^\d{4}(-\d{2})?$/),    // YYYY or YYYY-MM
    end_date:   z.string().regex(/^\d{4}(-\d{2})?$/).optional(),
    current:    z.boolean().default(false),
    bullets:    z.array(z.string().max(500)).max(15),
    location:   z.string().optional(),
  })).max(20),
  education: z.array(z.object({
    institution: z.string(),
    degree:      z.string().optional(),
    field:       z.string().optional(),
    year:        z.number().int().min(1950).max(2100).optional(),
  })).max(10),
  skills: z.array(z.string().max(60)).max(50),
  certifications: z.array(z.object({
    name:       z.string(),
    issuer:     z.string().optional(),
    issued_at:  z.string().date().optional(),     // YYYY-MM-DD
    expires_at: z.string().date().optional(),
  })).max(20),
  languages: z.array(z.string()).max(10),
}).strict();

export type Resume = z.infer<typeof ResumeSchema>;
```

## Confidence metadata

Returned alongside the parsed resume but NOT stored in `worker_profiles.resume`. The UI uses it to badge uncertain fields; once the worker confirms or edits, the badge clears.

```ts
export const ConfidenceSchema = z.object({
  contact: z.object({
    first_name: z.enum(['low', 'medium', 'high']).default('high'),
    last_name:  z.enum(['low', 'medium', 'high']).default('high'),
    phone:      z.enum(['low', 'medium', 'high']).optional(),
    email:      z.enum(['low', 'medium', 'high']).optional(),
    city:       z.enum(['low', 'medium', 'high']).optional(),
    zip:        z.enum(['low', 'medium', 'high']).optional(),
  }),
  experience: z.array(z.object({
    employer:   z.enum(['low', 'medium', 'high']),
    title:      z.enum(['low', 'medium', 'high']),
    dates:      z.enum(['low', 'medium', 'high']),
    bullets:    z.enum(['low', 'medium', 'high']),
  })),
  // ... matches ResumeSchema shape
});
```

The full `ParseResult` returned to the API:

```ts
export const ParseResultSchema = z.object({
  resume: ResumeSchema,
  confidence: ConfidenceSchema,
  warnings: z.array(z.string()),     // human-readable, e.g., "couldn't determine end_date for job 2"
  rawTextLength: z.number(),         // for debugging
  modelUsed: z.string(),             // "claude-sonnet-4-6"
  parseDurationMs: z.number(),
});
```

## Persistence

- `worker_profiles.resume`: stores the validated `ResumeSchema` JSON.
- `worker_profiles.resume_raw_url`: Azure Blob path to the original file.
- Confidence metadata is NOT persisted; it's transient and consumed only by the onboarding profile-review screen.

## Parser job record (optional, for debugging)

For cost/perf tracking:

```prisma
model ResumeParseJob {
  id              String     @id @default(uuid()) @db.Uuid
  tenantId        String     @db.Uuid              @map("tenant_id")
  userId          String     @db.Uuid              @map("user_id")
  blobPath        String                            @map("blob_path")
  status          ParseStatus
  modelUsed       String?                           @map("model_used")
  inputTokens     Int?                              @map("input_tokens")
  outputTokens    Int?                              @map("output_tokens")
  cacheReadTokens Int?                              @map("cache_read_tokens")
  cacheWriteTokens Int?                             @map("cache_write_tokens")
  costUsd         Decimal?   @db.Decimal(10, 5)    @map("cost_usd")
  parseDurationMs Int?                              @map("parse_duration_ms")
  errorMsg        String?                           @map("error_msg")
  createdAt       DateTime   @default(now())        @map("created_at")
  completedAt     DateTime?                         @map("completed_at")

  @@index([tenantId])
  @@index([userId])
  @@index([status, createdAt])
  @@map("resume_parse_jobs")
}

enum ParseStatus { queued running succeeded failed }
```

`cost_usd` is computed from token counts × Anthropic price list (refresh quarterly). Used for monthly cost reports.

## RLS

`resume_parse_jobs`: standard tenant isolation. Workers can read their own; admins read all.
