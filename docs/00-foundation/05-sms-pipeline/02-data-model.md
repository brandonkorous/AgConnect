# 05 — SMS Pipeline: Data Model

## sms_log

Append-only audit table. One row per send attempt.

```prisma
model SmsLog {
  id           String        @id @default(uuid()) @db.Uuid
  tenantId     String        @db.Uuid              @map("tenant_id")
  userId       String?       @db.Uuid              @map("user_id")    // null for non-user sends (rare)
  template     String                                                  // e.g., "welcome", "application.applied"
  locale       Lang
  toPhone      String                              @map("to_phone")    // E.164
  body         String                                                  // rendered text (no PII other than name)
  vars         Json          @default("{}")                            // interpolation vars
  status       SmsStatus     @default(queued)
  providerSid  String?                              @map("provider_sid")  // Twilio Message SID
  errorCode    String?                              @map("error_code")    // Twilio error code if failed
  optedOutAt   DateTime?                            @map("opted_out_at")  // set when STOP received from this number
  queuedAt     DateTime      @default(now())        @map("queued_at")
  sentAt       DateTime?                            @map("sent_at")
  deliveredAt  DateTime?                            @map("delivered_at")
  failedAt     DateTime?                            @map("failed_at")

  @@index([tenantId])
  @@index([userId])
  @@index([toPhone])
  @@index([template, queuedAt])
  @@index([status])
  @@map("sms_log")
}

enum SmsStatus {
  queued        // in pg-boss
  scheduled     // deferred for quiet hours
  sending       // handed to Twilio
  sent          // Twilio accepted
  delivered     // Twilio webhook confirms delivery
  failed        // Twilio rejected or delivery failed
  failed_exhausted // retries exhausted
  dropped       // user opted out, not sent
}
```

## sms_opt_out (denormalized for fast check)

Phone-level opt-out cache. Updated by inbound STOP webhook. Read on every send.

```prisma
model SmsOptOut {
  phone       String    @id                 // E.164
  optedOutAt  DateTime  @default(now()) @map("opted_out_at")
  source      String    @default("STOP")    // STOP, manual, admin

  @@map("sms_opt_out")
}
```

Phone-keyed (not user-keyed) because opt-out is per phone number, not per account, per FCC guidance.

## Templates as data (optional)

For MVP, templates live in TS code (`packages/sms/templates/*.ts`). For Phase 2+, consider a `sms_template` table allowing per-tenant overrides:

```prisma
// post-MVP
model SmsTemplate {
  id         String  @id @default(uuid()) @db.Uuid
  tenantId   String  @db.Uuid @map("tenant_id")
  name       String                          // "welcome", "application.applied"
  locale     Lang
  body       String
  vars       String[]                        // declared interpolation vars
  active     Boolean @default(true)

  @@unique([tenantId, name, locale])
  @@map("sms_template")
}
```

Out of scope for MVP — keeping templates in code lets us version-control and review them like code.

## RLS

Standard tenant isolation on `sms_log`. Workers can read their own:

```sql
CREATE POLICY sms_log_self ON sms_log
  FOR SELECT
  USING (
    user_id = current_setting('app.user_id', true)::uuid
    AND tenant_id = current_setting('app.tenant_id', true)::uuid
  );

CREATE POLICY sms_log_admin ON sms_log
  USING (current_setting('app.role', true) = 'admin');
```

`sms_opt_out` is global (no `tenant_id`) since phone uniqueness is global.

## Indexes & retention

- `sms_log` retention: 13 months (covers grant-reporting cycles), then archived to Azure Blob and hard-deleted. Out of scope for MVP code; add to ops runbook.
- Partial index for monitoring: `CREATE INDEX ON sms_log (queuedAt) WHERE status IN ('queued', 'scheduled', 'sending');`
