# 05 — Training Browser: Data Model

## training_programs

```prisma
model TrainingProgram {
  id              String   @id @default(uuid()) @db.Uuid
  tenantId        String   @db.Uuid              @map("tenant_id")
  orgId           String   @db.Uuid              @map("org_id")          // FK → users (training_org role)
  titleEn         String                          @map("title_en")
  titleEs         String                          @map("title_es")
  summaryEn       String?  @db.VarChar(280)      @map("summary_en")
  summaryEs       String?  @db.VarChar(280)      @map("summary_es")
  descriptionEn   String                          @map("description_en")
  descriptionEs   String                          @map("description_es")
  funder          Funder
  county          County
  locationName    String                          @map("location_name")     // "Fresno County Workforce Center"
  locationAddress String                          @map("location_address")
  capacity        Int
  enrolledCount   Int      @default(0)            @map("enrolled_count")
  startDate       DateTime                        @map("start_date")
  endDate         DateTime                        @map("end_date")
  sessionTimes    Json     @default("[]")         @map("session_times")     // array of { start, end } ISO datetimes
  topics          String[]                        // ["pesticide_application", "tractor_safety"]
  certName        String?                         @map("cert_name")          // displayed on cert
  seoSlug         String   @unique                @map("seo_slug")
  status          ProgramStatus @default(active)
  createdAt       DateTime @default(now())        @map("created_at")
  updatedAt       DateTime @updatedAt             @map("updated_at")
  deletedAt       DateTime?                       @map("deleted_at")

  org             User     @relation(fields: [orgId], references: [id])
  enrollments     Enrollment[]

  @@index([tenantId])
  @@index([county])
  @@index([funder])
  @@index([status, startDate])
  @@map("training_programs")
}

enum Funder { CDFA F3 CalOSBA EDD other }
enum ProgramStatus { draft active full closed canceled }
```

`enrolledCount` denormalized counter; updated via trigger on `enrollments` insert/delete or maintained at API layer with care. CHECK constraint: `enrolled_count <= capacity`.

## sessionTimes JSONB shape

```ts
export const SessionTimeSchema = z.object({
  start: z.string().datetime(),    // ISO 8601 with offset
  end:   z.string().datetime(),
  notes: z.string().max(140).optional(),  // e.g., "Bring lunch"
});
export const SessionTimesSchema = z.array(SessionTimeSchema).max(10);
```

For MVP, multiple sessions allowed, but reminders only fire for the FIRST session start time.

## enrollments

```prisma
model Enrollment {
  id              String    @id @default(uuid()) @db.Uuid
  tenantId        String    @db.Uuid              @map("tenant_id")
  programId       String    @db.Uuid              @map("program_id")
  workerId        String    @db.Uuid              @map("worker_id")
  status          EnrollmentStatus @default(enrolled)
  enrolledAt      DateTime  @default(now())       @map("enrolled_at")
  completedAt     DateTime?                       @map("completed_at")
  droppedAt       DateTime?                       @map("dropped_at")
  certUrl         String?                         @map("cert_url")            // Azure Blob path
  certGeneratedAt DateTime?                       @map("cert_generated_at")
  certificateId   String?   @unique               @map("certificate_id")
  noShow          Boolean   @default(false)       @map("no_show")
  reminderSent48h Boolean   @default(false)       @map("reminder_sent_48h")
  reminderSent2h  Boolean   @default(false)       @map("reminder_sent_2h")
  createdAt       DateTime  @default(now())       @map("created_at")
  updatedAt       DateTime  @updatedAt            @map("updated_at")
  deletedAt       DateTime?                       @map("deleted_at")

  program         TrainingProgram @relation(fields: [programId], references: [id])
  worker          User            @relation(fields: [workerId], references: [id])

  @@unique([programId, workerId])
  @@index([tenantId])
  @@index([workerId, status])
  @@index([programId, status])
  @@map("enrollments")
}

enum EnrollmentStatus { enrolled completed dropped }
```

`reminderSent48h` and `reminderSent2h` flags ensure idempotent reminders.

## RLS

`training_programs`:

```sql
-- All workers and employers in the tenant can read active programs
CREATE POLICY tp_read ON training_programs FOR SELECT
  USING (status IN ('active', 'full') AND deleted_at IS NULL);

-- Training org can manage their own programs
CREATE POLICY tp_org_manage ON training_programs FOR ALL
  USING (org_id = current_setting('app.user_id', true)::uuid);

-- Admin
CREATE POLICY tp_admin ON training_programs USING (current_setting('app.role', true) = 'admin');
```

`enrollments`:

```sql
CREATE POLICY enr_self ON enrollments FOR ALL
  USING (worker_id = current_setting('app.user_id', true)::uuid);

CREATE POLICY enr_org ON enrollments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM training_programs tp
      WHERE tp.id = enrollments.program_id
      AND tp.org_id = current_setting('app.user_id', true)::uuid
    )
  );

CREATE POLICY enr_admin ON enrollments USING (current_setting('app.role', true) = 'admin');
```

## Indexes

- `training_programs(tenant_id, status, start_date)` — listing
- `training_programs(seo_slug)` unique — public detail page
- `enrollments(workerId, status)` — worker dashboard
- `enrollments(programId, status)` — org dashboard
- Partial: `WHERE status = 'enrolled' AND completed_at IS NULL` for hot active rows

## Reminder dispatcher (cron)

```ts
pgBoss.schedule('training-reminders', '*/15 * * * *', {});

pgBoss.work('training-reminders', async () => {
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 3600e3);
  const in2h  = new Date(now.getTime() + 2 * 3600e3);

  // 48h reminders for sessions starting in 47-49h
  const enrollments48h = await db.enrollment.findMany({
    where: {
      status: 'enrolled',
      reminderSent48h: false,
      program: { startDate: { gte: addHours(now, 47), lte: addHours(now, 49) }, status: 'active' },
    },
    include: { worker: true, program: true },
  });
  for (const e of enrollments48h) {
    await enqueueSms({ ..., template: 'training.reminder.48h', vars: {...}, jobKey: `train-48h-${e.id}` });
    await db.enrollment.update({ where: { id: e.id }, data: { reminderSent48h: true } });
  }

  // 2h reminders similar
  // ...
});
```
