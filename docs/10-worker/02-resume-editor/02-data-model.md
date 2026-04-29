# 02 — Resume Editor: Data Model

This feature reads and writes the same tables as onboarding. No new tables.

## Tables touched

- `worker_profiles` — `resume` (JSONB), `skills` (text[]), `availability` (JSONB), `county`, `zipCode`, `firstName`, `lastName`
- `users` — `email`, `preferredLang`

See [01-onboarding/02-data-model.md](../01-onboarding/02-data-model.md) for the canonical schema.

## ResumeSchema

Defined in [00-foundation/07-resume-parser/02-data-model.md](../../00-foundation/07-resume-parser/02-data-model.md). Editor produces output conforming to the same schema.

## Audit / change history (lightweight)

For MVP, no per-field audit history (would double DB writes for marginal benefit). Instead:

- `worker_profiles.updatedAt` set automatically.
- `auth_events` records `worker_profile.updated` events (template + diff summary, not full payload).

Per-field change history is a Phase 2 ask (likely from grant compliance: "show that the worker updated their address before applying to this job").

## Re-upload flow

Re-upload overwrites `worker_profiles.resume` entirely. The previous Blob path is preserved as `resume_raw_url` audit trail (overwritten by the new path on re-upload). For deeper audit:

```prisma
// Phase 2 — out of scope for MVP
model ResumeRevision {
  id           String   @id @default(uuid()) @db.Uuid
  workerId     String   @db.Uuid              @map("worker_id")
  tenantId     String   @db.Uuid              @map("tenant_id")
  resume       Json
  resumeRawUrl String?                         @map("resume_raw_url")
  source       String                          // "parsed", "manual", "imported"
  createdAt    DateTime @default(now())        @map("created_at")

  @@index([workerId, createdAt])
  @@map("resume_revisions")
}
```

Out of scope for MVP. The current `worker_profiles.resume` is the single source of truth.

## RLS

Self-only update on `worker_profiles` — see [01-onboarding/02-data-model.md](../01-onboarding/02-data-model.md). Same policy applies for editor changes.
