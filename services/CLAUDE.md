# services/

Background workers and async services. Long-running processes with their own deployment lifecycle, separate from `apps/`.

## Suggested services

Materialize as needed — don't pre-create empty services.

- `sms-worker/` — pg-boss consumer for outbound SMS via Twilio. Honors quiet hours (9PM–7AM `America/Los_Angeles`). Idempotency by job key.
- `email-worker/` — pg-boss consumer for transactional email via Resend. React Email templates from `packages/messaging`.
- `resume-parser/` — Anthropic Claude consumer that converts uploaded resumes to `ResumeSchema` JSON. Prompt caching on the system prompt.
- `cert-generator/` — React-PDF bilingual certificate renderer. Writes signed PDFs to Supabase Storage, persists metadata via `packages/db`.
- `scheduler/` — pg-boss producer for time-based jobs (training reminders, application-status nudges, weekly KPI rollups).

## Conventions

- Each service is its own deployable container: independent `package.json`, `Dockerfile`, GKE `Deployment`.
- Services consume `packages/db`, `packages/messaging`, `packages/schemas`. They do not import from `apps/`.
- **Idempotency is mandatory** — every queue handler accepts a job key, exits cleanly on duplicates, and never double-sends.
- Logging: structured JSON to stdout. Propagate trace IDs from the producing call site.
- No public HTTP surface. A `/health` and `/ready` endpoint for GKE probes is the only HTTP. User-facing surfaces stay in `apps/api`.
- Designed for future microservice extraction: lift the folder, drop in a Helm chart. Don't reach across service boundaries.
