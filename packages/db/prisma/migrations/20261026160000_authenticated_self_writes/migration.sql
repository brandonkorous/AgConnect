-- AG-11: writes signed-in users already make, which only worked while the app role bypassed RLS.

-- A worker or employer member logs the status change they made, on an application they can already see.
CREATE POLICY "application_events_self_worker_insert" ON "application_events"
    FOR INSERT
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND actor_user_id = current_setting('app.user_id', true)
        AND EXISTS (SELECT 1 FROM "applications" a
            WHERE a.id = application_events.application_id
              AND a.worker_id = current_setting('app.user_id', true)));

CREATE POLICY "application_events_self_employer_insert" ON "application_events"
    FOR INSERT
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND actor_user_id = current_setting('app.user_id', true)
        AND EXISTS (SELECT 1 FROM "applications" a JOIN "job_postings" j ON j.id = a.job_id
            WHERE a.id = application_events.application_id
              AND j.employer_id = app.setting_uuid('app.employer_id')));

-- An employer member records their own license submission for the active employer.
CREATE POLICY "verification_log_self_employer_insert" ON "verification_log"
    FOR INSERT
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = app.setting_uuid('app.tenant_id')
        AND employer_id = app.setting_uuid('app.employer_id')
        AND actor_user_id = current_setting('app.user_id', true)
        AND action = 'submitted');

-- A signed-in user writes their own users row (worker onboarding, language, email).
CREATE POLICY "users_self_insert" ON "users"
    FOR INSERT
    WITH CHECK (current_setting('app.role', true) = 'authenticated' AND id = current_setting('app.user_id', true));

CREATE POLICY "users_self_update" ON "users"
    FOR UPDATE
    USING (current_setting('app.role', true) = 'authenticated' AND id = current_setting('app.user_id', true))
    WITH CHECK (current_setting('app.role', true) = 'authenticated' AND id = current_setting('app.user_id', true));

-- ...but never their role, permissions, tenant or SMS consent record, which other flows own.
CREATE OR REPLACE FUNCTION app.users_self_write_guard() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF current_setting('app.role', true) IS DISTINCT FROM 'authenticated' THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'INSERT' THEN
        IF NEW.role <> 'worker' OR NEW.permissions <> '{}' OR NEW.tenant_id IS NOT NULL
           OR NEW.consent_method IS NOT NULL OR NEW.consented_at IS NOT NULL OR NEW.sms_opt_in_state IS NOT NULL THEN
            RAISE EXCEPTION 'users: a signed-in user may only create their own plain worker row' USING ERRCODE = '42501';
        END IF;
    ELSIF (NEW.role, NEW.permissions, NEW.tenant_id, NEW.consent_method, NEW.consented_at, NEW.sms_opt_in_state)
          IS DISTINCT FROM (OLD.role, OLD.permissions, OLD.tenant_id, OLD.consent_method, OLD.consented_at, OLD.sms_opt_in_state) THEN
        RAISE EXCEPTION 'users: role, permissions, tenant and consent are not self-service' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END
$$;

CREATE TRIGGER "users_self_write_guard"
    BEFORE INSERT OR UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION app.users_self_write_guard();
