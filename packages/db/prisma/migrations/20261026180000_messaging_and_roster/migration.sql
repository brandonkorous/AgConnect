-- AG-11: the rest of the RLS audit of services/api (messaging, training rosters, SMS keyword publish).

-- A participant marks their own conversation read.
CREATE POLICY "cp_self_update" ON "conversation_participants"
    FOR UPDATE
    USING (current_setting('app.role', true) = 'authenticated' AND user_id = current_setting('app.user_id', true))
    WITH CHECK (current_setting('app.role', true) = 'authenticated' AND user_id = current_setting('app.user_id', true));

-- Any member of the active employer reads and sends in that employer's conversations, not only participants.
CREATE POLICY "messages_employer" ON "messages"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = app.setting_uuid('app.tenant_id')
        AND app.is_active_employer_conversation(conversation_id))
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = app.setting_uuid('app.tenant_id')
        AND sender_user_id = current_setting('app.user_id', true)
        AND app.is_active_employer_conversation(conversation_id));

-- A training org reads the users and profiles of workers enrolled in its programs.
CREATE FUNCTION app.enrolled_with_my_org(target text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
    AS $$ SELECT EXISTS (SELECT 1 FROM enrollments e JOIN training_programs tp ON tp.id = e.program_id
                         WHERE e.worker_id = target AND tp.org_id = current_setting('app.user_id', true)) $$;

CREATE POLICY "users_training_org_roster" ON "users" FOR SELECT
    USING (current_setting('app.role', true) = 'authenticated' AND app.enrolled_with_my_org(id));
CREATE POLICY "worker_profiles_training_org_roster" ON "worker_profiles" FOR SELECT
    USING (current_setting('app.role', true) = 'authenticated' AND app.enrolled_with_my_org(id));

-- SMS keywords are unique across tenants, so publishing asks about every tenant's keywords, and nothing else.
CREATE FUNCTION app.sms_keyword_taken(candidate text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
    AS $$ SELECT EXISTS (SELECT 1 FROM sms_keywords k WHERE lower(k.keyword) = lower(candidate)) $$;
