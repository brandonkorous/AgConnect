-- AG-11: job photos are private on Azure Blob; rows keep the storage key and the API signs a read URL per request.
-- Runs as admin so it works whether or not the owner bypasses RLS (job_photos is FORCE).
SELECT set_config('app.role', 'admin', false);
UPDATE "job_photos" SET "url" = "storage_key" WHERE "url" ~ '^https?://';
SELECT set_config('app.role', '', false);
