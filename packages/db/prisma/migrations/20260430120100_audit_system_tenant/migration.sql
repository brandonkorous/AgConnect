-- Seed the sentinel system tenant referenced by tenantless audit events
-- (system.audit.*, error.unhandled). The audit_events.tenant_id FK requires
-- this row to exist before any system-emitted event can be written.
--
-- The id is hard-coded as the all-zero UUID and reserved exclusively for
-- system-scope rows. Application code never writes business data here.

INSERT INTO "tenants" ("id", "slug", "name", "is_public", "settings", "created_at", "updated_at")
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'system',
    'System',
    false,
    '{}'::jsonb,
    now(),
    now()
)
ON CONFLICT ("id") DO NOTHING;
