-- Adds renotify_paused flag to job_postings. When true, the
-- recordEditAndMaybeRenotify pipeline skips the SMS/push enqueue on
-- subsequent edits. Used by the employer "Pause renotifications" UI.
-- Defaults to false so existing rows keep current behavior.

ALTER TABLE job_postings
  ADD COLUMN IF NOT EXISTS renotify_paused BOOLEAN NOT NULL DEFAULT FALSE;
