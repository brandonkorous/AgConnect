-- AG-11: the auth bootstrap runs before a tenant is known, as app.role = 'system' scoped to the Clerk user (app.user_id).

CREATE POLICY "users_system_self" ON "users"
    USING (current_setting('app.role', true) = 'system' AND id = current_setting('app.user_id', true))
    WITH CHECK (current_setting('app.role', true) = 'system' AND id = current_setting('app.user_id', true));

CREATE POLICY "employer_contacts_system_self" ON "employer_contacts"
    FOR SELECT
    USING (current_setting('app.role', true) = 'system' AND user_id = current_setting('app.user_id', true));

CREATE POLICY "employer_profiles_system_member" ON "employer_profiles"
    FOR SELECT
    USING (current_setting('app.role', true) = 'system'
        AND EXISTS (SELECT 1 FROM "employer_contacts" ec
            WHERE ec.employer_id = employer_profiles.id
              AND ec.user_id = current_setting('app.user_id', true)
              AND ec.accepted_at IS NOT NULL
              AND ec.deleted_at IS NULL));

CREATE POLICY "roles_system_read" ON "roles"
    FOR SELECT
    USING (current_setting('app.role', true) = 'system' AND tenant_id IS NULL);
