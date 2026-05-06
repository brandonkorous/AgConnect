# Worker Test Pass 01

End-to-end functional + design audit of every `/[locale]/worker/**` page and component. Walked through the worker shell as a signed-in worker, traversing every page, modal, button, link, and form. Findings grouped by page, with severity tags:

- **blocker** — feature broken, can't ship
- **high** — wrong behavior, broken visual, accessibility violation
- **medium** — design or architectural deviation that needs to be fixed
- **low** — nit, minor polish
- **arch** — architecture / convention violation (custom component, tenant separation, file size, etc.)

**Date:** 2026-05-06
**Branch:** main
**Browser:** Chrome (claude-in-chrome MCP)
**Auth:** signed in as worker

---

## Test plan / scope

Routes covered:

- `/worker/dashboard`
- `/worker/jobs` (list, filters, saved searches)
- `/worker/jobs/[slug]` (detail)
- `/worker/jobs/[slug]/apply` (apply flow)
- `/worker/applications` + `/worker/applications/[id]`
- `/worker/saved-searches`
- `/worker/shifts`
- `/worker/messages`
- `/worker/pay`
- `/worker/profile` + `/preview` + `/reupload`
- `/worker/documents`
- `/worker/training` + `/worker/training/[slug]`
- `/worker/me/training`
- `/worker/wallet` + `/worker/wallet/cert/[enrollmentId]`
- shell chrome: sidebar, top bar, mobile shell, locale toggle, sign-out
- 404 / `[...notFound]`

---

## /worker/dashboard

- **[blocker] Availability day chips render garbled characters.** [packages/db/seed-data/translations/worker.ts:432-435](packages/db/seed-data/translations/worker.ts#L432-L435) seeds `dashboard.availability.days` as a JSON-encoded **string** `"[\"M\",\"T\",\"W\",\"T\",\"F\",\"S\",\"S\"]"`, not an array. [AvailabilityCard.tsx:11](apps/web/src/components/worker/AvailabilityCard.tsx#L11) does `t.raw('days') as string[]` and indexes by `(day.date.getUTCDay() + 6) % 7`, which slices into the raw JSON string. Rendered output today is `M , " , T [ "` (literal characters at byte offsets 2, 4, 5, 6, 8, 10, 12 of the JSON string). Fix: store the array natively in the seed (drop the `JSON.stringify` wrapping, or `JSON.parse` on read) so `t.raw('days')` returns `["M","T","W","T","F","S","S"]`.
- **[blocker] Greeting eyebrow is a hardcoded string, not a computed date/location.** [packages/db/seed-data/translations/worker.ts:460-463](packages/db/seed-data/translations/worker.ts#L460-L463) seeds `dashboard.greeting.context` as `"Sunday, August 3 · Madera, CA"`. Real date is Wed May 6 2026, profile location is Madera. Compute weekday/month/day with `Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' })` server-side and concat the worker's county. Same issue at `shifts.eyebrow` (`"August 2026 · Madera, CA"`) and `shifts.calendar.month_label` — all hardcoded.
- **[high] "My applications · 5 active · last sync 2m ago" subtitle contradicts empty state.** [packages/db/seed-data/translations/worker.ts:416-419](packages/db/seed-data/translations/worker.ts#L416-L419) hardcodes the subtitle string. The panel body correctly renders "You haven't applied to any jobs yet." for an empty list ([ApplicationsPanel.tsx:43-50](apps/web/src/components/worker/ApplicationsPanel.tsx#L43-L50)) but the subtitle is rendered as plain `t('subtitle')` regardless of actual count. Compute real `active`/`last_sync` from the fetched applications, or hide the subtitle on empty state.
- **[high] KPI "ACTIVE APPLICATIONS" card sub-line says "2 awaiting reply" while the value is 0.** [WorkerKpiRow.tsx:36-39,71-76](apps/web/src/components/worker/WorkerKpiRow.tsx#L36-L39) computes `awaitingReply` from the same applications array as `activeApps`. With this account, applications array is empty → `activeApps=0` and `awaitingReply=0` should render `t('active_apps.sub')`. Screenshot shows "2 awaiting reply", which means either the API returns mock data with 2 records that don't match the `applied|reviewed` filter (likely `withdrawn`/`rejected` skipping the filter), or the i18n fallback `active_apps.sub` itself contains "2 awaiting reply". Check [packages/db/seed-data/translations/worker.ts](packages/db/seed-data/translations/worker.ts) for `kpi.active_apps.sub` — if it's hardcoded with "2", same root cause as above.
- **[high] Sidebar nav counts (Browse jobs 142, My applications 5, Messages 3) are hardcoded in component source.** [WorkerSidebar.tsx:41-50](apps/web/src/components/worker/WorkerSidebar.tsx#L41-L50) literally hardcodes `count: 142`, `count: 5`, `count: 3, accent: true` on the nav items. None of these are derived from data, so the sidebar always shows the same numbers regardless of the worker's real state. Fix: pull counts from the same fetches the dashboard already runs (jobs, applications, threads with `unread`) and pass to the sidebar via props or a server component, or fetch in the layout.
- **[high] Earnings sparkline shows fake fictional 12-week data on every account.** [WorkerGreeting.tsx:3](apps/web/src/components/worker/WorkerGreeting.tsx#L3) uses a fixed array `SPARK_POINTS = [40, 52, 38, 70, 60, 88, 72, 95, 80, 110, 96, 124]`. With "THIS WEEK EARNED — No pay yet", the rising sparkline contradicts the empty state and tells the user a story that isn't true. Either fetch real weekly totals from `fetchMyPay()` (already in flight) or hide the sparkline when there is no pay history.
- **[high] Topbar "Help" links to `/worker/messages`, not to a help surface.** [WorkerTopBar.tsx:63-69](apps/web/src/components/worker/WorkerTopBar.tsx#L63-L69) routes `Help` to `/worker/messages`. There is no `/worker/help` or `/help` route, but routing it to the inbox is misleading. Either build a help destination (`/help`, `/faq`, or a Crisp/Intercom widget) or rename the button.
- **[high] "SMS apply: ON" appears as a clickable link, not a status indicator.** [WorkerTopBar.tsx:55-61](apps/web/src/components/worker/WorkerTopBar.tsx#L55-L61) wraps the SMS-apply readout in a `<Link>` to `/worker/messages?channel=sms`. The label reads as a state badge (the colon and "ON" pattern); routing to a filtered messages view is unexpected. Use a daisyUI `badge badge-success` or pair it with an icon-only switch that takes the user to SMS settings.
- **[medium] Topbar search keyboard hint says "Ctrl K" but no listener intercepts it.** [WorkerTopBar.tsx:49-52](apps/web/src/components/worker/WorkerTopBar.tsx#L49-L52) renders the hint text from i18n; the form has only a normal `onSubmit` handler. Pressing Ctrl+K does nothing. Either wire up a global key listener that focuses the input, or drop the hint. Mirror finding from [docs/employer-test-pass-01.md](docs/employer-test-pass-01.md) on the employer search box.
- **[medium] Topbar search has no live results.** Submit routes to `/worker/jobs?q=…` (a normal filter). The pill + kbd-hint visual implies command-palette behavior; ship one or downgrade the styling.
- **[medium] "BOOST YOUR EARNINGS" eyebrow over a non-benefit body.** [TrainingNudge.tsx:29-50](apps/web/src/components/worker/TrainingNudge.tsx#L29-L50) renders the eyebrow `t('eyebrow')` (= "BOOST YOUR EARNINGS") above "No open training programs in your area right now." Per [docs/brand/02-voice.md](docs/brand/02-voice.md), marketing verbs are permitted in eyebrow labels paired with a concrete benefit line; an empty-state copy block ≠ a benefit. Either swap the eyebrow to a calmer label (`TRAINING IN YOUR AREA`) or hide the card entirely on empty.
- **[medium] Sparkline aria-label is hardcoded English, not localized.** [WorkerGreeting.tsx:22](apps/web/src/components/worker/WorkerGreeting.tsx#L22) uses `aria-label="12-week earnings sparkline"` regardless of locale.
- **[medium] Greeting "Good afternoon, Brandon." uses a single first name; sidebar shows full name "Brandon Grain1".** Greeting pulls `profile.firstName || clerkUser?.firstName || 'there'`. The full Clerk last-name `Grain1` is a synthetic-looking suffix that should not surface in user-facing UI; the dual-render here is fine but flag the seeded last name as "Grain1" for cleanup before launch.
- **[medium] AvailabilityCard footer "5 days open · 1 conflict on Aug 7 (training)" is hardcoded.** Same pattern as the greeting context. [packages/db/seed-data/translations/worker.ts:444-447](packages/db/seed-data/translations/worker.ts#L444-L447). The footer contradicts the chip rendering above (today is May 6, no training enrolled). Either compute conflicts from the worker's enrollments + their availability + a calendar window, or hide the line.
- **[arch] KPI tiles are hand-rolled, not daisyUI `stats`/`stat`.** [WorkerKpiRow.tsx:88-110](apps/web/src/components/worker/WorkerKpiRow.tsx#L88-L110) builds each tile with `bg-base-100 border-base-300 rounded-2xl border p-5` + custom flex. daisyUI ships `stats` / `stat` / `stat-title` / `stat-value` / `stat-desc` for exactly this. Mirror finding from [docs/employer-test-pass-01.md](docs/employer-test-pass-01.md).
- **[arch] Sidebar nav is hand-rolled, not daisyUI `menu`.** [WorkerSidebar.tsx:91-124](apps/web/src/components/worker/WorkerSidebar.tsx#L91-L124) builds nav items with bespoke active/hover classes. daisyUI `menu` + `menu-active` covers this and unifies with the employer shell.
- **[arch] Sidebar count badges are hand-rolled.** [WorkerSidebar.tsx:107-120](apps/web/src/components/worker/WorkerSidebar.tsx#L107-L120) uses `rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold` instead of `badge badge-sm`.
- **[arch] Topbar search input is hand-rolled.** [WorkerTopBar.tsx:39-52](apps/web/src/components/worker/WorkerTopBar.tsx#L39-L52) — a `<label>` styled with `rounded-full border ...` instead of daisyUI `input` + `input-bordered` + `kbd`. Mirror of employer finding.
- **[arch] Dashboard page does not use the canonical container.** [apps/web/src/app/[locale]/worker/dashboard/page.tsx:43](apps/web/src/app/%5Blocale%5D/worker/dashboard/page.tsx#L43) uses `px-8 pb-16 pt-8`. Per [apps/CLAUDE.md](apps/CLAUDE.md), every full-width product surface uses `container mx-auto px-5 md:px-8 lg:px-20`. Apply consistently.
- **[arch] `dashboard/page.tsx` exceeds the 200-line house rule by composition + 4 sequential `await`-promise chains.** Acceptable here, but worth a glance: each child component re-fetches `fetchProfile`, `fetchMyPay`, `fetchApplications`, etc. The dashboard makes ~7 server fetches on each render with no shared data layer. Hoist common queries to the page or a shared loader, or use React.cache so each underlying call dedupes.
- **[low] AvailabilityCard week computation uses UTC (`getUTCDate`/`getUTCDay`).** [AvailabilityCard.tsx:16-22](apps/web/src/components/worker/AvailabilityCard.tsx#L16-L22). For a worker in `America/Los_Angeles`, the "today" chip flips to tomorrow at 5pm local during DST and 4pm during standard time. Use a local-date helper or anchor on `Intl.DateTimeFormat(timezone)`.
- **[low] Day chips render the `OPEN`/`OFF` label even when the day's open state is unknown.** Card always falls back to `availability.weekdays`/`availability.weekends`. If the worker has not yet set availability, every chip says `OPEN` — implying availability when none was given.
- **[low] Greeting summary uses ICU plurals but the empty fallback isn't actionable.** "Set your availability and apply to a job to get started." has two CTAs in one sentence. Promote one (Set availability) and demote the other.
- **[low] "Set availability" CTAs in topbar AND availability card AND empty UpNextShift band all link to `/worker/profile#availability`.** Three CTAs to the same hash. Make sure that anchor actually exists on the profile page (verify in profile pass).
- **[low] No tab focus visible on most cards.** Confirm `:focus-visible` outlines on all dashboard links/buttons during a11y pass.

---

## /worker/jobs (browse)

- **[high] "Save this search" silently fails with "Couldn't save. Try again."** [BrowseJobsHeader.tsx:39-55](apps/web/src/components/jobs/BrowseJobsHeader.tsx#L39-L55) defaults `alertChannel: 'sms'`. The API gate at [services/api/src/jobs/routes.ts:220-223](services/api/src/jobs/routes.ts#L220-L223) returns `422 phone_required` when `user.phone` is null. The current account has no phone (Clerk SMS OTP path not run for this seed). The button only shows the generic "Couldn't save" copy because the action error map collapses every non-`unauthenticated` error to `t('save_search_error')`. Fix in two places: (a) prompt "Add a phone number" or "Save without alerts" UX in the button, (b) surface `phone_required` distinctly in the i18n.
- **[high] Eyebrow pluralization is broken — "1 OPEN JOBS".** [packages/db/seed-data/translations/worker.ts:1120-1123](packages/db/seed-data/translations/worker.ts#L1120-L1123) seeds `jobs.browse.eyebrow` as `"{count} open jobs · within 50 mi of {county}"` with no ICU plural form. With `count=1` we render "1 open jobs". Convert to ICU plural: `"{count, plural, =1 {1 open job} other {# open jobs}} · within 50 mi of {county}"` and the ES counterpart.
- **[high] Eyebrow says "WITHIN 50 MI" but the active filter is "Within 25 mi".** Eyebrow is hardcoded copy; the filter row controls a different parameter (`county === 'Madera'`). Eyebrow should reflect the actual radius selected, not a fictional 50-mile band. Drop the radius from the eyebrow or compute it from filter state.
- **[high] "Showing 1–8 of 1" is a hardcoded range string.** [packages/db/seed-data/translations/worker.ts:1200-1203](packages/db/seed-data/translations/worker.ts#L1200-L1203) seeds `jobs.browse.showing` as `"Showing 1–8 of <strong>{total}</strong>"` — the `1–8` is literal. With 1 result, the UI says "Showing 1–8 of 1". Compute the range from `pageStart`/`pageEnd` (or use ICU plurals like `{total, plural, =1 {Showing 1 of 1} other {Showing 1–{end} of {total}}}`).
- **[high] "Updated 4 minutes ago" is a hardcoded literal.** Same seed file, line 1220-1223. Compute relative time from a real timestamp (the API search latency) or drop the line.
- **[high] Crop-chip counts (Grapes 38, Almonds 24, Tomatoes 19, Citrus 31, Berries 12, Lettuce 18) are hardcoded.** [CropChips.tsx:8-15](apps/web/src/components/jobs/CropChips.tsx#L8-L15) literally hardcodes the counts. The chips also surface as the filter UI; clicking a chip filters by `skills` query param. Sum is 142 = the same number as the hardcoded sidebar count. Compute counts from the jobs response (group by inferred crop).
- **[high] "Within 25 mi" filter actually toggles `county=Madera`, not a radius.** [BrowseJobsFilters.tsx:28-29,49-50](apps/web/src/components/jobs/BrowseJobsFilters.tsx#L28-L29) — the radius label is misleading. Either rename the chip to "Madera County" or implement a real `lat`/`lng` + radius filter on the API.
- **[medium] "Sort: Best match" is a static label, not a control.** [BrowseJobsFilters.tsx:119-123](apps/web/src/components/jobs/BrowseJobsFilters.tsx#L119-L123). It's rendered with a `chevron-down` icon implying it's a dropdown but no `<select>` or daisyUI `dropdown` is wired. Either build a real sort menu or drop the chevron.
- **[medium] Map preview is a static SVG-style mock with `Open full map →` linking nowhere new.** Map view button at top routes to `#map`; aside opens a "full map" but I cannot find a `/worker/jobs/map` route — verify in next pass.
- **[medium] "VERIFIED" badge styling is custom (orange/amber square) instead of daisyUI badge.** Visible on `JobCard`. Confirm in JobCard component.
- **[arch] `BrowseJobsHeader` "Save this search" CTA uses raw `bg-base-content text-base-100`, not daisyUI button.** Same pattern flagged in employer pass — heavy ink-on-cream is reserved for primary CTAs.
- **[arch] Filter chips use `bg-base-content text-base-100` for the active state — same visual heaviness flagged on the employer side.** Replace with daisyUI `tab tab-bordered` or a softer active state.
- **[arch] Page wrapper does not use the canonical container.** [apps/web/src/app/[locale]/worker/jobs/page.tsx:88](apps/web/src/app/%5Blocale%5D/worker/jobs/page.tsx#L88) uses `px-4 ... lg:px-8`. Should be the canonical `container mx-auto px-5 md:px-8 lg:px-20`.
- **[arch] `enrich()` injects fake `spots` and rotating `Hiring fast` badges.** [page.tsx:59-70](apps/web/src/app/%5Blocale%5D/worker/jobs/page.tsx#L59-L70) computes `spots: 6 + ((i * 7) % 18)` and assigns `Hiring fast` to every third verified job. These are fake numbers and lies if surfaced as real spot counts. Delete the synthetic fields and source from the underlying job posting.
- **[low] Sidebar shell shows "Worker" + "Madera, CA" briefly before Clerk hydrates the real first/last name.** Acceptable, but flicker is noticeable on slow networks.

---

## /worker/jobs/[slug] (detail)

- **[blocker] Apply submission fails with "Couldn't submit. Try again."** Both the in-aside `<ApplyButton>` and the dedicated `/apply` page submit fail. [services/api/src/applications/routes.ts:21-36](services/api/src/applications/routes.ts#L21-L36) reads `c.var.tenantId` and bails with `403 no_tenant` when it's null, then queries the job by `tenantId` from the worker context. Per [memory: AgConn multi-tenancy model](C:/Users/brand/.claude/projects/g--code--wizeworks-AgConnect/memory/project_multi_tenancy_model.md), workers are platform-level and have **no** tenant. The route should resolve `tenantId` from the **job posting** (`job.tenantId`), not from the worker's auth context, then create the application against that tenant. Either: (a) query `jobPosting.findUnique({ where: { id: jobId, deletedAt: null } })` first and use `job.tenantId` as the application tenant, or (b) implement the cross-tenant read pattern from [docs/00-foundation/01-multi-tenancy/](docs/00-foundation/01-multi-tenancy/). Same root cause likely affects every worker → tenant write (saved-search alerts? messages? cert claims?). Audit all worker-issued writes against the model.
- **[high] Apply error UX is silent about the real cause.** [ApplyButton.tsx:48-50](apps/web/src/components/jobs/ApplyButton.tsx#L48-L50) maps every non-`conflict`/non-`unauthenticated` error to a single `t('error')` "Couldn't submit. Try again." A worker hitting `not_onboarded` or `no_tenant` gets the same opaque message. Branch on `code` and surface specific copy ("Finish your profile first" / "We couldn't reach the employer — please try again later").
- **[high] `/apply` page is a single-screen "By applying, the employer will see your name, skills, and contact info." with no preview.** Per [docs/10-worker/04-application-tracker/](docs/10-worker/04-application-tracker/) and the dignified-default brand voice, the worker should see what's about to be sent: name, phone, county, skills list, availability summary, even a confirm-and-submit affordance. The current screen has no skill chips, no availability echo, no confirmation, and no terms/agreement summary.
- **[high] "Or text JOB to (559) 555-0142" is a hardcoded phone number.** [job-detail page.tsx:166](apps/web/src/app/%5Blocale%5D/worker/jobs/%5Bslug%5D/page.tsx#L166) renders `t('apply_via_sms')` which presumably contains the literal number. Wire this to the per-tenant SMS-apply provisioning, or pull from configuration. SMS apply with a fake number is misleading.
- **[high] Job detail surface omits required spec fields.** [docs/10-worker/03-job-discovery/](docs/10-worker/03-job-discovery/) calls for: schedule (start time, days/week, hours/week), housing/transport details, language/skill requirements, employer rating, distance from worker, deadline. Page only shows: title, employer, county, start date, wage band, freeform description, skills (when present), housing/transport flags. Add the missing fields.
- **[high] Employer name renders "(modified)" suffix as part of the legal name.** "Korous Family Farms (modified)" is the seed value of `employerName`. Production-quality fix: scrub the seed (or the `legalName` column) before launch and prevent that suffix from leaking into headers.
- **[medium] `inferCrop()` is duplicated.** [job-detail page.tsx:185-194](apps/web/src/app/%5Blocale%5D/worker/jobs/%5Bslug%5D/page.tsx#L185-L194) and [src/lib/crop.ts](apps/web/src/lib/crop.ts) (imported elsewhere). Remove the local copy and import the shared one.
- **[medium] `t('starts_on', { date: job.startDate })` passes raw ISO `2026-08-15`.** Browse list shows the same. Format with `Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' })` server-side.
- **[medium] Detail page wage card does not align with brand "deep-stop" rule.** The wage card uses `bg-base-100` with primary-tinted serif numbers. Acceptable, but compare to the dashboard `PaycheckCard` (full `bg-primary` with ambient gradient) — the visual hierarchy differs across two pay-display surfaces. Choose one.
- **[arch] Page wrapper does not use canonical container.** Same `px-6 ... lg:px-8` issue.
- **[arch] Pill component (`@/components/worker/primitives/Pill`) appears to be a custom badge primitive.** Audit whether it should be replaced with daisyUI `badge` variants for parity with the rest of the system.
- **[low] Empty `applyBy` hides the deadline aside; with no deadline shown anywhere, workers can't tell when applications close.** Either show "Open" / "Rolling" or always render the field.
- **[low] Locale-prefixed share text reads only English in `sms:` and `wa.me/?text=` regardless of locale.** Localize the share copy.

---

## /worker/applications

- **[high] KPI tile sub-lines describe states even when count is 0.** "Awaiting first review", "Employer is considering you", "Confirm details with employer", "No further action" each render under a `0`. With no applications, these are prescriptive copy that doesn't apply. Hide the sub-lines or swap them for a softer explanation when count is 0.
- **[high] Sidebar count shows `5` but the page shows 0/0/0/0 across all stages.** Same hardcoded sidebar finding.
- **[medium] `<em className="text-primary font-light not-italic">` strips italics off the accent word.** [applications/page.tsx:88](apps/web/src/app/%5Blocale%5D/worker/applications/page.tsx#L88), and again on [saved-searches/page.tsx:26](apps/web/src/app/%5Blocale%5D/worker/saved-searches/page.tsx#L26). Per [docs/brand/03-typography.md](docs/brand/03-typography.md), italic is permitted at any size for short emphasis runs (1–4 words). The accent word should remain italic; remove `not-italic`. Also flag that semantic `<em>` is being styled as non-emphasis — keep semantics or use `<span>`.
- **[medium] "Sorted by stage urgency" sub-text but no actual sort control.** The phrase implies sortability but the table has none.
- **[medium] Filter tabs `All / Action needed / In review / Withdrawn` use heavy ink-on-cream active styling.** Same Tierra-violation flagged elsewhere; soften.
- **[arch] KPI tiles hand-rolled (mirror of dashboard).** Use daisyUI `stats`/`stat`.
- **[arch] Page wrapper uses `px-8 ... pt-8` instead of canonical container.**

---

## /worker/saved-searches

- **[high] Validation errors map every `validation_failed` code to "Add a phone number to get SMS alerts."** [SavedSearchesClient.tsx:202](apps/web/src/components/saved-searches/SavedSearchesClient.tsx#L202) — `setError(res.code === 'validation_failed' ? t('error_phone') : t('error'))`. Any other validation problem (bad county, wage out of range, anything Zod rejects on the API side) renders the same "phone" message. Branch on the API error's `message` (`phone_required` vs other).
- **[high] Error message persists after the user fixes the cause.** Save with `alertChannel='sms'` and no phone → shows "Add a phone number to get SMS alerts." Toggle to "Don't notify" → message stays. The component only clears `error` inside `submit()`. Clear it when the channel toggle changes (or on any input change).
- **[high] `'none'` channel may not match the API schema.** The button row has 4 chips: SMS / Email / Both / Don't notify. Don't notify maps to `channel='none'` which is then sent as `alertChannel: 'none'` with `alertActive: false`. Verify [packages/schemas/src/saved-search.ts](packages/schemas/src/saved-search.ts) accepts `'none'` — the existing flagged save error suggests it doesn't, since the second submit (with Don't notify) still showed the same phone error.
- **[medium] Saved-search filters surface only county + wageMin.** The browse-jobs filter set is much broader (skills, dates, housing, transport, no-experience). Saving from `/worker/jobs` correctly captures all of those, but the manual create form here drops most of them. Either align the form fields with the full filter set, or remove the manual create button and only allow saving from the Browse Jobs filter state.
- **[medium] No sidebar entry for `/worker/saved-searches`.** Sidebar items are: Dashboard, Browse jobs, My applications, My shifts, Pay, Training, Documents, Messages. Saved searches is reachable only via the "Manage" link on the Browse Jobs aside, leaving the page hidden behind a different surface. Either add a sidebar item, surface saved searches as a tab on `/worker/jobs`, or move the route under `/worker/jobs/saved`.
- **[medium] Active-state of the sidebar shows "Dashboard" highlighted on `/worker/saved-searches`.** Because there's no matching nav item, the `derived` fallback in [WorkerSidebar.tsx:64-65](apps/web/src/components/worker/WorkerSidebar.tsx#L64-L65) defaults to `'dashboard'`. Misleading.
- **[medium] Channel pill chips are hand-rolled, not daisyUI.** Use a `join` of radio inputs with `radio-button` styling, or a daisyUI `tab` group, for proper a11y (radio semantics).
- **[low] "View jobs" CTA on a saved item uses `bg-primary text-primary-content` raw.** Acceptable but should standardize to a daisyUI `btn btn-primary btn-xs rounded-full` for consistency.

---

## /worker/shifts

- **[blocker] Calendar header reads "April 2026" while the grid is May 2026.** [ShiftsCalendar.tsx:52-55](apps/web/src/components/worker/shifts/ShiftsCalendar.tsx#L52-L55) builds `monthStart = new Date(Date.UTC(year, month, 1))` (May 1 00:00 UTC) and renders the label via `monthStart.toLocaleDateString(locale, { month: 'long', year: 'numeric' })` — without `timeZone: 'UTC'`. On a server in `America/Los_Angeles`, May 1 UTC midnight = April 30 PDT 17:00, so the label resolves to "April". Fix by passing `timeZone: 'UTC'` (or by constructing `monthStart` with local Date constructor instead of `Date.UTC`). Day cells happen to render correctly because they use `setUTCDate()`, which is what makes the inconsistency so confusing.
- **[high] Eyebrow "AUGUST 2026 · MADERA, CA" is hardcoded** (already flagged from seed). Compute from the rendered month + worker county.
- **[high] MonthSummary tile "$0.0k" formatting for low values is awkward.** [shifts/page.tsx:114](apps/web/src/app/%5Blocale%5D/worker/shifts/page.tsx#L114) divides cents by `100000` to render "k" — but the formula is wrong: cents → dollars = `/100`, so `/100000` is "thousands of dollars" only when input is in cents. Even so, "$0.0k" reads worse than "$0" in an empty state. Use `Intl.NumberFormat` with currency, and only switch to "k" formatting for values ≥ $1000.
- **[high] MonthSummary projects pay at `hours * 22 cents-not-dollars`.** [shifts/page.tsx:46-49](apps/web/src/app/%5Blocale%5D/worker/shifts/page.tsx#L46-L49) — `Math.round((r.hoursWorked ?? 0) * 22 * 100)`. The 22 is a hardcoded average wage (in dollars) — should come from each shift's `wage` not a flat constant. Workers see different wages per crew/job. Replace with the per-shift wage band on the shift row.
- **[medium] Three CTAs to "Set availability" stack on this page** (top-bar button, page-header right side, and any lower CTA in `UpNextList`). Pick one canonical CTA per page.
- **[medium] "TODAY" pill is shown on Wednesday May 6** but the calendar headers MON TUE WED — the chip lives inside the WED cell. Confirm visual treatment in dark theme too.
- **[arch] Page wrapper does not use canonical container.** `px-8` instead of `container mx-auto px-5 md:px-8 lg:px-20`.
- **[arch] `<em className="not-italic">` again for the accent word in the page title.** Same italics bug as applications/saved-searches.

---

## /worker/messages

- **[blocker] Missing translation key — eyebrow renders the literal `WORKER.MESSAGES.EYEBROW_N`.** [apps/web/src/app/[locale]/worker/messages/page.tsx:57-61](apps/web/src/app/%5Blocale%5D/worker/messages/page.tsx#L57-L61) calls `t('eyebrow_n', { unread, count, defaultMessage: t('eyebrow') })`. The seed has `messages.eyebrow` but no `messages.eyebrow_n` ([packages/db/seed-data/translations/worker.ts:1372-1375](packages/db/seed-data/translations/worker.ts#L1372-L1375)). Server logs `MISSING_MESSAGE: Could not resolve 'worker.messages.eyebrow_n' in messages for locale 'en'.` Two fixes: (a) add the `eyebrow_n` key to the seed with an ICU-plural form (`{unread, plural, =0 {No unread} =1 {1 unread} other {# unread}} · {count, plural, =0 {no conversations} other {# conversations}}`), AND (b) note that `next-intl`'s `t()` does **not** support a `defaultMessage` option — that param is ignored. Drop the `defaultMessage` argument and rely on the seed key.
- **[high] Sidebar accent badge shows `3` unread (hardcoded), but the page renders 0 unread.** Same hardcoded sidebar count.
- **[high] No "compose / new message" target.** "+ New message" button visible but no obvious destination — verify behavior. (Could not click; clicked button via JS but page didn't show a modal in the screenshot.)
- **[medium] Empty state copy is conditional on `locale === 'es'` instead of an i18n key.** Inline string literal in [messages/page.tsx:76-78](apps/web/src/app/%5Blocale%5D/worker/messages/page.tsx#L76-L78). Add a translation key for parity.

---

## /worker/pay

- **[high] All KPI sub-lines hardcoded for non-empty state on a worker with zero data.** "across 4 employers", "32 weeks logged", "incl. piece-rate bonus", "Friday Aug 8" all render under `0`/`$0.00`. Compute from real data or render `—` placeholders when count is 0.
- **[high] "NEXT DEPOSIT — Friday Aug 8" eyebrow + right-pane "NEXT DEPOSIT · FRIDAY AUG 8 — Gross: $0".** Today is May 6 2026; "Aug 8" is fictional. Hide the "Next deposit" panel when `summary.nextDeposit` is null.
- **[high] Earnings trend renders 12 zero bars with $0.0k labels under each.** Should show empty state with copy ("Your earnings trend will appear after your first paystub.") instead of a 12-bar chart of zeros — ambiguity: is data missing, or is the user paid nothing?
- **[high] Wage-transparency band claims "Your average of $0.00/hr stacks up against the county's market range".** `$0.00/hr` is meaningless. Hide or replace with "We'll compare your wage to the county once your first paystub posts."
- **[medium] "12 mo / 6 mo / YTD" tabs above the chart — verify they actually toggle the data window.** Likely cosmetic right now.
- **[medium] "Manage payout method →" links to where? Verify destination is a real route, not `#`.
- **[medium] "Export paystubs (CSV)" and "Export 2026 W-2 packet" — if invoked with no data, must produce a friendly empty CSV / W-2 message, not a server error.
- **[arch] KPI tiles hand-rolled (mirror of dashboard).**
- **[low] Eyebrow "YTD · 2026" is fine but compute year from the system clock, not hardcoded.

---

## /worker/profile (and /preview, /reupload)

- **[high] Worker profile form fields render empty even though Clerk + the dashboard have the user's first name "Brandon" and last name "Grain1".** Form should pre-fill from `fetchProfile()`. Investigate: either the API isn't returning these fields, or the form's default values are not wired.
- **[high] No phone number field** on the profile form. Phone is required for SMS alerts (saved-search blocker), for Clerk OTP login, and for SMS-apply. Workers cannot self-edit their phone here. Either show the Clerk phone (read-only with "Manage in account settings" link) or wire a `PATCH /v1/profile/phone`.
- **[high] No `#availability` anchor.** Topbar, dashboard availability card, and shifts page all CTA to `/worker/profile#availability`. The profile page has an "AVAILABILITY" section but no `id="availability"` on it. Browser scrolls to top instead of the section.
- **[medium] Required-field convention on profile.** First name/Last name/Zip code labels do not say "(optional)" — implying required — yet there's no validation pin or visual indicator that they're required. Either commit to "required is default; optional is suffixed" (per project rule) or add visible required indicators.
- **[medium] No fieldset pattern.** Per [memory: Forms use daisyUI fieldset pattern](C:/Users/brand/.claude/projects/g--code--wizeworks-AgConnect/memory/feedback_fieldset_pattern.md) and [apps/CLAUDE.md](apps/CLAUDE.md), every input wraps in `<fieldset className="fieldset">`. Profile form uses simple labels.
- **[medium] Sidebar active state on `/worker/profile` falls back to "Dashboard".** Same nav-derived bug as /saved-searches. Profile is reachable via the user-menu only.
- **[medium] Footer "All changes saved" — but fields are empty. Race condition or misleading.** If autosave hasn't run yet, "All changes saved" should not appear.
- **[low] `/worker/profile/preview` empty state CTA "Complete your profile" is a soft pill button.** OK; verify it links back to `/worker/profile`.
- **[low] `/worker/profile/reupload` "I have a resume" / "I don't have one yet" buttons — clicking each must wire to a working flow (file picker / onboarding).** Could not exercise without a sample file.

---

## /worker/documents

- **[high] Eyebrow "LAST VERIFIED AUG 1, 2026" is in the future** (today is May 6 2026). Hardcoded.
- **[high] "PROFILE COMPLETENESS 25% — top 14% of workers on AgConn — 3.4× more employer responses." Synthetic stats.** Brand voice violation — motivational filler with unverifiable claims. Drop the percentile and the multiplier; keep only the concrete completeness % and a calm "complete your profile" CTA.
- **[high] "Profile photo" check is green (✓) but the profile page has no photo upload.** False positive.
- **[high] Identification "3 on file" header but each block reads MISSING.** Counter doesn't match content. Either count uploaded items, or rename the eyebrow to "3 sections".
- **[medium] "References uploaded" / "Banking on file" as line items on a documents page.** Banking belongs on the Pay page (or its own surface) and should be opt-in with explicit consent — surfacing it as a checkbox alongside ID is misleading.
- **[medium] "Stored securely and encrypted at rest" claim** — keep only if backed by infrastructure. Otherwise drop or replace with "Stored on AgConn — only employers you share with see your file.".

---

## /worker/training (and `/me/training` redirect)

- **[high] KPI tile sub-lines describe states that don't exist for an empty account.** "Forklift cert" sub-line under `IN PROGRESS 0`, "of 32 in current cert" under `HOURS COMPLETED 0`, "lifetime" under `TOTAL CERTS 0`, "+$2.50 — per hour, post-cert" under `AVG PAY BOOST`. None apply when the worker has no enrollments. Hide / replace with `—` until data exists.
- **[high] "AVG PAY BOOST +$2.50 per hour, post-cert" is a hardcoded marketing claim.** Brand voice — "concrete benefit" requires the value be derived from real placement data, not seeded.
- **[medium] "0 FREE PROGRAMS IN YOUR AREA" eyebrow + "Recommended for you" / "No programs available right now." duplicates the empty-state.** Pick one expression of "no data".
- **[arch] KPI tiles hand-rolled (mirror).**
- **[low] `/worker/me/training` is a hard redirect to `/worker/training`.** OK; consider whether the alias should exist at all (404 instead).

---

## /worker/wallet (Skills Wallet)

- **[medium] Empty state copy "Complete a training program to earn your first certificate."** Good. CTA "Browse training" present. Acceptable.
- **[medium] No active sidebar entry — falls back to "Dashboard".** Same nav-derived bug.
- **[medium] Page is sparse compared to spec — no stats, no preview of credentials sample, no QR code/share affordance.** Per [docs/10-worker/06-skills-wallet/](docs/10-worker/06-skills-wallet/), the wallet should preview certificate cards and link to the `/cert/[enrollmentId]` detail. Empty state can still surface what a future card looks like.
- **[low] Page title "Skills Wallet" doesn't follow the `Lead em.` italic accent pattern used elsewhere on worker shell.** Inconsistent voice.
- Cert detail page (`/worker/wallet/cert/[enrollmentId]`) not exercised — no enrollment exists for this worker. Verify in a follow-up pass with seeded data.

---

## /worker/[...notFound] (404 catch-all)

- **[medium] "We couldn't find that page" with a "Back to dashboard" CTA + 6 cards (Today's shifts / Browse open jobs / Your applications / Pay / Messages / Training).** Solid empty state. Good.
- **[medium] The 404 still renders the worker shell sidebar/topbar.** OK because we're inside `/worker/`. Verify the `[...notFound]` segment fires correctly for non-existent slugs under `/worker/jobs/<bad-slug>`, `/worker/training/<bad-slug>`, `/worker/applications/<bad-id>`. (Per [memory: Nested not-found.tsx needs catch-all](C:/Users/brand/.claude/projects/g--code--wizeworks-AgConnect/memory/feedback_nested_not_found_needs_catchall.md), each segment-scoped not-found.tsx needs its own catch-all to fire on unmatched URLs.)
- **[low] "OR PICK UP WHERE YOU LEFT OFF" eyebrow** — minor copy nit; the user is not "picking up" — they hit a dead URL.

---

## Shell — sidebar / topbar / locale / mobile

- **[high] User menu at the bottom of the sidebar shows "Trabajador@" as the fallback name on `/es`.** [memory: Tierra anti-references](C:/Users/brand/.claude/projects/g--code--wizeworks-AgConnect/memory/feedback_tierra_not_editorial.md) and [docs/brand/02-voice.md](docs/brand/02-voice.md) explicitly forbid `-x` / `-e` neutral Spanish (`Amig@`, `Trabajador@`). Today's audience does not use these forms. Use `Trabajador` (singular masculine generic) or "Bienvenida/o" patterns. Same fallback exists on the dashboard greeting (`'Amig@'`) at [worker/dashboard/page.tsx:36](apps/web/src/app/%5Blocale%5D/worker/dashboard/page.tsx#L36).
- **[high] All sidebar count badges (`Browse jobs 142`, `My applications 5`, `Messages 3`) are hardcoded** in `WorkerSidebar.tsx` and never derived from data. Already flagged from /worker/dashboard.
- **[medium] Sidebar is missing entries for Saved searches, Profile, Wallet, Documents subroutes.** Several worker-facing routes are reachable only via tertiary CTAs. Either add nav items or accept that they're contextually accessed and remove the "Dashboard active by default" misleading state by matching deeper paths to `'profile'` etc.
- **[medium] Topbar "+ Set availability" CTA visible on every shell page including `/worker/shifts` (which has its own copy of the same CTA right next to it).** Reduce to one per page.
- **[medium] Topbar `Help` button links to `/worker/messages`** (already flagged).
- **[medium] Topbar `SMS apply: ON` is a clickable link, not a status indicator** (already flagged).
- **[medium] Locale switch / sign-out** in the user menu — not exercised because a sign-out would terminate the audit. Mark for a follow-up pass.
- **[low] FieldModeSoftPrompt** renders inside the worker layout — verify it doesn't appear on every page after the worker has dismissed it once.
- **[low] Brand wordmark is a small text "AGCONN" in the sidebar.** Per [memory: Tierra is civic-utilitarian, not editorial](C:/Users/brand/.claude/projects/g--code--wizeworks-AgConnect/memory/feedback_tierra_not_editorial.md), it's acceptable; verify against [docs/brand/09-logo.md](docs/brand/09-logo.md) (currently pending).

---

## Cross-cutting / repeated issues

The following issues recur across many or all worker pages — fix once at the source:

1. **i18n seeds contain literal display strings instead of formula/template values.** Greeting context, shifts eyebrow, applications subtitle, KPI sub-lines, day-of-week chip array, "Showing 1–8 of {total}", "Updated 4 minutes ago", "across 4 employers", "32 weeks logged", "Friday Aug 8" are all hardcoded strings in [packages/db/seed-data/translations/worker.ts](packages/db/seed-data/translations/worker.ts). Audit every key in `worker.ts` and decide: (a) compute server-side and pass values to ICU templates, or (b) drop the line entirely on empty state.
2. **Sidebar count badges hardcoded.** [WorkerSidebar.tsx:41-50](apps/web/src/components/worker/WorkerSidebar.tsx#L41-L50) — pull from a server fetch in the layout.
3. **Empty-state KPI tiles still render confident sub-lines.** Replace with `—` placeholders when count is 0.
4. **`<em className="not-italic">` strips brand-mandated italic accent on `Lead em.` headlines.** Search-and-fix across `applications`, `saved-searches`, `messages`, `shifts`, `profile`, etc.
5. **Page wrappers use `px-8 pb-16 pt-8`/`px-6` etc. instead of canonical container.** Per [apps/CLAUDE.md](apps/CLAUDE.md), use `container mx-auto px-5 md:px-8 lg:px-20`.
6. **Hand-rolled KPI tiles, badges, search inputs, kbd hints.** Standardize on daisyUI primitives (`stats`/`stat`, `badge`, `input`/`kbd`, `menu`).
7. **Multi-tenancy violation in worker writes.** Worker `apply`, `saved-search.create`, etc. read `c.var.tenantId` from the worker's auth context (always null) and bail with `403 no_tenant`. Per [memory: AgConn multi-tenancy model](C:/Users/brand/.claude/projects/g--code--wizeworks-AgConnect/memory/project_multi_tenancy_model.md), workers are platform-level. Resolve `tenantId` from the **target** resource (job posting → tenant) for every worker→tenant write.
8. **Generic error UI everywhere — "Couldn't save", "Couldn't submit".** Map specific API error codes to specific recovery affordances.
9. **No `@` / `-x` / `-e` Spanish neutrals.** Currently in `Amig@`, `Trabajador@`. Replace.
10. **`(modified)` employer name suffix leaks through the UI.** Scrub the seed.

---

## Fix log — 2026-05-06

The following findings have been remediated in this session. Each item links the patched file(s) so reviewers can verify.

### Blockers — fixed

- **Worker apply tenant resolution + onboarding gate.** [services/api/src/applications/routes.ts:21-67](services/api/src/applications/routes.ts#L21-L67) — (a) removed `c.var.tenantId` requirement; tenantId now resolved from the job posting (consistent with marketplace RLS policy `job_postings_marketplace_read`); (b) per product call on 2026-05-06, dropped the `if (!profile?.onboardedAt)` gate entirely. Workers can apply with whatever profile data they've already shared (often just a Clerk-verified phone). On first apply we auto-create a stub `worker_profile` (firstName/lastName pulled from Clerk if available, both default to `''`); `countyAtApply` and `skillsAtApply` snapshots accept `null` / `[]` gracefully. The employer-side applicant card is the right place to surface missing fields — never the worker. Verified end-to-end as worker `Brandon Korous`: Apply on Walnut harvest crew → application created, `worker_profiles` row inserted automatically, redirected to `/worker/applications` showing **1 APPLIED** stage. Specific error copy still surfaces for `job_not_active` (`error_job_closed`) and any future `forbidden` variants in [ApplyButton.tsx](apps/web/src/components/jobs/ApplyButton.tsx).
- **Applications API rejected `status=all`.** [apps/web/src/lib/api/applications.ts](apps/web/src/lib/api/applications.ts) was sending `status=all`, but [packages/schemas/src/applications.ts:38](packages/schemas/src/applications.ts#L38) only accepts `active|hired|closed`. The API returned 422; the client swallowed the error and rendered an empty list. Web client now omits the param when status is `'all'`.
- **Availability day chips render garbled.** [packages/db/seed-data/translations/worker.ts:432-435](packages/db/seed-data/translations/worker.ts#L432-L435) reseeded as comma-separated `M,T,W,T,F,S,S` (no JSON-string mojibake). [AvailabilityCard.tsx](apps/web/src/components/worker/AvailabilityCard.tsx) parses both legacy JSON-string and new comma-separated forms.
- **Dashboard greeting "Sunday, August 3" hardcoded.** [WorkerGreeting.tsx](apps/web/src/components/worker/WorkerGreeting.tsx) now formats the date with `Intl.DateTimeFormat(locale, …)` and accepts the worker's county via prop. Confirmed live: shows "WEDNESDAY, MAY 6" today.
- **Shifts calendar header / grid mismatch (`April` over a `May` grid).** [ShiftsCalendar.tsx:52-56](apps/web/src/components/worker/shifts/ShiftsCalendar.tsx#L52-L56) — added `timeZone: 'UTC'` to `toLocaleDateString` so the label uses the same UTC anchor as the grid math.
- **Messages eyebrow missing translation key.** [packages/db/seed-data/translations/worker.ts:1372-1381](packages/db/seed-data/translations/worker.ts#L1372-L1381) — added `messages.eyebrow_n` with ICU plurals; dropped the `defaultMessage` arg from [messages/page.tsx:57-60](apps/web/src/app/%5Blocale%5D/worker/messages/page.tsx#L57-L60) (next-intl `t()` doesn't support that option).

### High — fixed

- **Hardcoded sidebar count badges (Browse jobs 142, My applications 5, Messages 3).** [WorkerSidebar.tsx:41-50](apps/web/src/components/worker/WorkerSidebar.tsx#L41-L50) — counts are now passed as props from [layout.tsx](apps/web/src/app/%5Blocale%5D/worker/layout.tsx) which fetches real values from `fetchJobs`, `fetchApplications`, and `fetchMyMessageThreads`. Mobile drawer also receives counts.
- **Earnings sparkline showed fake 12-week trend.** [WorkerGreeting.tsx](apps/web/src/components/worker/WorkerGreeting.tsx) — sparkline only renders when caller passes a non-empty `earningsTrend` array with at least one positive value; dashboard currently passes `null` so the panel hides until real data arrives.
- **KPI tile sub-lines hardcoded "+12% vs last week", "ranks top 18% in county", "32 weeks logged", "across 4 employers", "Friday Aug 8".** [WorkerKpiRow.tsx](apps/web/src/components/worker/WorkerKpiRow.tsx), [pay/page.tsx](apps/web/src/app/%5Blocale%5D/worker/pay/page.tsx), [training/page.tsx](apps/web/src/app/%5Blocale%5D/worker/training/page.tsx), [shifts/page.tsx](apps/web/src/app/%5Blocale%5D/worker/shifts/page.tsx) — values render `—` when zero, sub-lines use ICU plurals (`employers`/`weeks` args) or hide entirely. Removed the synthetic `+$2.50` AVG PAY BOOST tile.
- **Applications panel subtitle "5 active · last sync 2m ago" contradicting empty state.** [ApplicationsPanel.tsx](apps/web/src/components/worker/ApplicationsPanel.tsx) computes `activeCount` from the fetched applications and passes it as ICU `count`. Seed updated to ICU plural.
- **Saved-search save failed silently with "phone_required" generic copy + sticky on toggle.** [SavedSearchesClient.tsx](apps/web/src/components/saved-searches/SavedSearchesClient.tsx) branches on `phone_required` vs other validation; clears error on channel toggle. [packages/schemas/src/jobs.ts](packages/schemas/src/jobs.ts) accepts `'none'` channel; [services/api/src/jobs/routes.ts:220-223](services/api/src/jobs/routes.ts#L220-L223) skips the phone gate when `alertActive` is false.
- **Topbar `Help` linked to `/worker/messages`** → now `/{locale}/faq`. **`SMS apply: ON`** is now a `badge badge-success` status indicator, not a clickable link. [WorkerTopBar.tsx](apps/web/src/components/worker/WorkerTopBar.tsx).
- **Documents synthetic claims `top 14%` / `3.4× more`.** [packages/db/seed-data/translations/worker.ts:836-839](packages/db/seed-data/translations/worker.ts#L836-L839) replaced with calmer copy. False-positive "Profile photo" check (mapped to availability) replaced with a 5-task list of actually-tracked fields (identity, location, skills, experience, availability). [documents/page.tsx](apps/web/src/app/%5Blocale%5D/worker/documents/page.tsx).
- **Documents eyebrow `Last verified Aug 1, 2026`.** Seed converted to ICU `select` with `_none` token; page passes `_none` until a real verification timestamp exists.
- **Pay page wage-transparency claim "Your average of $0.00/hr stacks up against the county's market range."** [pay/page.tsx](apps/web/src/app/%5Blocale%5D/worker/pay/page.tsx) — falls back to "We'll compare your wage to the county once your first paystub posts." when `avgHourly` is zero.
- **Pay page earnings chart with 12 zero bars.** [EarningsChart.tsx](apps/web/src/components/worker/pay/EarningsChart.tsx) renders an empty state when no paystubs have nonzero values.
- **MonthSummary projected pay used flat `$22 × hours`.** [shifts/page.tsx](apps/web/src/app/%5Blocale%5D/worker/shifts/page.tsx) — the synthetic constant is dropped; the tile now renders `—` until real per-shift wage is wired through. Also uses `Intl.NumberFormat` for currency rendering instead of "$0.0k".
- **Jobs eyebrow pluralization "1 OPEN JOBS · WITHIN 50 MI OF MADERA, CA".** [packages/db/seed-data/translations/worker.ts:1120-1123](packages/db/seed-data/translations/worker.ts#L1120-L1123) — proper ICU plural; dropped the misleading "50 mi" radius copy.
- **"Showing 1–8 of 1" hardcoded range.** [packages/db/seed-data/translations/worker.ts:1200-1203](packages/db/seed-data/translations/worker.ts#L1200-L1203) — proper ICU plural that handles 0/1/N.
- **"Updated 4 minutes ago" hardcoded.** Replaced with `"Live"` / `"En vivo"` until a real freshness signal exists.
- **Crop-chip counts hardcoded `38, 24, 19, …`.** [CropChips.tsx](apps/web/src/components/jobs/CropChips.tsx) accepts a `counts` prop; [jobs/page.tsx](apps/web/src/app/%5Blocale%5D/worker/jobs/page.tsx) computes from the inferred crop on the rendered jobs.
- **`<em className="not-italic">` stripping brand italic across applications, saved-searches, shifts, messages, pay, training, documents.** All restored to italic in one pass.
- **Spanish `Amig@` / `Trabajador@` neutrals (Tierra voice violation).** Replaced with `Trabajador` (singular) in seed (`dashboard.sidebar.profile_default_name`), in the dashboard greeting fallback, and in `apps/web/messages/es.json`.
- **"BOOST YOUR EARNINGS" eyebrow over an empty body.** Replaced with `"Training in your area"` / `"Capacitación cerca de ti"` in [packages/db/seed-data/translations/worker.ts](packages/db/seed-data/translations/worker.ts).
- **`training_hub.eyebrow` "14 free programs in your area" hardcoded count.** Replaced with `"Free programs in your area"` (count comes via `eyebrow_n` ICU template when needed).
- **All worker shell pages used non-canonical containers (`px-8 …`).** Dashboard, jobs, applications, saved-searches, shifts, pay, training, messages, documents now use `container mx-auto px-5 md:px-8 lg:px-20` per [apps/CLAUDE.md](apps/CLAUDE.md).

### Still pending — recorded for follow-up

- **Cert detail (`/worker/wallet/cert/[id]`) and worker SMS thread detail** require seeded data — neither route has a verified record in the DB for the test account. Needs a small `seed-test-worker-data.ts` script that inserts an enrollment + completion + conversation for Brandon's userId.
- **Sign-out and full locale-toggle round-trip** wired correctly per static review of `UserMenu.tsx` (`signOut({ redirectUrl: ... })` and pathname/locale-segment swap), but not exercised end-to-end this session.

### 2026-05-06 fix log (continued — autonomous batch)

#### Architectural / API
- **Jobs API now returns `totalCount` and `cropCounts`** ([services/api/src/jobs/routes.ts:135-165](services/api/src/jobs/routes.ts#L135-L165)). Browse page uses these for "Showing 1–N of M" and crop chips. Schemas updated in [packages/schemas/src/jobs.ts](packages/schemas/src/jobs.ts).
- **`sort` query param wired through `JobsQuery`** with options `best | newest | wage_high | starts_soon`, replacing the cosmetic "Sort: Best match" label with a real daisyUI `dropdown`/`menu` control in [BrowseJobsFilters.tsx](apps/web/src/components/jobs/BrowseJobsFilters.tsx).
- **`/v1/me/{shifts,pay,messages}` no longer 403 for tenantless workers.** In the three-bucket model, workers are platform-level and these routes scope by `workerUserId` (no cross-tenant leak). The `if (!tenantId) return err(...)` blocks were removed; the message-send POST now derives tenantId from the conversation row.
- **Profile prefill from Clerk on first GET/PATCH `/v1/profile`** ([services/api/src/worker/profile/routes.ts:13-37](services/api/src/worker/profile/routes.ts#L13-L37)). Stub worker_profile auto-created with Clerk firstName/lastName fallback; phone surfaced read-only in the editor.

#### UI/UX
- **daisyUI conversions**: `WorkerKpiRow` → `stat`, `WorkerSidebar` → `menu` + `badge`, `WorkerTopBar` search → `input` + `kbd`. Filter-chip active state is `bg-primary text-primary-content` (Tierra calm-default) instead of inverted ink in three places.
- **Ctrl/⌘+K listener** focuses the topbar search ([WorkerTopBar.tsx:24-34](apps/web/src/components/worker/WorkerTopBar.tsx#L24-L34)).
- **Hardcoded SMS-apply number `(559) 555-0142` removed.** Centralized in [apps/web/src/lib/sms-apply.ts](apps/web/src/lib/sms-apply.ts) reading `NEXT_PUBLIC_SMS_APPLY_NUMBER` / `_KEYWORD`. When unset, the SMS-apply UI is hidden entirely (better than showing a fake number to farmworkers who would actually try texting it).
- **Sidebar entries added** for Saved searches and Wallet ([WorkerSidebar.tsx](apps/web/src/components/worker/WorkerSidebar.tsx)). Profile lives in the user-menu dropdown, not the sidebar (per user feedback). Saved-search badge count threaded through [layout.tsx](apps/web/src/app/%5Blocale%5D/worker/layout.tsx).
- **Job detail `DetailsGrid`** ([apps/web/src/app/%5Blocale%5D/worker/jobs/%5Bslug%5D/page.tsx](apps/web/src/app/%5Blocale%5D/worker/jobs/%5Bslug%5D/page.tsx)) now renders schedule (daily start/end), days per week, runs-until, positions open, pay frequency, meals provided, pickup point — from the JobPosting v2 columns the API now returns.
- **`starts_on` localized via `Intl.DateTimeFormat`** with `timeZone: 'UTC'` so the label matches the underlying date-only column. Share-copy for SMS/WhatsApp uses translation keys with placeholders, not inline EN strings.
- **Apply confirmation modal** ([ApplyButton.tsx](apps/web/src/components/jobs/ApplyButton.tsx)) shows a pre-submit summary of name, phone, county, and skills before sending.
- **Pay 12mo/6mo/YTD tabs are now functional** — `EarningsChart` is a client component with state, recomputing months by tab.
- **Saved-search form responsive fix** — alert-channel buttons and Save/Cancel rows now `flex-wrap` so they stay on-screen at narrow widths.
- **Map View / Open Full Map** — `id="map"` moved from the SMS card to the actual map card so the header anchor scrolls correctly. The "Open full map" CTA now reads "See my shifts →" since no full-map page exists yet.

#### Content / data
- **Documents page "Stored securely and encrypted at rest" claim removed** ([packages/db/seed-data/translations/worker.ts:976-978](packages/db/seed-data/translations/worker.ts#L976-L978)). Subtitle now states only what the feature actually does.
- **`(modified)` suffix scrubbed from `employer_profiles.legal_name` / `dba_name`** via [packages/db/scripts/scrub-modified-suffix.ts](packages/db/scripts/scrub-modified-suffix.ts) (1 row updated). Idempotent.
- **`fetchProfile` now exposes `phone`**, threaded into [ProfileEditor.tsx](apps/web/src/components/profile/ProfileEditor.tsx) as a read-only field with a hint that phone is verified at sign-in.
- **`inferCrop` deduped** — worker job-detail page now imports from [@/lib/crop](apps/web/src/lib/crop.ts) instead of reimplementing.
- **Wallet page** uses canonical container, formats dates with `Intl.DateTimeFormat`, and gained a `subtitle` translation.

---

## Test status summary

- 14 worker routes exercised + 404 catch-all + ES locale spot-check.
- **Blockers:** apply submission (worker-tenant model), availability day-chip rendering, dashboard greeting hardcoded date, shifts calendar timezone label, messages eyebrow missing translation key.
- **High:** ~30 across all pages — sidebar counts, KPI sub-lines, hardcoded i18n strings, save-search phone gate, Tierra italic stripping, profile prefilling, hardcoded marketing claims on training/documents.
- **Medium / Low / Arch:** ~50 collectively.
- Sign-out and full locale-toggle round-trip not exercised this pass; add to follow-up.
- Cert detail (`/worker/wallet/cert/[enrollmentId]`) and SMS-thread detail (`/worker/messages?thread=…`) require seeded data — out of scope for this pass.
