-- CreateEnum
CREATE TYPE "Lang" AS ENUM ('en', 'es');

-- CreateEnum
CREATE TYPE "WaitlistAudience" AS ENUM ('worker', 'employer', 'training_org', 'other');

-- CreateEnum
CREATE TYPE "WaitlistSource" AS ENUM ('landing_final_cta', 'landing_coming_soon', 'landing_waitlist_form', 'landing_newsletter');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('queued', 'sending', 'sent', 'delivered', 'bounced', 'complained', 'failed', 'dropped');

-- CreateEnum
CREATE TYPE "SuppressionReason" AS ENUM ('unsubscribe', 'hard_bounce', 'soft_bounce_repeated', 'complaint', 'manual');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "county" TEXT,
    "preferred_lang" "Lang" NOT NULL DEFAULT 'es',
    "audience" "WaitlistAudience",
    "source" "WaitlistSource" NOT NULL DEFAULT 'landing_final_cta',
    "confirmed_at" TIMESTAMP(3),
    "welcomed_at" TIMESTAMP(3),
    "unsubscribed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_log" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "template" TEXT NOT NULL,
    "locale" "Lang" NOT NULL,
    "to_email" TEXT NOT NULL,
    "from_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'queued',
    "provider_id" TEXT,
    "error_msg" TEXT,
    "ref_type" TEXT,
    "ref_id" TEXT,
    "queued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "bounced_at" TIMESTAMP(3),
    "complained_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),

    CONSTRAINT "email_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_suppression" (
    "email" TEXT NOT NULL,
    "reason" "SuppressionReason" NOT NULL,
    "suppressed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "email_suppression_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "waitlist_tenant_id_idx" ON "waitlist"("tenant_id");

-- CreateIndex
CREATE INDEX "waitlist_phone_idx" ON "waitlist"("phone");

-- CreateIndex
CREATE INDEX "waitlist_county_idx" ON "waitlist"("county");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_tenant_email_key" ON "waitlist"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "email_log_provider_id_key" ON "email_log"("provider_id");

-- CreateIndex
CREATE INDEX "email_log_tenant_id_idx" ON "email_log"("tenant_id");

-- CreateIndex
CREATE INDEX "email_log_to_email_idx" ON "email_log"("to_email");

-- CreateIndex
CREATE INDEX "email_log_template_queued_at_idx" ON "email_log"("template", "queued_at");

-- CreateIndex
CREATE INDEX "email_log_status_idx" ON "email_log"("status");

-- CreateIndex
CREATE INDEX "email_log_ref_type_ref_id_idx" ON "email_log"("ref_type", "ref_id");

-- AddForeignKey
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
