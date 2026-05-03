# apps/

User-facing applications. Each app is independently deployable.

## Apps

Materialize as needed — don't pre-create empty app folders.

- `web/` — Next.js 16 PWA serving worker, employer, and marketing surfaces. Locale-prefixed routes (`/en`, `/es`) via next-intl. RSC + ISR. App Router.
- `api/` — Hono 4 standalone REST API. **Not** Next.js route handlers — kickoff architecture decision. Mounted at `/v1/*`. Public unauthenticated endpoints scoped to `/v1/landing/*` only.
- `admin/` — Next.js 16 grant reporting dashboard. Internal use, magic-link auth via Clerk.

## Conventions

- Each app owns its `package.json`, `tsconfig.json`, dev/build/start scripts. Apps consume `packages/*`; never the reverse.
- Frontend: daisyUI + Tailwind 4 + FontAwesome (per-icon imports). Themes `tierra-light` / `tierra-dark`. Brand-critical sections (hero, pricing, audience-split, footer) hand-built to match Paper designs in [../docs/40-marketing/](../docs/40-marketing/).
- Form inputs: use the daisyUI `fieldset` pattern, not the deprecated `form-control` wrapper. One `<fieldset class="fieldset">` per input — keeps label/control/help-text grouping consistent and accessible. Pattern:

  ```tsx
  <fieldset className="fieldset">
    <legend className="fieldset-legend">Page title</legend>
    <input type="text" className="input" placeholder="My awesome page" />
    <p className="label">You can edit page title later on from settings</p>
  </fieldset>
  ```
- Page-width shell: every full-width surface (marketing, product, admin chrome, sticky banners) uses the canonical container — `container mx-auto px-5 md:px-8 lg:px-20`. Vertical padding is per-section (e.g. `py-24 lg:py-30` for marketing bands, `py-5 sm:py-6` for chrome). **Do not** introduce `max-w-7xl`, `max-w-6xl`, etc. on a page-level wrapper — those are a parallel scale that drifts from the rest of the system. Reading-width caps (`max-w-prose`, `max-w-2xl`) are still allowed but only on a child of the container, never on the wrapper itself. See [../docs/brand/04-spacing-layout.md#container-widths](../docs/brand/04-spacing-layout.md#container-widths).
- Backend (`api/`): Hono router, Prisma, Postgres with RLS. Tenant resolved in middleware from Clerk org and pinned via `set_config('app.tenant_id', ...)`. Domain folders (`worker/`, `employer/`, `admin/`, `billing/`, `messaging/`, `landing/`) each own their routes, services, repos, Zod schemas.
- Auth: Clerk SMS OTP for workers, magic link for employers and admins. Org-bound — tenant === org.
- HTTP: `/v1/*` versioning. Errors are typed; never leak DB messages to clients. Zod validates every request body and response shape.

## When working in an app

The implementation spec for any feature lives under [../docs/](../docs/), organized by domain. Don't duplicate spec content into per-app docs — link to the source. If a spec is ambiguous, fix the spec first, then implement.
