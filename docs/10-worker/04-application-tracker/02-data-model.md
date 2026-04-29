# 04 — Application Tracker: Data Model

## applications

```prisma
model Application {
  id              String    @id @default(uuid()) @db.Uuid
  tenantId        String    @db.Uuid              @map("tenant_id")
  jobId           String    @db.Uuid              @map("job_id")
  workerId        String    @db.Uuid              @map("worker_id")
  status          AppStatus @default(applied)
  wageOffered     Decimal?  @db.Decimal(8, 2)    @map("wage_offered")
  workerNote      String?   @db.VarChar(500)     @map("worker_note")    // optional, Phase 2 use
  appliedAt       DateTime  @default(now())       @map("applied_at")
  reviewedAt      DateTime?                       @map("reviewed_at")
  hiredAt         DateTime?                       @map("hired_at")
  rejectedAt      DateTime?                       @map("rejected_at")
  withdrawnAt     DateTime?                       @map("withdrawn_at")
  startDate       DateTime?                       @map("start_date")     // captured at hire
  countyAtApply   County?                         @map("county_at_apply")  // snapshot
  skillsAtApply   String[]                        @map("skills_at_apply")  // snapshot
  createdAt       DateTime  @default(now())       @map("created_at")
  updatedAt       DateTime  @updatedAt            @map("updated_at")
  deletedAt       DateTime?                       @map("deleted_at")

  job             JobPosting    @relation(fields: [jobId], references: [id])
  worker          User          @relation(fields: [workerId], references: [id])

  @@unique([jobId, workerId])     // one app per (job, worker)
  @@index([tenantId])
  @@index([workerId, status])
  @@index([jobId, status])
  @@index([appliedAt])
  @@map("applications")
}

enum AppStatus { applied reviewed hired rejected withdrawn }
```

`countyAtApply` and `skillsAtApply` are immutable snapshots taken at apply time. Used for grant reporting (the worker's actual circumstances when they applied, not their current).

## application_events (append-only)

Status timeline. Every status change writes a row.

```prisma
model ApplicationEvent {
  id              String    @id @default(uuid()) @db.Uuid
  tenantId        String    @db.Uuid              @map("tenant_id")
  applicationId   String    @db.Uuid              @map("application_id")
  fromStatus      AppStatus?                      @map("from_status")
  toStatus        AppStatus                        @map("to_status")
  actorUserId     String    @db.Uuid              @map("actor_user_id")  // who made the change
  actorRole       Role                             @map("actor_role")
  metadata        Json     @default("{}")          // e.g., { wageOffered: 18.5, startDate: "2026-04-20" }
  createdAt       DateTime @default(now())        @map("created_at")

  application     Application @relation(fields: [applicationId], references: [id])

  @@index([tenantId])
  @@index([applicationId, createdAt])
  @@map("application_events")
}
```

## State machine

```
applied → reviewed → hired
applied → reviewed → rejected
applied → rejected         (employer skips review)
applied → withdrawn        (worker)
reviewed → withdrawn       (worker)
```

Transitions enforced in API layer; integrity verified by integration tests.

## RLS

`applications`:

```sql
CREATE POLICY app_self_worker ON applications
  FOR SELECT
  USING (worker_id = current_setting('app.user_id', true)::uuid);

CREATE POLICY app_self_employer ON applications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM job_postings j
      WHERE j.id = applications.job_id
      AND j.employer_id = current_setting('app.user_id', true)::uuid
    )
  );

CREATE POLICY app_admin ON applications
  USING (current_setting('app.role', true) = 'admin');
```

`application_events`: workers read events for their own applications; employers read for their jobs; admins all.

## Indexes

- `applications(jobId, workerId)` unique — duplicate prevention
- `applications(workerId, status)` — worker dashboard list
- `applications(jobId, status)` — employer kanban groups
- Partial: `WHERE status IN ('applied', 'reviewed') AND deleted_at IS NULL` for hot active rows
