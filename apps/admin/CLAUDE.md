# apps/admin

Internal operations console. English-only UI, manages EN+ES translations for the public web app. Runs on a dedicated Clerk instance — no shared identity with workers/employers.

## Surfaces

- **Identity** — tenants, employers, workers, users.
- **Work** — jobs, applications, enrollments, compliance.
- **Operations** — messaging, SMS, email, billing, waitlist. PII redacted by default.
- **System** — feature flags, pg-boss jobs, service health, lookup tables, AEWR.
- **Translations** — DB-backed bilingual copy editor, inline save, web revalidates via signed hook.
- **Audit / reports** — typed actions registry, placement / training / employer activity reports.

## Auth model

- Two Clerk instances. Web uses `NEXT_PUBLIC_CLERK_*`; admin uses `NEXT_PUBLIC_ADMIN_CLERK_*` + `ADMIN_CLERK_SECRET_KEY`.
- [src/proxy.ts](src/proxy.ts) binds Clerk middleware to the admin keys explicitly via `createClerkClient` so the api pod can validate JWTs from either issuer.
- Roles: `org:admin` (read + most writes), `org:super_admin` (deletes, replays, audit redaction). The role gate lives server-side in the api at [services/api/src/middleware/adminClerkAuth.ts](../../services/api/src/middleware/adminClerkAuth.ts).
- Dev/CI bearer fallback via `ADMIN_BEARER_TOKEN`. Never wire this in prod.

## Tenant impersonation

- URL convention: `admin.agconn.com/t/<tenantId>/<route>`. The `(shell)/t/[tenantId]/layout.tsx` calls `requireAdminScope(tenantId)` and forwards the id as `X-Admin-Tenant-Id` on every api fetch.
- Switching tenants rewrites the current sub-path; switching to "Platform" strips `/t/<id>`.
- Tenant scope is **never** a query param or client state — always the URL.

## Calling the API

- All admin pages go through [src/lib/api-server.ts](src/lib/api-server.ts) (`adminFetch`). Never reach Prisma from the admin app — the api owns the DB.
- Endpoints are mounted at `/admin/v1/*`. Routes are grouped by surface (`directory`, `work`, `ops`, `system`, `translations`, `audit`, `reports`, `kpi`, `employers`, `me`).
- `adminFetch` returns a discriminated envelope `{ ok: true, data } | { ok: false, error }`. Render the error inline; don't throw.

## PII reveal pattern

- Tables that contain phones / emails / message bodies (SMS log, email log, messaging, waitlist, user lookup) redact by default and accept `?reveal=true`.
- The reveal call is logged via `admin.data.exported` with `exportType` = `<surface>.reveal`. The reveal toggle is a `Link`, not a form — the URL is the source of truth so refresh and bookmarks stay coherent.
- Server enforces redaction; the client only renders what the server returned. Never decrypt or unmask on the client.

## House rules (admin-specific extensions)

- Server pages by default — `'use client'` only for interactive editors. Mutations go through server actions in `actions.ts` colocated with the page.
- Server actions call `revalidatePath` on success so the next render reflects the change.
- Inline editors save on **blur** (not submit). Cmd/Ctrl+Enter commits early. Server is authoritative — replace optimistic state with the response.
- Tables use `font-mono text-xs` for IDs/dates/keys, `tabular-nums` for counts and money. No emoji anywhere — `FontAwesomeIcon` only, per-icon imports from `@fortawesome/free-solid-svg-icons`.
- Filters are URL state, not React state. The admin layout assumes back-button works.
- Destructive operations gate to `org:super_admin` on the server. The UI may show the button to any admin but the api rejects the call.

## File layout

```
src/
  app/
    (auth)/sign-in/       — Clerk sign-in
    (shell)/              — main signed-in shell (Sidebar + Topbar)
      <surface>/page.tsx  — list page
      <surface>/[id]/page.tsx — detail page
      <surface>/actions.ts — server actions for mutations
      t/[tenantId]/       — tenant-scoped wrapper, re-mounts the shell
  components/admin-shell/ — Sidebar, Topbar, TenantSwitcher, nav-items
  lib/                    — adminFetch + typed wrappers per surface
  proxy.ts                — Clerk middleware (admin instance)
```

## When adding a new surface

1. Add the api routes under `services/api/src/admin/<surface>/routes.ts`. Mount at `/admin/v1/<surface>` in the api index.
2. Add typed wrappers in `apps/admin/src/lib/<surface>-api.ts`.
3. Create `apps/admin/src/app/(shell)/<surface>/page.tsx`. Use existing pages as templates — they share filter / table / reveal patterns.
4. Add to `apps/admin/src/components/admin-shell/nav-items.ts`. Scope is `platform`, `tenant`, or `both`.
5. If the surface mutates state, register audit actions in [packages/audit/src/registry.ts](../../packages/audit/src/registry.ts) and rebuild the package.
