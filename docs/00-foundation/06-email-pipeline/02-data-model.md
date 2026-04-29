# 06 — Email Pipeline: Data Model

## email_log

```prisma
model EmailLog {
  id            String       @id @default(uuid()) @db.Uuid
  tenantId      String       @db.Uuid              @map("tenant_id")
  userId        String?      @db.Uuid              @map("user_id")
  template      String                                                  // e.g., "welcome", "application.hired"
  locale        Lang
  toEmail       String                              @map("to_email")
  fromEmail     String                              @map("from_email")
  subject       String
  vars          Json         @default("{}")
  status        EmailStatus  @default(queued)
  providerId    String?                             @map("provider_id")  // Resend message ID
  errorMsg      String?                             @map("error_msg")
  unsubscribeToken String                            @map("unsubscribe_token")  // signed; one-click works
  queuedAt      DateTime     @default(now())        @map("queued_at")
  sentAt        DateTime?                            @map("sent_at")
  deliveredAt   DateTime?                            @map("delivered_at")
  bouncedAt     DateTime?                            @map("bounced_at")
  complainedAt  DateTime?                            @map("complained_at")
  openedAt      DateTime?                            @map("opened_at")    // optional, may not track
  clickedAt     DateTime?                            @map("clicked_at")

  @@index([tenantId])
  @@index([userId])
  @@index([toEmail])
  @@index([template, queuedAt])
  @@index([status])
  @@map("email_log")
}

enum EmailStatus {
  queued
  sending
  sent
  delivered
  bounced
  complained
  failed
  failed_exhausted
  dropped         // suppressed at send time
}
```

## email_suppression

Address-level suppression list. Updated on bounce / complaint / explicit unsubscribe.

```prisma
model EmailSuppression {
  email       String    @id @db.Citext      // case-insensitive
  reason      SuppressionReason
  suppressedAt DateTime @default(now())     @map("suppressed_at")
  source      String    @default("system")  // bounce | complaint | unsubscribe | admin

  @@map("email_suppression")
}

enum SuppressionReason {
  hard_bounce
  soft_bounce_repeated
  complaint
  unsubscribe
  manual
}
```

> **Inferred:** Address-keyed (not user-keyed) so a re-registered user with a previously-bounced email is also suppressed. CAN-SPAM compliance is per-address.

## Unsubscribe token

Stored alongside the send for one-click compliance:

```ts
// packages/email/src/unsubscribe.ts
export const makeUnsubscribeToken = (emailLogId: string) =>
  jwt.sign({ logId: emailLogId, action: 'unsubscribe' }, process.env.UNSUBSCRIBE_SECRET!, { expiresIn: '90d' });

export const verifyUnsubscribeToken = (token: string) =>
  jwt.verify(token, process.env.UNSUBSCRIBE_SECRET!) as { logId: string; action: string };
```

The token is signed; verification doesn't require DB lookup. The endpoint is public (no auth) per RFC 8058 one-click unsubscribe.

## RLS

`email_log` standard tenant isolation. Self-read for users:

```sql
CREATE POLICY email_log_self ON email_log
  FOR SELECT
  USING (
    user_id = current_setting('app.user_id', true)::uuid
    AND tenant_id = current_setting('app.tenant_id', true)::uuid
  );

CREATE POLICY email_log_admin ON email_log
  USING (current_setting('app.role', true) = 'admin');
```

`email_suppression` is global (no `tenant_id`).

## Indexes & retention

- `email_log` retention: 13 months, then archived. Out of scope for MVP code.
- Partial index for active sends: `CREATE INDEX ON email_log (queuedAt) WHERE status IN ('queued', 'sending');`
