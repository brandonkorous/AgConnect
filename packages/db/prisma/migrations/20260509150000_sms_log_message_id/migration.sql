-- Link SmsLog rows to the originating broadcast Message so the employer can
-- see per-recipient delivery state (queued / sent / delivered / opted-out)
-- inline with the broadcast bubble.

ALTER TABLE "sms_log"
  ADD COLUMN "message_id" UUID;

CREATE INDEX "sms_log_message_id_idx" ON "sms_log" ("message_id");
