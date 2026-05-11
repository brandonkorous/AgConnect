-- Feature flag registry. One row per (key, tenant_id). tenant_id NULL is the
-- platform-wide default; a non-null row overrides it for that tenant.
-- The admin /system/flags page reads and writes through this table.

CREATE TABLE "feature_flags" (
    "id"          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "key"         TEXT         NOT NULL,
    "tenant_id"   UUID         NULL,
    "enabled"     BOOLEAN      NOT NULL DEFAULT FALSE,
    "payload"     JSONB        NULL,
    "notes"       TEXT         NULL,
    "updated_by"  UUID         NULL,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_tenant_id_fkey"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);

-- Postgres treats two NULLs as distinct in a UNIQUE — use a pair of partial
-- unique indexes so the platform default and per-tenant overrides each get
-- one row per key.
CREATE UNIQUE INDEX "feature_flags_key_platform_uq"
    ON "feature_flags" ("key")
    WHERE "tenant_id" IS NULL;

CREATE UNIQUE INDEX "feature_flags_key_tenant_uq"
    ON "feature_flags" ("key", "tenant_id")
    WHERE "tenant_id" IS NOT NULL;

CREATE INDEX "feature_flags_tenant_id_key_idx"
    ON "feature_flags" ("tenant_id", "key");
