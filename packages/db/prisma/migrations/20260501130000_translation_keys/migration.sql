-- =============================================================================
-- AGCONN — DB-backed UI translations (replaces apps/web/messages/{en,es}.json)
-- =============================================================================
--
-- Single source of truth for UI copy. Locale + namespace + key, scoped by
-- tenant for per-tenant overrides (NULL tenant_id = global default).
--
-- Read pattern: next-intl request config calls a tenant-aware loader that
-- merges tenant-specific rows over global defaults, returns nested object.
-- Cached via unstable_cache(revalidate: 300, tag: 'messages:{tenant}') so
-- admin edits propagate sub-5-min.
--
-- Write pattern: admin app (or seed script) writes rows. RLS enforces:
--   - admin role: full access
--   - service role: SELECT only on published rows for resolved tenant +
--     global defaults
--   - others: nothing
-- =============================================================================

CREATE TYPE "TranslationStatus" AS ENUM ('draft', 'needs_review', 'reviewed', 'published');

CREATE TABLE "translation_keys" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id"     UUID,
    "namespace"     TEXT NOT NULL,
    "key"           TEXT NOT NULL,
    "locale"        "Lang" NOT NULL,
    "value"         TEXT NOT NULL,
    "status"        "TranslationStatus" NOT NULL DEFAULT 'published',
    "reviewed_by"   TEXT,
    "reviewed_at"   TIMESTAMP(3),
    "published_at"  TIMESTAMP(3),
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translation_keys_tenant_fk"
        FOREIGN KEY ("tenant_id")
        REFERENCES "tenants"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Uniqueness: a (tenant, namespace, key, locale) tuple is one row.
-- NULL tenant_id participates in the unique constraint per Postgres NULL
-- semantics; we enforce it via two partial indexes (one for global, one for
-- tenant-scoped) since (NULL, ...) is treated as distinct from (NULL, ...) by
-- default in btree unique indexes.
CREATE UNIQUE INDEX "translation_keys_global_unique"
    ON "translation_keys" ("namespace", "key", "locale")
    WHERE "tenant_id" IS NULL;

CREATE UNIQUE INDEX "translation_keys_tenant_unique"
    ON "translation_keys" ("tenant_id", "namespace", "key", "locale")
    WHERE "tenant_id" IS NOT NULL;

CREATE INDEX "translation_keys_tenant_locale_idx"
    ON "translation_keys" ("tenant_id", "locale");

CREATE INDEX "translation_keys_namespace_locale_idx"
    ON "translation_keys" ("namespace", "locale");

-- =============================================================================
-- Row-Level Security
-- =============================================================================

ALTER TABLE "translation_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "translation_keys" FORCE  ROW LEVEL SECURITY;

-- admin: full access (used by seed scripts, admin app, ops tooling)
CREATE POLICY "translation_keys_admin"
    ON "translation_keys"
    FOR ALL
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

-- service: SELECT only on published rows scoped to (current tenant OR global default)
CREATE POLICY "translation_keys_service_read"
    ON "translation_keys"
    FOR SELECT
    USING (
        current_setting('app.role', true) = 'service'
        AND status = 'published'
        AND (
            tenant_id IS NULL
            OR tenant_id = current_setting('app.tenant_id', true)::uuid
        )
    );
