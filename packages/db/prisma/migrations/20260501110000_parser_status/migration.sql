-- Track resume parser progress per worker so the UI can poll for completion
-- and the dashboard can show progress states. Default null (no parse run).
CREATE TYPE "ParserStatus" AS ENUM ('parsing', 'parsed', 'failed');

ALTER TABLE "worker_profiles"
  ADD COLUMN "parser_status" "ParserStatus";
