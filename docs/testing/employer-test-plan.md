# /employer Test Plan

End-to-end functional + design test of the `/employer` surface. We hunt for anything not functioning or not designed correctly. Living document — check items off as we go, log defects inline per route.

**Method:** one route at a time, top to bottom. Each route runs the same 6 sub-phases before we move on:
1. **Smoke** — loads in EN, no 500s / no console errors
2. **Functional** — every link, button, form, action works end-to-end
3. **Bilingual** — ES renders, no missing keys, locale toggle preserves path
4. **Design** — Tierra light + dark, responsive, brand fidelity (`/tierra-review` + `/impeccable:audit` spot-check)
5. **A11y** — keyboard nav, focus rings, labels, contrast
6. **Defects** — log issues found at this route inline

## Tooling

- **Functional / interaction:** Playwright MCP (`browser_navigate`, `browser_click`, `browser_fill_form`, `browser_snapshot`, `browser_console_messages`, `browser_network_requests`).
- **Design audit:** `/tierra-review` for brand fidelity; `/impeccable:audit` for a11y/perf/theming sweep.
- **Bilingual:** locale toggle in top bar; spot-check that no `messages.*.missing` keys log to console.
- **Themes:** Tierra light + dark via `data-theme` switch.

## Pre-flight

- [x] Local dev running on :3000 (confirmed)
- [x] Logged-in employer test account (confirmed — "Korous Farms", verification pending)
- [ ] Test data: **mostly empty** — 0 jobs, 0 applicants, no payment method, no subscription, profile 25%. Empty-state coverage is good; functional flows that need data (publish job, view applicants, payroll periods) will need data created during walk
- [x] App-side console clean (5 console exceptions are Chrome-extension messaging noise, not app)

## Shell chrome (cross-cutting — test once)

Sidebar + topbar + verification banner appear on every authed route. Test once here; per-route checks only flag regressions specific to that route.

### Sidebar
- [x] All 11 nav items have correct hrefs (verified via accessibility tree)
- [ ] Active state highlights correctly when on each route (verified per-route as we walk)
- [ ] Count badges (jobs / candidates / compliance / messages) match data (deferred — currently zero data)
- [x] Wordmark link → `/en` (correct)
- [ ] Sidebar renders in `tierra-dark` correctly (deferred to design phase)
- [ ] Renders in ES with full label translations (verified per-route in bilingual sub-phase)

### TopBar
- [x] Search input + kbd hint render
- [⚠️] **Search submit is a stub** — see SHELL-001 below
- [x] Locale toggle has both EN and ES links visible (preserves path via SidebarLocaleToggle)
- [⚠️] **Help button is a stub** — see SHELL-002 below
- [x] "Post job" CTA → `/en/employer/jobs/new` (correct, visible because `canPublish=true` despite verification pending — possible bug, see SHELL-004)
- [ ] Renders in `tierra-dark` correctly (deferred)
- [ ] Renders in ES (verified per-route)

### VerificationBanner
- [x] Appears for unverified employer ("Verification pending — Edit business info")
- [x] CTA → `/en/employer/profile` (correct)
- [⚠️] **Banner missing `role="alert"`** — see SHELL-003 below
- [ ] Hides when verified (cannot test — account is unverified; deferred)

### Auth guards
- [ ] Unauthenticated visit to any shell route redirects to sign-in (deferred — would require logout)
- [ ] Worker-role user visiting `/employer/*` is rejected/redirected (deferred — would require role swap)

### Shell-chrome defects

- **SHELL-001** [P2] TopBar — Search input has no submit handler, no enclosing form, no onChange action. Typing does nothing. `apps/web/src/components/employer/EmployerTopBar.tsx:22-33`. Either wire to a search route or remove the control.
- **SHELL-002** [P2] TopBar — Help button is a bare `<button type="button">` with no onClick. Renders an interactive control that does nothing. `apps/web/src/components/employer/EmployerTopBar.tsx:38-44`. Either wire to a help drawer/modal/route or remove.
- **SHELL-003** [P2] VerificationBanner — banner does not use `role="alert"` (or `role="status"`) — screen readers won't announce verification status. `apps/web/src/components/employer/VerificationBanner.tsx`.
- **SHELL-004** [P3] TopBar — `canPublish=true` while verification is pending and the verification banner explicitly says "you can prepare drafts but can't publish them yet". The "Post a job" top-bar CTA still renders, which contradicts the banner copy. Either gate the top-bar CTA behind verification, or change the banner copy.
- **SHELL-005** [P2] **Cookie consent banner: missing translation key.** Console error on every page: `IntlError: MISSING_MESSAGE: Could not resolve shell.consent.back in messages for locale en`. The "back" button on the consent banner's Customize view has no EN string. Probably also missing in `es.json`. Caught on `/compliance` but the banner mounts globally so this fires on every route.

---

## 1. `/employers` (marketing)

Public-facing employer landing page.

### Smoke
- [x] `/en/employers` loads, no app console errors (only Chrome-extension noise)
### Functional
- [x] Hero CTA "Post your first job — free" → `/en/employer/sign-up`
- [x] "See full pricing →" → `/en#pricing` (homepage anchor)
- [⚠️] Top promo banner self-link — see MKT-001
- [ ] Footer links resolve (32 links — sampled, deferred full crawl; many target pages outside this scope `/training`, `/skills-wallet`, `/promotora`, `/partners`, `/press`, `/careers`, `/trust`, `/accessibility`, `/contact` — verify exist)
- [x] Lang toggle in header switches `/en/employers` ↔ `/es/employers`
- [x] Light/Dark theme toggle buttons work (switches `data-theme` attribute)
### Bilingual
- [x] `/es/employers` renders fully translated; H1, all H2s, body, CTAs, page title all in ES
- [x] No English leakage in main content
- [x] Links re-rooted to `/es/*` paths
- [x] `htmlLang` attribute updates to `es`
### Design
- [x] Page renders without layout-break in light + dark themes
- [⚠️] Headline font — see MKT-002
- [⚠️] Section heading hierarchy — see MKT-003
- [ ] Responsive at sm/md/lg (deferred to design phase across all routes)
- [ ] `/tierra-review` clean (deferred — would run after walking all routes)
- [ ] `/impeccable:audit` clean (deferred)
### A11y
- [⚠️] Heading hierarchy broken — see MKT-003
- [ ] Keyboard nav (deferred to a11y phase)
- [ ] Visible focus rings (deferred)
- [ ] Color contrast ≥ 4.5:1 in both themes (deferred)

### Defects

- **MKT-001** [P2] Top promo banner link `<a href="/en/employers">For employers · Post a job</a>` is a self-link. Banner copy "Post a job" implies action but the target is the current page. Fix: target `/en/employer/sign-up` (or hide entirely when already on `/en/employers`).
- **MKT-002** [P2] H1 ("Hire a verified crew. Skip the paperwork.") computed `font-family` is `"Inter Tight", ...` — Tierra brand calls for Fraunces upright at headlines. Either add Fraunces to the H1 utility class or update brand spec. Affects all marketing H1s — flag for sweep across `/`, `/workers`, `/employers`, `/how-it-works`, `/pricing`, `/faq`, `/impact`, `/about`.
- **MKT-003** [P2] Pricing section is missing an H2 — its lead text "Free to start. Scale when you're ready." is rendered as a `<p>` while the three preceding sections (Posting jobs / FLC verification / Worker search) all have proper H2s. Heading hierarchy is broken; screen-reader users can't navigate to the Pricing section by heading. Fix: change to `<h2>` and apply matching styles.

---

## 2. `/employer/sign-up`

**Out of scope this pass — per user direction, sign-up/sign-in not being tested.** Auth guard verified: authenticated visit to `/en/employer/sign-up` redirects to `/en/employer/dashboard`. Form code is in `apps/web/src/components/auth/EmployerSignUpForm.tsx` for later review.

---

## 3. `/employer` (root redirect)

### Smoke
- [x] `/en/employer` → `/en/employer/dashboard` (clean redirect)
- [x] `/es/employer` → `/es/employer/dashboard` (clean redirect, title localizes to "Panel")
### Functional
- [x] No flash of unauth content during redirect

### Defects
_(none — route works as intended)_

---

## 4. `/employer/onboarding`

**Out of scope this pass — per user direction, onboarding skipped.**

Quick observations from initial smoke (not deeply tested):
- Page loads for already-onboarded user (does not redirect to dashboard) — may be intentional (re-edit flow) but form does not pre-fill existing data, which would lose user data on resubmit.
- Form has `onSubmit={onSubmit}` with `e.preventDefault()` — GET-method default in HTML is intercepted, no URL-leak concern.
- Uses `Field` and `RadioCard` custom wrappers, not daisyUI `<fieldset>`. Inconsistent with project convention.
- Bilingual: source uses translation keys throughout (no hardcoded EN in JSX).

---

## 5. `/employer/dashboard`

Authed home. Eight components: greeting, KPI row, featured posting hero, hiring pipeline, active jobs, billing snapshot, verification card, top applicants.

### Smoke
- [x] Loads in EN + ES, no app console errors
### Functional
- [x] `EmployerGreeting` shows "Good afternoon, Korous." (correct name + time-of-day)
- [x] KPI row renders 4 KPIs (Open positions, Spots remaining, Applicants 7d, Avg. time to fill) — all show empty/zero state correctly
- [x] All dashboard CTA hrefs verified correct (Edit business info → /profile, Open full pipeline → /inbox, Manage all → /jobs, Add payment method → /billing, Finish setup → /profile, Post a job → /jobs/new)
- [⚠️] **Weekly report button creates empty modal** — see DASH-001
- [x] Empty states render gracefully across all 8 cards
### Bilingual
- [x] All 8 dashboard sections fully translated to ES — no English leakage
- [x] Date format localized: "sábado, 2 de mayo" (Spanish weekday/month, no comma after weekday)
- [x] Page title "AgConn — Panel" in ES, "AgConn — Dashboard" in EN
- [x] Sidebar nav labels translated (verified in shell chrome)
- [x] Verification banner copy translated ("Verificación pendiente / Estamos revisando…")
### Design
- [x] Light + dark themes both render; no hardcoded `bg-white`/`text-black` (only intentional `bg-white/15` glass effect on translucent button over dark BillingSnapshot card)
- [⚠️] **Heading hierarchy broken** — see DASH-002
- [⚠️] **Display font is Inter, not Fraunces** — see DASH-003
- [ ] Responsive (deferred to design phase)
### A11y
- [⚠️] No section-level headings (DASH-002) — screen-reader navigation broken
- [⚠️] VerificationBanner missing `role="alert"`/`role="status"` (SHELL-003)

### Defects

- **DASH-001** [P2] Dashboard "Weekly report" button click renders an empty `<dialog class="modal"><div class="modal-box bg-base-100 max-w-md"></div></dialog>` element to the DOM but the dialog never opens visibly. The button is non-functional. `apps/web/src/components/employer/dashboard/EmployerGreeting.tsx` (likely). Either wire to a real export action or remove.
- **DASH-002** [P2] Dashboard has only one H1 ("Good afternoon, Korous.") and zero H2/H3 elements. Section titles "Hiring pipeline", "Active job postings", "Profile health", "Top new applicants", "No active subscription" are styled `<div>` elements with `font-display text-2xl font-light` — visually a heading, semantically a div. Screen-reader users cannot navigate by heading. Convert each card's title to an `<h2>` (or `<h3>` under appropriate parent).
- **DASH-003** [P3] H1 + section pseudo-headings have computed `font-family: Inter`. Tierra brand spec calls for Fraunces upright at headlines. Either remap the `font-display` token in `apps/web/src/app/globals.css @theme` to Fraunces or update brand spec.

---

## 6. `/employer/jobs`

Job list.

### Smoke
- [x] Loads, no console errors. 1 draft job present ("Almond harvest crew lead").
### Functional
- [x] List renders the 1 draft job
- [⚠️] Status filter buttons (Open/Urgent/Filled/Drafts/Closed) — see JOBS-001
- [⚠️] Sort + crop filter — see JOBS-002
- [⚠️] "Browse templates" — see JOBS-003
- [x] "New posting" CTA → `/en/employer/jobs/new` (correct)
- [x] Job card "Edit" → `/en/employer/jobs/[id]` (correct)
- [x] Job card "Review 0 →" → `/en/employer/jobs/[id]/applicants` (correct)
- [⚠️] Job card title not clickable — see JOBS-004
- [ ] Status badges + state labels — only `Draft` visible (no published/closed/archived states to verify)
### Bilingual
- [x] Fully translated. H1 "Publicaciones de empleo", filter chips ("Todas/Abiertas/Urgentes/Completas/Borradores/Cerradas"), sort, all CTAs translated. Page title "AgConn — Publicaciones".
### Design
- [⚠️] Heading hierarchy skips H2 (H1 → H3) — see JOBS-005
- [ ] Tierra light/dark + responsive (deferred)
### A11y
- [⚠️] Filter buttons missing `aria-pressed`/`aria-expanded` (related to JOBS-001/002)
- [x] "More actions" icon-only button has correct `aria-label="More actions"`

### Defects

- **JOBS-001** [P2] Status filter buttons (All postings / Open / Urgent / Filled / Drafts / Closed) appear interactive but clicking them does not filter the list. Counts render correctly but filters are non-functional. After clicking "Open 0" the draft job still shows. No `aria-pressed` state either.
- **JOBS-002** [P2] "Sort: Most urgent" button and "All crops" button are non-functional — clicking neither opens a dropdown nor a menu nor changes any state. No `aria-expanded` attribute.
- **JOBS-003** [P2] "Browse templates" button creates an empty `<dialog class="modal"><div class="modal-box bg-base-100 max-w-md"></div></dialog>` — same pattern as DASH-001. Non-functional stub.
- **JOBS-004** [P3] Job card title ("Almond harvest crew lead") is not a link. Only "Edit" and "Review N →" are clickable. Either make the title or whole card clickable to the job detail page, or accept that the only way into the job is via the Edit/Review actions.
- **JOBS-005** [P3] Heading hierarchy skips a level: H1 ("Job postings") followed directly by H3 ("Almond harvest crew lead") with no intervening H2. Either promote job titles to H2 or wrap the list in an H2 like "Active postings".

---

## 7. `/employer/jobs/new`

Create a job posting.

### Smoke
- [x] Loads, no console errors
### Functional
- [x] H1 "New posting", proper H2 sections (Title/Description/Location/Pay & dates/Skills) — heading hierarchy correct here, unlike `/jobs`
- [x] Bilingual title + description tabs present (EN/ES per field)
- [x] Save draft on empty form blocks via HTML5 native validation (`wageMin`, `wageMax`, `startDate` errors fire)
- [⚠️] Title and Description fields aren't HTML-validated — see JOBS-NEW-001
- [⚠️] Publish button enabled despite verification pending — see JOBS-NEW-002
- [x] "Back to jobs" → `/en/employer/jobs` (correct)
- [ ] Live publish + draft save not exercised (would mutate data; safe to test once defects fixed)
### Bilingual
- [x] Fully translated. H1 "Nueva publicación", H2s "Título/Descripción/Ubicación/Pago y fechas/Habilidades", buttons "Guardar borrador/Publicar"
### Design
- [x] Heading hierarchy clean (H1 → H2)
- [ ] Tierra light/dark + responsive (deferred)
### A11y
- [⚠️] Most form inputs lack programmatic label association — see JOBS-NEW-003

### Defects

- **JOBS-NEW-001** [P2] Title and Description fields have no `name` attribute on their text inputs / textareas — they're React-state managed for the bilingual EN/ES split. Result: HTML5 native required validation cannot run on them. Save draft on empty form fired errors only on `wageMin`, `wageMax`, `startDate`; if React doesn't add equivalent required-field checks for Title/Description, an employer could attempt to save a draft with no title or description.
- **JOBS-NEW-002** [P1] Publish button not disabled while account verification is pending. The verification banner explicitly says "You can prepare job drafts but can't publish them yet" — but the Publish button is `disabled: false` and clickable. Either disable the button (with a tooltip explaining why) or hide it entirely while `canPublish=false`. Currently a user could attempt to publish and only fail server-side. Related to SHELL-004.
- **JOBS-NEW-003** [P2] Form input label association: of 12 inputs only 2 (`wageMin`, `wageMax`) have programmatic labels (`labels.length > 0`). The remaining 10 — including `county` (a required select), `city`, `startDate`, `endDate`, `positionsTotal` and the Title/Description text fields — have visible text labels but no `<label htmlFor>` or `aria-labelledby` linkage. Screen readers won't announce them as "Title", "Description", "County" etc.

---

## 8. `/employer/jobs/[id]`

Job detail / edit form (single-purpose page — no separate read-only detail view).

### Smoke
- [x] Loads with seeded job. Form pre-fills with title + description + skills.
- [⚠️] Invalid id — see JOBS-DETAIL-003
### Functional
- [x] H1 "Edit posting", 5 proper H2s
- [x] "Translate from English" helper buttons present on ES tabs
- [x] Skills tags removable (proper `aria-label="Remove <skill>"`)
- [x] "Back to jobs" → `/en/employer/jobs`
- [⚠️] Publish enabled despite verification pending (same as JOBS-NEW-002)
- [ ] Live save / publish not exercised
- [ ] No delete / archive button visible — likely deferred
### Bilingual
- [x] H2s, body labels, buttons translate ("Volver a publicaciones", "Traducir del inglés", "Guardar borrador", "Publicar")
- [⚠️] H1 untranslated on ES route — see JOBS-DETAIL-002
- [⚠️] Page title untranslated — see JOBS-DETAIL-001
### Design
- [x] Heading hierarchy clean
### A11y
- [x] Skills "remove" buttons have proper aria-labels

### Defects

- **JOBS-DETAIL-001** [P2] Page title is just `"AgConn"` on this route (vs. `AgConn — Job postings` and `AgConn — New posting` on sibling routes). Missing `generateMetadata` in `apps/web/src/app/[locale]/employer/jobs/[id]/page.tsx`. Should be at minimum `"AgConn — Edit posting"`, ideally include the job title.
- **JOBS-DETAIL-002** [P1] ES locale shows H1 "**Edit posting**" in English. Sibling H2s, buttons, and "Back to jobs" link translate correctly to ES; only the H1 falls through. Likely a missing translation key.
- **JOBS-DETAIL-003** [P1] Invalid job ID (`/en/employer/jobs/this-id-does-not-exist-12345`) does **not** render a 404 page. Returns a near-empty body with only Next.js bootstrap script data, no "not found" UI, no redirect, no error message. Should call `notFound()` from `next/navigation` for missing jobs.

---

## 9. `/employer/jobs/[id]/applicants`

Pipeline view for a specific job's applicants.

### Smoke
- [x] Loads, no console errors
### Functional
- [x] H1 = job title ("Almond harvest crew lead" / "Líder de cuadrilla de cosecha de almendras")
- [x] Subtitle "Fresno · $18.5–$22/hr · 0/5" — county, pay range, fill ratio
- [x] 3 pipeline columns (Applied / Reviewed / Hired)
- [⚠️] Pipeline only shows 3 stages — see APPL-001
- [x] Empty state per column: "0 —"
- [x] No applicant rows to test row-click → `/applications/[id]` (zero data)
### Bilingual
- [x] H1 swaps to bilingual job title (ES translation pre-stored)
- [x] H2s translate (Applied/Reviewed/Hired → Aplicados/Revisados/Contratados)
- [x] Page title localizes ("AgConn — Aplicados")
- [⚠️] Back link "← Jobs" — see APPL-002

### Defects

- **APPL-001** [P3] Pipeline columns: Applied / Reviewed / Hired — only 3 stages. Dashboard `HiringPipelineBoard` shows 4 stages including "Rejected". Either align (add Rejected here) or document why this view differs. Inconsistency between dashboard pipeline and per-job pipeline.
- **APPL-002** [P2] Back link text "← Jobs" stays in English on `/es/...` route. Other UI on the page translates correctly. Hardcoded English string in JSX. (Same class of bug as JOBS-DETAIL-002.)

---

## 10. `/employer/applications/[id]`

Single applicant detail.

### Smoke
- [x] Invalid id (`/en/employer/applications/test-id`) → real 404 page with "We couldn't find that page" + "Back to home". 404 handling works (unlike `/jobs/[id]`).
- [ ] Happy path not testable — zero applicant data on this account. Defer to once we have a seeded applicant.

### Defects
- _(success path untestable on this account; no defects logged from invalid-id smoke)_

---

## 11. `/employer/inbox`

Candidates inbox (cross-job pipeline).

### Smoke
- [x] Loads, no console errors
### Functional
- [x] H1 "Candidates · 0 active" with summary line "0 new · 0 reviewed · 0 in interview · 0 hired this season"
- [x] 7 status tabs as `<a href="?tab=...">` — properly routable, not just stub buttons
- [x] Empty state copy renders: "No candidates yet — share your posting…"
- [x] "Bulk message" → `/en/employer/messages?folder=broadcasts` (correct)
- [⚠️] "Filters" link goes to `/jobs` — see INBOX-001
- [⚠️] Pipeline taxonomy inconsistent across pages — see INBOX-002
- [ ] Row click / candidate cards untestable — zero data
### Bilingual
- [x] H1, all 7 tabs, "Bulk message"/"Filters", page title all localize correctly
### Design
- [x] Better than `/jobs`: status tabs use real routing not stub buttons

### Defects

- **INBOX-001** [P2] "Filters" CTA `<a href="/en/employer/jobs">` — clicking it navigates to the jobs list, not a filter panel. The expected behavior is to open a filter sidebar/modal for narrowing the candidate list. As-is the link is misleading and effectively dead.
- **INBOX-002** [P2] Pipeline stage taxonomy is inconsistent across three pages:
  - Dashboard `HiringPipelineBoard`: **4 stages** — Applied / Reviewed / Hired / Rejected
  - Per-job applicants `/jobs/[id]/applicants`: **3 stages** — Applied / Reviewed / Hired
  - Inbox `/inbox`: **7 stages** — All / New / Reviewed / Interview / Offer / Hired / Archived

  Pick one canonical set and apply it everywhere. Likely the inbox version (richer) is the intended schema; the others should expand.

---

## 12. `/employer/workers`

Worker directory.

### Smoke
- [x] Loads, no console errors
### Functional
- [x] Page is **paywalled** for Free plan — renders "Worker search is a Pro feature" with single "Upgrade to Pro" CTA
- [ ] Directory search/filter/invite untestable — would require Pro plan upgrade
### Bilingual
- [x] Translates correctly: "La búsqueda de trabajadores es una función Pro" / "Mejorar a Pro" / page title "AgConn — Buscar trabajadores"
### Design
- [ ] Single-CTA paywall is functional but minimal — could include "what you get with Pro" feature list

### Defects
- _(no defects on the paywall surface; full directory tests deferred until a Pro account is available)_

---

## 13. `/employer/workers/[id]`

Worker profile.

### Smoke
- [x] Invalid id (`/workers/test-id`) → real 404 page (404 handling works, like `/applications/[id]`)
- [ ] Happy path untestable on Free plan (no worker access)

### Defects
- _(no defects from invalid-id smoke; full profile tests deferred)_

---

## 14. `/employer/crews`

Crew list + weekly schedule grid.

### Smoke
- [x] Loads, no console errors. Real data: "Crew A · Almond harvest", 1 shift on Friday May 1 (06:00–14:00, Block 7 - North).
### Functional
- [x] H1 "Crews & shifts" + summary "1 crew · 0 confirmed · all filled · 0 hours scheduled"
- [x] H2 "Crew leaders" present
- [x] Weekly schedule grid (Sun→Sat) renders with shift block on correct day
- [x] "New shift" → `/en/employer/crews/new-shift` (correct link)
- [⚠️] "New crew" button — see CREWS-001
- [⚠️] "Export schedule" button — see CREWS-002
- [⚠️] "— hiring —" crew leader card CTA — see CREWS-003
### Bilingual
- [x] H1 → "Cuadrillas y turnos", H2 → "Capataces", buttons "Exportar horario / Nueva cuadrilla / Nuevo turno", page title localizes

### Defects

- **CREWS-001** [P2] "New crew" button click renders an empty `<dialog class="modal"><div class="modal-box bg-base-100 max-w-md"></div></dialog>` to the DOM without opening it. Same pattern as DASH-001 (Weekly report) and JOBS-002 (Browse templates) — `NewCrewModal` component appears to be stubbed.
- **CREWS-002** [P2] "Export schedule" button — click is a no-op. No download initiated, no modal, no navigation.
- **CREWS-003** [P2] "— hiring —" placeholder card on Crew leaders panel is a clickable button with no handler. Either link to `/jobs/new` (post a foreman job) or remove the button affordance.

---

## 15. `/employer/crews/new-shift`

### Smoke
- [x] Loads, no console errors
### Functional
- [x] H1 "New shift", form has 6 inputs (crewId select, shiftDate, startTime, endTime, locationLabel, notes)
- [x] Required fields marked: shiftDate, startTime, locationLabel
- [⚠️] crewId not marked required — see SHIFT-001
- [x] Cancel + "Back to crews" both → `/en/employer/crews`
- [x] Submit button "Create shift" exists; not exercised (would mutate)
- [ ] Date/time cross-field validation (start < end, not in past) untested
### Bilingual
- [x] H1 → "Nuevo turno", buttons "Volver a cuadrillas / Cancelar / Crear turno", page title localizes
### A11y
- [⚠️] 6 of 7 form inputs lack programmatic label association (same pattern as JOBS-NEW-003)

### Defects

- **SHIFT-001** [P2] `crewId` select is not marked `required`. A user could submit a shift without selecting a crew, creating an orphan shift or 400-erroring server-side after a button click. Add `required` and a default empty option.
- **SHIFT-002** [P2] Form inputs use the same broken label pattern as `JobForm` — 6 of 7 inputs (`crewId`, `shiftDate`, `startTime`, `endTime`, `locationLabel`, `notes`) have no programmatic label association.

---

## 16. `/employer/payroll`

### Smoke
- [x] Loads, no console errors
### Functional
- [x] H1 "Payroll · runs Friday" / "Nómina · corre el viernes"
- [x] Pay period header "Apr 27 – May 3" with summary "0 workers · 0 hours · 0 piece-rate bonuses approved"
- [x] KPI strip: Net payout, Gross, Bonuses, Taxes, Hours, Season-to-date — all $0.00 (empty state)
- [x] H-2A compliance section renders: "AEWR + transport reimbursed automatically", "Adverse Effect Wage $19.97/hr applied"
- [x] Worker timesheets table headers (Worker / Role / Hours / OT / Gross / Bonus / Net pay / Actions)
- [⚠️] 3 action buttons stubbed — see PAYROLL-001
- [ ] "Approve & run payroll" not exercised (high-risk action)
- [ ] "view all →" link target untested (href blocked in JS output)
### Bilingual
- [x] Fully translated. Page title localizes to "AgConn — Nómina".

### Defects

- **PAYROLL-001** [P2] Three of the four primary payroll action buttons are non-functional stubs (empty `<dialog>` pattern). Affected: "Export 941 / DE-9", "Generate from shifts", "New period". Same anti-pattern as DASH-001/JOBS-002/CREWS-001. "Approve & run payroll" was not tested (mutates real money).
- **PAYROLL-002** [P2] Section titles ("Pay period · Apr 27 – May 3", "H-2A Compliance", "Worker timesheets · ready to approve") are styled `<div>`s, not real headings. No H2 or H3 anywhere on the page. Screen-reader navigation by heading is broken. Same class as DASH-002.

---

## 17. `/employer/compliance`

### Smoke
- [x] Loads
- [⚠️] **Console error on this route surfaced SHELL-005** (missing `shell.consent.back` key)
### Functional
- [x] H1 "59% compliant" / "59% en cumplimiento" — translates
- [x] 9 compliance items render across 4 categories (Worker documentation 67% / Pesticide records 50% / Worker safety 50% / Wage & hour 67%)
- [x] Per-item summary copy is detailed and authentic ("Required by Cal/OSHA §3395 — upload your written plan", etc.)
- [x] 11 icon-only buttons all have `aria-label="Edit item"` — a11y correct
- [⚠️] All 9 "Schedule" CTAs and "New item" non-functional — see COMPLIANCE-001
- [ ] "Audit binder PDF" link target untested (href encoded)
### Bilingual
- [x] H1, page title localize. Item-level copy translation not deeply verified — defer.
### Design
- [⚠️] No H2/H3 — same hierarchy issue as dashboard/payroll (DASH-002 class)

### Defects

- **COMPLIANCE-001** [P2] All 9 "Schedule" CTAs (one per pending compliance item) and the page-level "New item" button are non-functional stubs — clicking renders an empty `<dialog>`. With 9 instances, this is the route most affected by the global empty-modal anti-pattern. Without these, employers cannot mark any compliance item as scheduled or upload documents.
- **COMPLIANCE-002** [P2] Section titles ("Worker documentation", "Pesticide records", "Worker safety (Cal/OSHA)", "Wage & hour") are styled `<div>`s, not real headings. Same DASH-002 class.

---

## 18. `/employer/compliance/audit`

Compliance audit binder (printable).

### Smoke
- [x] Loads, no console errors
### Functional
- [x] H1 "Compliance audit binder" + 6 well-structured H2 sections (§1–§6)
- [x] Header metadata: Employer "Korous Family Farms LLC", Generated date, Overall score 59%, Open actions 9
- [x] Each compliance item shown with status badge, item name, details, due date
- [x] §6 Acknowledgement section with signature lines for employer + inspector
- [x] Document ID format `CCDDCFCD-20260502-984D` and footer timestamp
- [x] "Print / Save as PDF" button present (not clicked — would open native print dialog)
- [x] "← Back to compliance" link
### Bilingual
- [x] H1 → "Carpeta de auditoría", page title localizes
- [ ] Section bodies (status labels, item details) translation not deeply verified — defer
### Design
- [x] **Best heading hierarchy seen so far** — H1 + 6 H2s with section numbering

### Defects
- _(none — best-built page in this audit so far)_

Note: business name appears as "Korous Family Farms LLC" here (legal name) vs "Korous Farms" on the dashboard (DBA). That's correct for a legal document — flagging only as a confirmation, not a defect.

---

## 19. `/employer/messages`

### Smoke
- [x] Loads, no console errors
### Functional
- [x] H1 "Messages · 0 unread" + tagline "SMS, WhatsApp & in-app · automatic translation EN ⇄ ES"
- [x] 5 folder tabs as real query-param links: All conversations / Candidates / Active crew / Foremen / Broadcasts
- [x] "Search messages…" input (functionality untested with no data)
- [x] Empty state: "Folder empty." / "No thread selected." renders
- [⚠️] "New thread" + "New broadcast" buttons stubbed — see MSG-001
### Bilingual
- [x] H1 → "Mensajes · 0 sin leer", folder tabs all translate
### Design
- [x] **No banned `max-w-7xl/6xl/5xl` classes** — page complies with new container convention

### Defects

- **MSG-001** [P2] Both primary CTAs ("New thread", "New broadcast") render an empty `<dialog>` modal on click. Same anti-pattern. Without these, employers cannot start a new conversation or send a broadcast — the entire outbound side of `/messages` is non-functional.

---

## 20. `/employer/reports`

### Smoke
- [x] Loads, no console errors
### Functional
- [x] H1 "Hiring reports" / "Reportes de contratación" + tagline "Operational pulse · season vs. last year · DOL/EDD-ready exports"
- [x] 4 KPIs: Hires this season, Avg time-to-fill, Cost per hire, Retention 30d
- [x] Chart "Applicant flow vs. spots filled · weekly · May–August 2026"
- [x] "By job type · season" + "Top performers · this season" sections
- [⚠️] Two action buttons untested ("This season" date range, "Export CSV") — likely stubs given pattern
### Bilingual
- [x] H1 + page title localize
### Design
- [x] No banned `max-w-7xl/6xl/5xl`

### Defects

- **REPORTS-001** [P3] "This season" range selector and "Export CSV" buttons not deeply tested but follow the global stub-button pattern; high suspicion they're non-functional. Verify in a follow-up.

---

## 21. `/employer/billing`

### Smoke
- [x] Loads, no console errors
### Functional
- [x] H1 "Billing & plan" / "Facturación y plan"
- [x] Current plan card shows "Free" with "Active postings 2" and feature checklist
- [x] 3 plan tiers rendered (Free / Pro / Enterprise) with feature lists
- [x] Per-plan monthly/yearly toggle buttons + Upgrade CTA buttons present
- [⚠️] **No prices displayed** — see BILLING-001
- [⚠️] **Upgrade buttons + interval switch active despite "Billing not available yet"** — see BILLING-002
- [⚠️] BillingIntervalSwitch toggle is a no-op — see BILLING-003
- [ ] CheckoutButton → Stripe not exercised
- [ ] No invoice list rendered (account has no payment history)
### Bilingual
- [x] H1 + page title localize ("Facturación y plan", "AgConn — Facturación")
### Design
- [⚠️] Heading hierarchy H1 → H3 skipping H2 — same JOBS-005 class

### Defects

- **BILLING-001** [P1] **No prices displayed anywhere on the billing page.** The marketing `/employers` page advertises "$99/mo or $990/yr" for Pro and "$299/mo" for Enterprise, but the in-product `/billing` page lists feature comparisons with no price labels next to any plan. Users cannot see what they will be charged.
- **BILLING-002** [P1] Footer copy says "**Billing is not available yet — please contact support**" yet the page still renders enabled "Upgrade to Pro" and "Upgrade to Enterprise" buttons + an active monthly/yearly interval switch. Either gate the upgrade affordances behind a real `billing.available` flag (greyed out when unavailable) or remove the disclaimer.
- **BILLING-003** [P2] `BillingIntervalSwitch` (monthly/yearly buttons) is a no-op — clicking does not toggle prices (because there are no prices) and likely does not update an underlying state used by checkout.
- **BILLING-004** [P3] Current-plan card shows "—" placeholders for missing values rather than translated labels like "Free" or "$0". Reads as broken-data rather than empty-state intent.

---

## 22. `/employer/billing/success`

Post-checkout landing.

### Smoke
- [x] Direct visit loads, no console errors
### Functional
- [x] Success state renders: H1 "You're subscribed" / "Te suscribiste" + body "Welcome to Pro. Receipt sent to your email."
- [x] "Go to dashboard" CTA → `/en/employer/dashboard`
- [⚠️] Page title not localized — see B-SUCCESS-001
- [⚠️] Direct visit shows fake success — see B-SUCCESS-002
### Bilingual
- [x] H1 translates
### Design
- [x] Uses `container mx-auto` (appropriate for centered confirmation card)

### Defects

- **B-SUCCESS-001** [P3] Page title is `"AgConn"` only — missing `generateMetadata`. Sibling routes have localized suffixes (`AgConn — Billing`, `AgConn — Cuadrillas`). Should be e.g. `AgConn — Subscription confirmed` / `AgConn — Suscripción confirmada`.
- **B-SUCCESS-002** [P3] Direct visit to `/billing/success` (without a real checkout event) shows "Welcome to Pro. Receipt sent to your email." even though account is still Free. Either guard with a server-side check (`if !hasRecentCheckout, redirect to /billing`) or make the copy generic so it doesn't claim something untrue.

---

## 23. `/employer/profile`

### Smoke
- [x] Loads, no console errors
### Functional
- [x] H1 "Business profile" / "Perfil del negocio"
- [x] Form **pre-fills** with existing tenant data (legalName "Korous Family Farms LLC", dbaName "Korous Farms", ein "12-3456789", county "Fresno") — unlike onboarding
- [x] `legalName` marked `required`
- [x] Save button "Save changes" / "Guardar cambios"
- [x] Sidebar shows verification status badge + business identity summary
### Bilingual
- [x] H1, page title, all visible labels translate
### Design
- [⚠️] Only 1 H1 on page, no H2/H3 headings — section dividers ("Status", "Business identity") are styled spans
### A11y
- [⚠️] 6 of 7 form inputs lack programmatic label association (same JOBS-NEW-003 class pattern)

### Defects

- **PROFILE-001** [P2] Form input label association — legalName, dbaName, ein, county, contactEmail, contactPhone have no `<label htmlFor>` linkage. Same root cause as JOBS-NEW-003 (custom `<Field>` wrapper component renders text-as-label divs instead of associating real `<label>` elements with inputs).
- **PROFILE-002** [P3] No H2/H3 elements on the page; sidebar section headers ("Verification status", "Business identity") are styled spans. Same DASH-002 class.

---

## Triage summary

All 21 in-scope routes walked (sign-up + onboarding skipped per user direction).

Severity: **P0** blocker · **P1** high · **P2** medium · **P3** polish.

### Cross-cutting patterns (fix once, fixes many)

These are the same root cause showing up across many routes — fixing the underlying component fixes every page that uses it.

1. **Empty-modal stub buttons** [P2] — primary CTAs across the app render an empty `<dialog class="modal"><div class="modal-box bg-base-100 max-w-md"></div></dialog>` and never open. Affected: dashboard "Weekly report" (DASH-001) · jobs "Browse templates" (JOBS-002) · crews "New crew" (CREWS-001) · payroll "Generate from shifts / New period / Export 941" (PAYROLL-001) · compliance "New item" + 9× "Schedule" (COMPLIANCE-001) · messages "New thread / New broadcast" (MSG-001). Likely shared `Modal` primitive renders even when not opened, or the buttons are wired to a `setOpen(true)` that doesn't reach the dialog's `open` attribute.

2. **No section-level headings** [P2] — most authed routes have only one H1 and zero H2/H3s (sections rendered as styled `<div>`s using `font-display`). Affected: dashboard, jobs (skip H1→H3), payroll, compliance, billing, profile. Screen-reader users can't navigate by heading. (DASH-002, JOBS-005, PAYROLL-002, COMPLIANCE-002, BILLING-004, PROFILE-002).

3. **Form input label association** [P2] — custom `Field` wrapper components render visible labels as divs rather than associating real `<label htmlFor>` with inputs. Affected: JobForm, OnboardingForm, NewShiftForm, ProfileEditor. (JOBS-NEW-003, SHIFT-002, PROFILE-001).

4. **Hardcoded English in JSX bypassing `useTranslations`** [P1/P2] — single strings stay in English on `/es/...` routes. Affected: `/jobs/[id]` H1 "Edit posting" (JOBS-DETAIL-002), `/jobs/[id]/applicants` back link "← Jobs" (APPL-002), `EmployerSignUpForm` finalize fallback (out of scope per user). Pattern: literal strings in `<h1>` or `<a>` instead of `{t(...)}`.

5. **Filter/sort buttons that don't filter or sort** [P2] — chips render with counts but clicking has no effect on the list. Affected: jobs status chips + sort + crop filter (JOBS-001, JOBS-002).

6. **Stub controls in shell** [P2] — Help button (SHELL-002) and search input (SHELL-001) render but have no handlers anywhere in the app. Inbox "Filters" link routes to `/jobs` instead of opening a filter drawer (INBOX-001).

7. **Missing translation keys** [P2] — only one caught: `shell.consent.back` for both EN and ES (SHELL-005), surfaces as a console error on every page that renders the cookie consent banner.

### Per-page rollup

#### P1 (high)
- BILLING-001 — No prices anywhere on `/billing`
- BILLING-002 — Upgrade buttons enabled despite "Billing not available yet" disclaimer
- JOBS-NEW-002 — Publish button enabled while account verification pending (contradicts banner copy)
- JOBS-DETAIL-002 — `/jobs/[id]` H1 hardcoded English on ES route
- JOBS-DETAIL-003 — Invalid job ID returns 200 with empty body instead of 404 (sibling routes correctly use `notFound()`)

#### P2 (medium)
- SHELL-001 — Search input no handler
- SHELL-002 — Help button no handler
- SHELL-003 — VerificationBanner missing `role="alert"`/`role="status"`
- SHELL-005 — Missing translation key `shell.consent.back`
- MKT-001 — `/employers` top promo banner self-link
- MKT-002 — Marketing H1s use Inter Tight, not Fraunces (Tierra brand miss)
- MKT-003 — `/employers` Pricing section missing H2
- DASH-001 — Dashboard "Weekly report" empty modal
- DASH-002 — Dashboard heading hierarchy broken
- JOBS-001 — Jobs status filters don't filter
- JOBS-002 — Jobs sort + crop filter + Browse templates non-functional
- JOBS-NEW-001 — Title/Description bypass HTML5 validation (no `name` attr)
- JOBS-NEW-003 — Form inputs lack label association
- JOBS-DETAIL-001 — `/jobs/[id]` page title is just "AgConn"
- APPL-002 — `/jobs/[id]/applicants` "← Jobs" hardcoded English on ES
- INBOX-001 — Filters link goes to `/jobs` instead of filter UI
- INBOX-002 — Three different pipeline taxonomies across dashboard / inbox / per-job applicants
- CREWS-001 — "New crew" button empty modal
- CREWS-002 — "Export schedule" no-op
- CREWS-003 — "— hiring —" placeholder button no handler
- SHIFT-001 — `crewId` select not marked required
- SHIFT-002 — Form inputs lack label association
- PAYROLL-001 — 3 payroll action buttons stubbed (Export 941, Generate from shifts, New period)
- PAYROLL-002 — Payroll heading hierarchy broken
- COMPLIANCE-001 — All 9 "Schedule" CTAs + "New item" non-functional
- COMPLIANCE-002 — Compliance heading hierarchy broken
- MSG-001 — "New thread" + "New broadcast" empty modals
- BILLING-003 — Monthly/yearly switch is a no-op
- PROFILE-001 — Form inputs lack label association

#### P3 (polish)
- SHELL-004 — `canPublish=true` while verification pending (contradicts banner copy)
- DASH-003 — `font-display` resolves to Inter, brand spec calls for Fraunces
- JOBS-004 — Job card title not clickable
- JOBS-005 — Heading hierarchy skips H1→H3
- APPL-001 — Pipeline only shows 3 stages
- B-SUCCESS-001 — Page title not localized
- B-SUCCESS-002 — Direct visit shows fake success state
- BILLING-004 — Heading hierarchy + "—" placeholders
- PROFILE-002 — No H2/H3 headings
- REPORTS-001 — Range selector + Export CSV likely stubs (not deeply tested)

### Design audit (cross-cutting from rule changes during testing)

**Container/full width sweep** — applied per the new "container or full" rule:
- 17 working pages converted to `px-5 pb-16 pt-8` (full-width with canonical responsive padding) — dashboard, jobs, jobs/new, jobs/[id], jobs/[id]/applicants, applications/[id], inbox, workers, workers/[id], crews, crews/new-shift, payroll, compliance, messages, reports, billing, profile
- 1 confirmation page kept as `container mx-auto px-5 pb-16 pt-8` — billing/success
- compliance/audit untouched (uses `max-w-[7in]` for printable letter-size legal binder; intentional fixed width)
- Inner `mx-auto max-w-*` content wrappers removed from `workers/[id]`, `applications/[id]`, `billing/success`, `JobForm`, `NewShiftForm`, and the workers paywall
- Remaining `max-w-*` instances are reading-width caps on `<p>` (allowed per CLAUDE.md), chat-bubble cap on `/messages` (component-level), and the print binder. Onboarding pages skipped per user direction.

### What still needs testing (next pass)

- Sign-up + sign-in flows (skipped this pass)
- Onboarding flow (skipped this pass)
- Live save/publish on JobForm
- Live shift creation
- Real applicant flow (no test data on this account)
- Pro plan features (`/workers` directory, worker search)
- Approve & run payroll
- Stripe Checkout from `/billing`
- All 32 footer links from `/employers` (404 audit)
- A11y deep dive (keyboard nav, focus rings, screen-reader)
- Light/dark theme visual diff per route
- Responsive breakpoints (sm/md/lg) per route

## Out of scope (this pass)

- Worker app (`/worker/*`) — separate plan
- Admin app — separate plan
- API contract tests (covered by `services/api` tests)
- Load / performance testing
- Cross-browser matrix (Chromium only this pass)
