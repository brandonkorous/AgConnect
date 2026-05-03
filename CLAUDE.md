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

## Design Context

Full brand system: [docs/brand/](docs/brand/). Theme source of truth: [apps/web/src/app/themes/tierra-light.css](apps/web/src/app/themes/tierra-light.css) and [tierra-dark.css](apps/web/src/app/themes/tierra-dark.css). When this section conflicts with the brand folder, the brand folder wins.

### Users
1. **Farmworkers (primary)** — Central Valley CA, often monolingual Spanish, older Android devices, sometimes in field gloves, often skeptical of platforms that promised dignity and delivered surveillance. Must feel calm and respectful before it impresses anyone.
2. **Employers** — Farm Labor Contractors, growers, packing-house operators. Need to trust this is professional infrastructure, not a side project.
3. **Funders & partners** — workforce boards, training providers, grant administrators. Must look credible enough to put on a federal report.

### Brand Personality
**Caregiver / Sage hybrid.** Three words: **calm, dignified, civic.** Voice is plain-spoken, bilingual-first (EN and ES are equal native languages — never translated), specific (numbers, places, hours, dollars), respectful (adults with jobs, not "users to be activated"), and quietly proud. The reference register is a UC Davis extension publication or a CDFA program page, not a B2B SaaS launch. No exclamation marks. No urgency theater. No motivational filler. **Marketing verbs** (unlock, supercharge, transform, reimagine, boost) are forbidden in CTAs and headlines; permitted in eyebrow labels paired with a concrete benefit line below (`BOOST YOUR EARNINGS` over `+$2.50/hr` is fine).

### Aesthetic Direction
- **Civic-utilitarian, not editorial.** Closer to a county-extension field guide than a brand magazine. Static layouts that breathe beat animated layouts that hustle.
- **Daytime brand.** `tierra-light` is default; `tierra-dark` is a respectful counterpart, never the default tech aesthetic.
- **Color is information, not decoration.** Olive primary `#5B6E2E` (~120°), gold accent `#D9B441` (~88°), warm-cream neutrals (~80–95°). Apply color where it serves intent — primary CTAs, active states, count badges, ambient lighting on dark feature cards, statistic highlights. Don't apply where it merely fills space. **No count rule** — judgment over arithmetic.
- **Type does utilitarian work first.** **Inter only** — display, body, UI, forms, tables, money, dates, hours, stats (Inter `tabular-nums slashed-zero` at every size). **JetBrains Mono** is reserved for code-shaped identifiers (`WIOA-1B`, certificate hashes, `#APP-2031`) — not money, not dates. **Italic** is permitted at any size for short emphasis runs (1–4 words inside an otherwise upright headline) — `Buenas tardes, *Miguel*.` is the canonical pattern; italic spanning the whole headline is not.
- **Layered base surfaces with hairline rules** as the default lift on product cards. Product: `base-100` cards on `base-300` page, `base-200` chrome. Marketing: `base-100` page with alternating `base-100/200/300` bands; `bg-primary` for one brand band, `bg-neutral` for one or two "deep stops" per page. **Subtle elevation** (`--shadow-card`, `--shadow-pop`) is reserved for elevated marketing surfaces and dark hero feature cards (`UpNextShift`, `PaycheckCard`).
- **Pill buttons (radius-field: 9999px), 1rem rounded cards (radius-box: 1rem)** are the signature curves. Avatars are circular. Filter chips are pill-shaped (distinct from rectangular tag-style chips and from underlined tabs). Don't introduce ad-hoc radii outside the four-token scale.
- **FontAwesome only**, per-icon imports from `@fortawesome/free-solid-svg-icons` etc. — never the kit script. **No emoji** in product UI or marketing copy (user-generated content excepted).
- **Anti-references:** no glass cards (chrome backdrop-blur is fine), no overdone gradient meshes (ambient radial gradients on dark hero cards are part of the system), no neon CTAs, no AI sparkle iconography, no stock-photo "diverse team in matching polos around a laptop," no drone "epic" agriculture shots, no Kodak/Portra grade, no "your X" SaaS prefix overload, no `-x` / `-e` neutral Spanish forms (audience does not use them).

### Design Principles
1. **Calm before urgent.** State the time; don't manufacture the deadline. "Closes Friday," not "Closing soon!"
2. **Specific before general.** "$19.50/hr in Fresno County, today" beats "Great pay, today!"
3. **Bilingual at the same time.** Never ship an EN string before its native ES counterpart.
4. **Color with intent.** Color carries state, action, hierarchy, ambient lighting — never decoration. Apply where it serves intent; trust judgment, not counting rules.
5. **Quiet pride for good moments.** A check mark, a name, a date — not confetti.
6. **Dignity is the operational floor.** WCAG 2.1 AA minimum, AAA for body where the palette permits, Section 508 on funder-facing surfaces, 44×44 touch targets, visible `:focus-visible` outlines never removed, no state communicated by color alone, respect `prefers-reduced-motion`.
