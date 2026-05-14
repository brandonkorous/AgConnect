-- RLS for feature_flags. The table was added in 20260511120000_feature_flags
-- without policies; scripts/check-rls.mjs flagged it. Standard three-policy
-- template, with the twist that tenant_id NULL = platform-wide default and
-- must remain readable to every tenant.
--
-- See docs/00-foundation/03-database/04-rls.md for the policy contract.

ALTER TABLE "feature_flags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "feature_flags" FORCE  ROW LEVEL SECURITY;

CREATE POLICY "feature_flags_admin" ON "feature_flags"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "feature_flags_service" ON "feature_flags"
    FOR SELECT
    USING (
        current_setting('app.role', true) IN ('service', 'webhook')
        AND (
            tenant_id IS NULL
            OR tenant_id = current_setting('app.tenant_id', true)::uuid
        )
    );

CREATE POLICY "feature_flags_tenant_read" ON "feature_flags"
    FOR SELECT
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND (
            tenant_id IS NULL
            OR tenant_id = current_setting('app.tenant_id', true)::uuid
        )
    );
