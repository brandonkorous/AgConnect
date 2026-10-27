-- AG-11: reads across entities that the API makes on every page and that only worked while RLS was bypassed.
-- Each helper answers one narrow question about the caller (app.user_id / app.employer_id) and runs as the owner
-- (owner_all policy, db-role.sql), so a policy can use it without a policy cycle.

CREATE FUNCTION app.worker_related_job(job uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
    AS $$ SELECT EXISTS (SELECT 1 FROM applications a WHERE a.job_id = job AND a.worker_id = current_setting('app.user_id', true))
              OR EXISTS (SELECT 1 FROM worker_invitations w WHERE w.job_id = job AND w.worker_id = current_setting('app.user_id', true)) $$;

CREATE FUNCTION app.worker_related_employer(employer uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
    AS $$ WITH me AS (SELECT current_setting('app.user_id', true) AS id)
          SELECT EXISTS (SELECT 1 FROM applications a JOIN job_postings j ON j.id = a.job_id, me WHERE j.employer_id = employer AND a.worker_id = me.id)
              OR EXISTS (SELECT 1 FROM worker_invitations w, me WHERE w.employer_id = employer AND w.worker_id = me.id)
              OR EXISTS (SELECT 1 FROM shift_assignments sa JOIN shifts s ON s.id = sa.shift_id, me WHERE s.employer_id = employer AND sa.worker_user_id = me.id)
              OR EXISTS (SELECT 1 FROM crew_members cm JOIN crews c ON c.id = cm.crew_id, me WHERE c.employer_id = employer AND cm.worker_user_id = me.id)
              OR EXISTS (SELECT 1 FROM payroll_lines pl JOIN payroll_periods pp ON pp.id = pl.period_id, me WHERE pp.employer_id = employer AND pl.worker_user_id = me.id)
              OR EXISTS (SELECT 1 FROM conversation_participants cp JOIN conversations co ON co.id = cp.conversation_id, me WHERE co.employer_id = employer AND cp.user_id = me.id) $$;

CREATE FUNCTION app.employer_is_listed(employer uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
    AS $$ SELECT EXISTS (SELECT 1 FROM job_postings j WHERE j.employer_id = employer AND j.status = 'active' AND j.deleted_at IS NULL) $$;

CREATE FUNCTION app.worker_in_payroll_period(period uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
    AS $$ SELECT EXISTS (SELECT 1 FROM payroll_lines pl WHERE pl.period_id = period AND pl.worker_user_id = current_setting('app.user_id', true)) $$;

CREATE FUNCTION app.worker_in_crew(crew uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
    AS $$ SELECT EXISTS (SELECT 1 FROM crew_members cm WHERE cm.crew_id = crew AND cm.worker_user_id = current_setting('app.user_id', true))
              OR EXISTS (SELECT 1 FROM crews c WHERE c.id = crew AND c.foreman_user_id = current_setting('app.user_id', true)) $$;

CREATE FUNCTION app.worker_enrolled_in(program uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
    AS $$ SELECT EXISTS (SELECT 1 FROM enrollments e WHERE e.program_id = program AND e.worker_id = current_setting('app.user_id', true)) $$;

-- A user the active employer works with: applicant, crew member or foreman, assignee, conversation participant,
-- invitee, payroll worker, or a member of its own roster.
CREATE FUNCTION app.user_related_to_employer(target text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
    AS $$ WITH e AS (SELECT app.setting_uuid('app.employer_id') AS id)
          SELECT EXISTS (SELECT 1 FROM applications a JOIN job_postings j ON j.id = a.job_id, e WHERE j.employer_id = e.id AND a.worker_id = target)
              OR EXISTS (SELECT 1 FROM crew_members cm JOIN crews c ON c.id = cm.crew_id, e WHERE c.employer_id = e.id AND cm.worker_user_id = target)
              OR EXISTS (SELECT 1 FROM crews c, e WHERE c.employer_id = e.id AND c.foreman_user_id = target)
              OR EXISTS (SELECT 1 FROM shift_assignments sa JOIN shifts s ON s.id = sa.shift_id, e WHERE s.employer_id = e.id AND sa.worker_user_id = target)
              OR EXISTS (SELECT 1 FROM conversation_participants cp JOIN conversations co ON co.id = cp.conversation_id, e WHERE co.employer_id = e.id AND cp.user_id = target)
              OR EXISTS (SELECT 1 FROM worker_invitations w, e WHERE w.employer_id = e.id AND w.worker_id = target)
              OR EXISTS (SELECT 1 FROM payroll_lines pl JOIN payroll_periods pp ON pp.id = pl.period_id, e WHERE pp.employer_id = e.id AND pl.worker_user_id = target)
              OR EXISTS (SELECT 1 FROM employer_contacts ec, e WHERE ec.employer_id = e.id AND ec.user_id = target) $$;

-- Worker search: an onboarded, live worker profile.
CREATE FUNCTION app.is_searchable_worker(target text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
    AS $$ SELECT EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = target AND wp.onboarded_at IS NOT NULL AND wp.deleted_at IS NULL) $$;

-- A user a worker deals with: the foreman of their crew, or someone in one of their conversations.
CREATE FUNCTION app.user_related_to_worker(target text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
    AS $$ SELECT EXISTS (SELECT 1 FROM crews c JOIN crew_members cm ON cm.crew_id = c.id
                         WHERE c.foreman_user_id = target AND cm.worker_user_id = current_setting('app.user_id', true))
              OR EXISTS (SELECT 1 FROM conversation_participants mine JOIN conversation_participants theirs ON theirs.conversation_id = mine.conversation_id
                         WHERE mine.user_id = current_setting('app.user_id', true) AND theirs.user_id = target) $$;

CREATE FUNCTION app.is_training_org(target text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
    AS $$ SELECT EXISTS (SELECT 1 FROM training_programs tp WHERE tp.org_id = target AND tp.deleted_at IS NULL) $$;

CREATE POLICY "job_postings_worker_related_read" ON "job_postings" FOR SELECT
    USING (current_setting('app.role', true) = 'authenticated' AND app.worker_related_job(id));
CREATE POLICY "employer_profiles_listed_read" ON "employer_profiles" FOR SELECT
    USING (current_setting('app.role', true) IN ('authenticated', 'anonymous') AND app.employer_is_listed(id));
CREATE POLICY "employer_profiles_worker_related_read" ON "employer_profiles" FOR SELECT
    USING (current_setting('app.role', true) = 'authenticated' AND app.worker_related_employer(id));
CREATE POLICY "payroll_periods_worker_read" ON "payroll_periods" FOR SELECT
    USING (current_setting('app.role', true) = 'authenticated' AND app.worker_in_payroll_period(id));
CREATE POLICY "crews_worker_read" ON "crews" FOR SELECT
    USING (current_setting('app.role', true) = 'authenticated' AND app.worker_in_crew(id));
CREATE POLICY "training_programs_enrolled_read" ON "training_programs" FOR SELECT
    USING (current_setting('app.role', true) = 'authenticated' AND app.worker_enrolled_in(id));
CREATE POLICY "users_employer_read" ON "users" FOR SELECT
    USING (current_setting('app.role', true) = 'authenticated' AND app.setting_uuid('app.employer_id') IS NOT NULL
        AND (app.is_searchable_worker(id) OR app.user_related_to_employer(id)));
CREATE POLICY "worker_profiles_employer_read" ON "worker_profiles" FOR SELECT
    USING (current_setting('app.role', true) = 'authenticated' AND app.setting_uuid('app.employer_id') IS NOT NULL
        AND (app.is_searchable_worker(id) OR app.user_related_to_employer(id)));
CREATE POLICY "users_worker_related_read" ON "users" FOR SELECT
    USING (current_setting('app.role', true) = 'authenticated' AND app.user_related_to_worker(id));
CREATE POLICY "users_training_org_public" ON "users" FOR SELECT
    USING (current_setting('app.role', true) IN ('authenticated', 'anonymous') AND role = 'training_org' AND app.is_training_org(id));
