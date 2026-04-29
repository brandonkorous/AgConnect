# scripts/

One-off and maintenance tooling. Operational, not application code.

## What belongs here

- Database seed and reset scripts.
- One-time data migrations (irreversible, run-once).
- Local dev orchestration helpers (compose wrappers, port checks, env scaffolding).
- CI/CD glue that doesn't fit cleanly into GitHub Actions YAML.
- Code generation (Prisma → Zod sync, type emission, fixture builders).

## What does NOT belong here

- Application code. If it's deployed, it's an `app/` or `service/`.
- Reusable libraries — those go in `packages/`.
- Tests — tests live next to source.

## Conventions

- One concern per script. A script that does two things should be two scripts.
- Runnable via `pnpm <script-name>` (or `tsx scripts/<name>.ts` directly). No manual cwd, env juggling, or "first run X then Y" instructions in chat.
- `--dry-run` flag required for any script that mutates production data. Default to dry-run if unsure.
- **Header comment is required** (the one place the codebase's no-comment default flips): what it does, when to run it, what it touches, what it cannot be safely run twice. Operational tooling is rare-use enough to justify the context.
- Destructive scripts (drop, truncate, hard-delete) require a typed confirmation prompt unless `--force` is passed.
