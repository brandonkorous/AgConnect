-- SMS A2P consent provenance.
-- Records HOW each worker consented to SMS so we can answer Twilio 10DLC
-- carrier disputes. Two paths supported:
--   web_otp           — signed up at agconn.com, verified phone OTP
--   sms_double_opt_in — texted opt-in keyword (JOBS / TRABAJO / AGCONN /
--                        JOIN / START), replied YES to confirmation prompt
--
-- See docs/00-foundation/05-sms-pipeline/ for the campaign and the inbound
-- handler at services/api/src/webhooks/twilio.ts.

ALTER TABLE "users"
    ADD COLUMN "consent_method"     TEXT,
    ADD COLUMN "consented_at"       TIMESTAMP(3),
    ADD COLUMN "sms_opt_in_state"   TEXT;

-- Backfill existing onboarded workers as web_otp consenters at their
-- account creation time. They reached the platform through the existing
-- Clerk phone-OTP signup flow; that act is the consent.
UPDATE "users"
SET    "consent_method" = 'web_otp',
       "consented_at"   = "created_at"
WHERE  "role" = 'worker'
  AND  "onboarded" = TRUE
  AND  "consent_method" IS NULL;

-- Hot-path index: cleanup cron sweeps pending_confirm stubs older than 48h.
CREATE INDEX "users_sms_opt_in_state_updated_at_idx"
    ON "users" ("sms_opt_in_state", "updated_at")
    WHERE "sms_opt_in_state" IS NOT NULL;
