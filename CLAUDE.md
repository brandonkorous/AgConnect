# AgConn

Bilingual (EN/ES) farmworker platform for the California Central Valley. Multi-tenant from day one. Brand domain: `agconn.com`. Brand theme: **Tierra**.

## Monorepo layout

- [apps/](apps/) — user-facing applications (web PWA, public API, admin dashboard). See [apps/CLAUDE.md](apps/CLAUDE.md).
- [packages/](packages/) — shared internal libraries (db, auth, i18n, ui, schemas, messaging). See [packages/CLAUDE.md](packages/CLAUDE.md).
- [services/](services/) — background workers and async services (SMS, email, resume parsing, cert generation). See [services/CLAUDE.md](services/CLAUDE.md).
- [scripts/](scripts/) — one-off and maintenance scripts. See [scripts/CLAUDE.md](scripts/CLAUDE.md).
- [docs/](docs/) — implementation-ready specs by domain. Start at [docs/README.md](docs/README.md) and [docs/PROJECT-PLAN.md](docs/PROJECT-PLAN.md).

## Source of truth

Per-feature spec folders under `docs/` are authoritative for implementation. Each folder is self-contained (overview, data-model, api, ui, i18n, messaging, acceptance, edge-cases). Decisions marked `> **Inferred:**` are user-overridable starting points, not contracts.

The brand system lives under [docs/brand/](docs/brand/) — palette, typography, voice, components. UI work consults the brand folder before designing anything new.

## House rules

- **File size:** target 200 lines per code file, soft. Decompose into small components and modules. Cohesion beats hitting the number.
- **UI stack:** daisyUI first, Tailwind 4 second. Tailwind is CSS-first (`@theme` in `globals.css`); no `tailwind.config.js`. Hand-build brand-critical sections (hero, pricing, audience-split, footer) — daisyUI defaults clash with Tierra (rounded corners, shadows, accent saturation).
- **Themes:** custom `tierra-light` + `tierra-dark` daisyUI themes track [docs/brand/](docs/brand/). Visual deviation from the theme requires user approval.
- **Icons:** FontAwesome only, per-icon imports (`@fortawesome/free-solid-svg-icons` etc.), not the kit script. No emoji anywhere — code, UI copy, commits, comments.
- **API separation:** domain folders own routes, services, repos, schemas (`worker/`, `employer/`, `admin/`, `billing/`, `messaging/`, `landing/`). Shared `/lib` for cross-cutting. Build for future microservice extraction by lifting the folder.
- **Bilingual at the same time:** every UI string needs both `en.json` and `es.json`. Never ship a feature in EN that doesn't have ES.
- **Multi-tenant invariant:** every DB table has `tenant_id`. Tenant resolved server-side from the Clerk org in middleware — never passed by client.
- **Comments:** default to none. Identifiers explain WHAT; only add a comment when the WHY is non-obvious (hidden constraint, subtle invariant, workaround). Operational scripts in `scripts/` are the exception — they get a header comment.

## Status

Architecture & design phase as of 2026-04-29. No code written yet. Phase A (landing page) builds first per [docs/PROJECT-PLAN.md](docs/PROJECT-PLAN.md), in parallel with Phase 0 foundation.
