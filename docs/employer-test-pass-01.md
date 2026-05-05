# Employer Test Pass 01

End-to-end functional + design audit of every `/[locale]/employer/**` page and component. Walked through a real onboarding from a freshly-signed-in employer, then traversed every page in the shell. Findings grouped by page, with severity tags:

- **blocker** — feature broken, can't ship
- **high** — wrong behavior, broken visual, accessibility violation
- **medium** — design or architectural deviation that needs to be fixed
- **low** — nit, minor polish
- **arch** — architecture / convention violation (custom component, tenant separation, file size, etc.)

**Date:** 2026-05-04
**Branch:** main
**Browser:** Chrome (claude-in-chrome MCP)

---

## /employer/onboarding

- **[blocker] `address.mapboxId` schema rejects real Mapbox IDs.** [packages/schemas/src/address.ts:14](packages/schemas/src/address.ts#L14) caps `mapboxId` at `.max(200)`. Real Mapbox autocomplete IDs are ~600+ chars (URL-safe base64). API returns 422 with `address.mapboxId: "Too big: expected string to have <=200 characters"`. **Onboarding cannot complete with any real autocomplete-selected address.** I had to monkey-patch `fetch` to strip `mapboxId` before the body was sent in order to continue the audit. Fix: raise to `.max(2000)` (or unset) on `AddressInputSchema`, and on the parallel field in [packages/schemas/src/employer.ts:76](packages/schemas/src/employer.ts#L76) if it has the same constraint.
- **[high] Required-field convention violation.** "Business address" label renders a red `*` asterisk. Per project convention, required is the default; only optional fields get a `(optional)` suffix — never asterisks. The other fields (`Doing business as (optional)`, `Contact email (optional)`, `Contact phone (optional)`) follow the convention. The asterisk lives in the `AddressAutocomplete` component in `@agconn/ui`; remove it.
- **[medium] "Please fix the highlighted fields" with nothing highlighted.** When the API returns `address.mapboxId` as the only failing field, the alert says to fix highlighted fields but nothing is visibly marked, because `mapboxId` is not user-facing. Either map server errors back to a visible field, or render a generic "couldn't save your address" message when only hidden fields fail.
- **[medium] Stale validation alert persists after fix.** Submitting empty-form shows "Add a business address to continue." in a top alert. Once the address is selected, the alert remains until the next submit. Clear inline-error alerts as soon as the offending field becomes valid (or at minimum on next field interaction).
- **[low] Required-attribute bypass.** Form sets `noValidate` so HTML `required` on `legalName` never fires; client-side handler only checks `address`. An empty Legal name reaches the server. The server does validate, but the round-trip wastes time and the asymmetry between fields is sloppy. Either drop `noValidate` or symmetrically pre-check `legalName` and `ein` client-side before POST.
- **[low] Empty Submit returns 422 with address validation only.** Same root as above — first-pass validation should run all required-field checks together, not field-by-field.
- **[arch] Bespoke `RadioCard` and the H-2A "card-checkbox" pattern.** [apps/web/src/components/employer/OnboardingForm.tsx:324-371](apps/web/src/components/employer/OnboardingForm.tsx#L324-L371) builds a custom radio-card with a `sr-only` input + hand-rolled border/ring states. Same form has an inline custom card-shaped checkbox at lines 239-254. These visual primitives recur across the employer surface (job form Pay/Schedule, crew shift type, etc.) — promote both to `@agconn/ui` (or `components/employer/primitives/`) so we have one canonical RadioCard/CheckboxCard, not five.
- **[medium] Success card width does not match form card.** The submitted-state card (`p-10 text-center`, no width control) renders ~380px wide while the form card sits inside `max-w-xl` (~640px). Same parent container — the success card should fill the same width so the page does not appear to shrink mid-flow.
- **[low] Page wrapper does not use the canonical container.** `apps/web/src/app/[locale]/employer/onboarding/page.tsx` uses `mx-auto max-w-xl`/`max-w-2xl` directly on wrappers instead of `container mx-auto px-5 md:px-8 lg:px-20`. Per `apps/CLAUDE.md`, reading-width caps belong on a child of the container, not the wrapper. Acceptable for an auth-flow page but worth aligning.
- **[low] EIN format coercion silently truncates.** The `pattern="\d{2}-\d{7}"` allows the user to type `12-345678` (one digit short) and only fails on submit. Consider an inputmask or live-format helper, since the intended format is fixed.

---

## /employer/dashboard

- **[high] Greeting first name comes from the company contact email, not the user.** [apps/web/src/app/[locale]/employer/(shell)/dashboard/page.tsx:46-49](apps/web/src/app/%5Blocale%5D/employer/%28shell%29/dashboard/page.tsx#L46-L49) computes `firstName = profile.contactEmail?.split('@')[0] ?? profile.displayName.split(' ')[0]`. With `ops@korousfarms.test`, the dashboard greets "Good afternoon, **Ops**." — even though the signed-in user is "Brandon". The sidebar already pulls Clerk's `user.firstName` ([components/employer/EmployerSidebar.tsx:71](apps/web/src/components/employer/EmployerSidebar.tsx#L71)); use the same source server-side via `auth()` / `currentUser()` for the greeting.
- **[medium] Verification banner alignment is hardcoded.** [components/employer/VerificationBanner.tsx:19,42](apps/web/src/components/employer/VerificationBanner.tsx#L19) uses `mx-8` for horizontal margin; the page content next to it uses `px-5`. The banner's left edge is therefore visually offset from every other element below. Pull the banner into the page container so left edges align.
- **[arch] VerificationBanner is a hand-rolled alert.** Same file uses `border-warning/30 bg-warning/5 ... rounded-xl` ladder instead of daisyUI `alert alert-warning` / `alert alert-error`. Replace with daisyUI `alert` + `role="status|alert"`.
- **[arch] KPI tiles are not daisyUI `stats`.** [components/employer/dashboard/EmployerKpiRow.tsx:54-89](apps/web/src/components/employer/dashboard/EmployerKpiRow.tsx#L54-L89) builds bespoke `bg-base-100 border-base-300 rounded-2xl border p-5` cards. daisyUI ships a `stats`/`stat` component built precisely for tabular-num KPI tiles with eyebrow + value + sub line. Adopt it.
- **[arch] Sidebar nav is a hand-rolled menu.** [components/employer/EmployerSidebar.tsx:113-146](apps/web/src/components/employer/EmployerSidebar.tsx#L113-L146) builds nav items with bespoke active/hover classes. daisyUI `menu` + `menu-active` covers this and would unify with the worker shell. Same applies to the count badges (lines 130-141) — use daisyUI `badge`/`badge-sm` instead of `rounded-full px-1.5 py-0.5 font-mono`.
- **[arch] "HIRE" surface tag is a hand-rolled badge.** Sidebar header uses `rounded px-1.5 py-0.5 font-mono ...` ([EmployerSidebar.tsx:108](apps/web/src/components/employer/EmployerSidebar.tsx#L108)) — should be `badge badge-neutral badge-sm` (or similar).
- **[medium] Search "⌘K" hint is wrong.** [components/employer/EmployerSearchBox.tsx:18-29,53-55](apps/web/src/components/employer/EmployerSearchBox.tsx#L18-L29) renders the hint label `⌘K` but the keyboard listener actually triggers on `'/'`. Either change the listener to actually intercept `cmd+K` / `ctrl+K`, or change the displayed key to `/`. Right now the documented affordance does not work.
- **[medium] Search has no live results / autocomplete.** Pressing Enter routes to `/employer/jobs?q=…`. The visual treatment (rounded pill, kbd hint, span across topbar) implies a global command-palette/spotlight; behavior is "submit the form to filter the jobs list." Either ship a real palette or downgrade the visual to a normal filter input on the jobs list.
- **[arch] Search input is hand-rolled.** Same file uses a `<label>` wrapper styled with `rounded-full border ...` instead of daisyUI `input` + `input-bordered` (which now supports keyboard `kbd`). Replace.
- **[low] kbd hint is not daisyUI `kbd`.** Same file, line 53 — use `<kbd className="kbd kbd-sm">⌘K</kbd>` (daisyUI) instead of a custom `bg-base-200 ... rounded` span.
- **[low] Page does not use canonical container.** [dashboard/page.tsx:66](apps/web/src/app/%5Blocale%5D/employer/%28shell%29/dashboard/page.tsx#L66) uses `px-5 pb-16 pt-8`. Per `apps/CLAUDE.md`, full-width product surfaces should use `container mx-auto px-5 md:px-8 lg:px-20`. Apply consistently across all employer shell pages.
- **[medium] "Free plan" hero card mixes `bg-neutral` with primary gradient and adds payment CTA — but Verification banner already says drafts cannot publish.** Two competing CTAs ("Edit business info" in the verification banner, "Add payment method" in billing card) compete for attention before either has any effect. During pending verification, downplay the "Add payment method" CTA (or hide it).
- **[low] Eyebrow line shows "MONDAY, MAY 4 · FRESNO · KOROUS FARMS".** Korous Farms is the `displayName` and is also visible right above the user menu — the eyebrow repeats it. Drop `companyName` from the eyebrow once the sidebar shows it.
- **[low] Pipeline kanban columns show `—` when empty.** Empty-state for each lane is just an em-dash; should be the same "No applicants in this stage" styling we use elsewhere, or omit entirely.

---

## /employer/jobs (list)

- **[arch] File over the 200-line house rule.** [apps/web/src/app/[locale]/employer/(shell)/jobs/page.tsx](apps/web/src/app/%5Blocale%5D/employer/%28shell%29/jobs/page.tsx) is **454 lines** — more than 2× the target. The in-page `JobCard` (lines 220-356, ~140 lines) is the obvious extraction. Move it to `components/employer/jobs/JobCard.tsx`.
- **[arch] `JobCard` is hand-rolled.** Same file, lines 252-355. Bespoke `<article>` with `bg-base-100 border-base-300 rounded-2xl border p-5` instead of daisyUI `card card-bordered card-compact`. The card body, action menu, and progress bar are all hand-rolled.
- **[arch] Status pill is hand-rolled.** Lines 262-268, e.g. `rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider` + `bg-success/15 text-success`. Replace with daisyUI `badge` variants (`badge badge-success badge-soft`, etc.).
- **[arch] Filter chips are hand-rolled.** Lines 130-145 — `rounded-full border px-3 py-1.5 text-xs font-semibold` with active = `bg-base-content text-base-100`. The active-state ink-on-cream is heavy and breaks the calm-default rule. Use daisyUI `tab tab-bordered` or `btn btn-sm` variants and reserve full inversion for primary CTAs.
- **[arch] "Review N →" CTA is hand-rolled.** Lines 346-351 — should be `btn btn-sm btn-neutral`.
- **[medium] Stale templates copy.** With one draft on this account, the bottom band reads *"3 saved templates: Grape harvest crew · Almond sweep crew · Sort line. Edit dates and post."* — the names appear to be hardcoded in i18n (real templates count is 1). Either compute from real data or hide when the count ≠ what the copy claims.
- **[medium] "All postings" filter pill at zero is treated as the heavy active state.** When there are no jobs, the pill still renders inverted-ink, drawing the eye to an empty list. Soften when no postings.
- **[low] Page does not use canonical container.** Same `px-5 pb-16 pt-8` issue.

## /employer/jobs/new (and `/jobs/[id]` edit)

- **[blocker] Footer says "All required fields complete" before the form has been validated.** On a brand-new posting with every required field empty, the footer toolbar says `✓ All required fields complete · Not yet saved`. That's a flat-out lie — clicking Save then surfaces five errors. The completeness indicator must reflect actual validator state on first render, not an optimistic default. [apps/web/src/components/employer/JobForm.tsx](apps/web/src/components/employer/JobForm.tsx) — initialise the validation state in `useState` rather than waiting for the first save attempt.
- **[blocker] Field labels lie about being optional.** Spanish title, Description (English), and Description (Spanish) are all labeled `(optional)` ([components/employer/job-form/sections/Basics.tsx:57,61](apps/web/src/components/employer/job-form/sections/Basics.tsx#L57)) but the validator rejects an empty/short value with `— required` / `— too short`. Fix: pick one. If we want bilingual parity (per project rules), drop the `(optional)` tags and treat them as required. If genuinely optional, drop the min-length check.
- **[high] Validation messages live only in the summary, not next to the offending input.** `ValidationSummary` lists every error at the top of the page, but the inputs themselves get no inline error treatment (`input-error`, error-state border, helper text). When a user clicks a deep-link in the summary, they jump to the input but find no marker telling them what's wrong. Render the same error text as a `label text-error` inside each `fieldset`, in addition to keeping the summary at top.
- **[medium] Error summary is a hand-rolled alert.** [components/employer/job-form/ValidationSummary.tsx](apps/web/src/components/employer/job-form/ValidationSummary.tsx) — replace with daisyUI `alert alert-error`.
- **[arch] File over the 200-line house rule.** `JobForm.tsx` is **532 lines**. Split out the autosave hook usage and the footer toolbar to bring sections to ~150 lines each.
- **[arch] Crop chips are hand-rolled.** [Basics.tsx:77-93](apps/web/src/components/employer/job-form/sections/Basics.tsx#L77-L93) — same `rounded-full border px-3.5 py-2` pattern. Should be a single shared chip primitive.
- **[arch] Working-day pill toggles are hand-rolled.** `Schedule.tsx` Mon-Sun day picker uses ad-hoc rounded pills with active state. daisyUI `join` + `btn` (or `toggle` with day labels) covers this.
- **[arch] Wage-structure radios reuse the bespoke `RadioCard` shape.** Same concern as onboarding.
- **[arch] Benefits toggles use a custom toggle-card.** Each benefit (`Transportation provided`, `Housing offered`, `Meals or snacks provided`, `End-of-season bonus`) is a hand-rolled card containing a daisyUI `toggle`. Promote the card-with-toggle pattern to a primitive.
- **[arch] "Heat advisory auto-rule" info bar is custom.** Custom card with cog icon + bold prefix. Use daisyUI `alert alert-info` or `card`.
- **[medium] Edit-page status eyebrow misreports state.** On the freshly-created draft, the breadcrumb-eyebrow reads `POSTING #2026-0001 · LIVE FOR TODAY · NO APPLICANTS`. The job has never been published (Publish button is disabled — verification pending). The status string should read `DRAFT — NOT YET PUBLISHED`. Likely the status mapping defaults to "live" when no specific status is wired; check [components/employer/job-form/...](apps/web/src/components/employer/job-form/).
- **[low] Page doesn't use canonical container.** Same as the rest.

## /employer/jobs/[id]/applicants

- **[medium] Header shrinks vs the rest of the shell.** Title is a small unbordered h1 (`text-3xl`-ish) instead of the `font-display text-4xl font-light leading-tight tracking-tight md:text-5xl` pattern used elsewhere. No eyebrow line above it. Adopt the same greeting-style header so users don't feel like they fell out of the design system.
- **[low] "Back to jobs" arrow is a literal `←` character** rather than a FontAwesome chevron-left icon. Unicode arrows fall out of typography sync with FA icons used elsewhere.
- **[low] Empty-state is just an em-dash** in each kanban lane. Use a localized "No applicants in this stage" copy.
- **[arch] Three-column kanban is hand-rolled.** Same shape as the dashboard pipeline; extract a shared `<HiringPipelineBoard>` and let both surfaces consume it.
- **[low] Eyebrow info `Madera · $0-$0/hr · 0/1` shows `$0-$0/hr` because Pay step was never filled.** Hide the wage range until at least one bound is set, or show "Wage TBD".

---

## /employer/applications/[id]

- **[high] Inline error placement.** *(applies to every form on the employer surface, not just this page).* Field errors must render inline at the offending input — `input-error` border + `<p className="label text-error">…</p>` helper text inside the `fieldset`. Today they live only in summaries (jobs validation summary, alert at top). Without an inline marker, deep-linking from the summary lands the user on a field with no error treatment, leaving them guessing.
- **[medium] Header doesn't follow the standard greeting-style typography.** `h1` is `font-display text-3xl font-light` instead of the `text-4xl md:text-5xl` used everywhere else. Bring it in line.
- **[arch] Skill / cert chips are hand-rolled.** [apps/web/src/app/[locale]/employer/(shell)/applications/[id]/page.tsx:48-74](apps/web/src/app/%5Blocale%5D/employer/%28shell%29/applications/%5Bid%5D/page.tsx#L48-L74) — `<span className="bg-base-200 rounded-full px-3 py-1 text-xs">`. Should be daisyUI `badge`.
- **[high] String-replace hack on translation values.** Same file line 45: `t('experience').replace('Experience', 'Skills')`. This is a smell — the i18n key is wrong and someone hot-fixed it in TSX. Fix the i18n key (`skills`) and remove the replace.
- **[low] Back link uses literal `←` character** instead of `faChevronLeft`.

---

## /employer/inbox (Candidates)

- **[arch] Filter pills hand-rolled.** Same `rounded-full` pattern. Reuse a primitive.
- **[arch] "Bulk message" CTA uses `⚡` lightning-bolt icon** which is loud relative to the Tierra "calm" palette. Either use a chat-icon or swap to a softer secondary button.
- **[low] Empty state `Folder empty.` (in Messages) and `No candidates yet — share your posting...` here are written as terminal commands.** Bring them into voice (e.g., "Once your posting goes live, applicants land here.").

---

## /employer/crews (week schedule)

- **[medium] Empty week shows "No crews yet — create one to start scheduling." inside the schedule grid where rows belong.** Also "Crew leaders" section below is just a heading with no body. Either render the empty-state in a single CTA card (with "+ New crew" inside it) or hide the lower section until a crew exists.
- **[arch] Day-of-week header is hand-rolled.** Bespoke grid `[CREWS / DAY] [MON · MAY 4] ... [SUN · MAY 10]`. Could be a `table` with daisyUI styling. Day cells use dual eyebrow + bold-date treatment which is fine, but the chrome around it needs to be a primitive.
- **[low] Eyebrow `OPERATIONS · WEEK OF MAY 4 — MAY 10` is uppercase but the title says `Crews & shifts`.** Inconsistent with other pages where eyebrow names the section.

## /employer/crews/new (and /crews/[id]/edit)

- **[blocker] "Create crew" with empty form silently does nothing.** Before any name is entered, clicking the green Create-crew button produces no error and no navigation. The footer says `Ready to create.` even though the crew can't be created. After typing a name and clicking again, it succeeds. Either disable the button until the name is non-empty, or surface an inline error on click.
- **[blocker] "Ready to create." indicator lies the same way `JobForm` does.** Same root issue — completeness state is initialized to true and only re-evaluated after the user takes an action.
- **[arch] File over 200 lines.** Crew-editor section files: see component list under `components/employer/crews/edit-crew/` — confirm each section file is < 200 lines.
- **[arch] Schedule color picker is hand-rolled.** 6 fixed swatches as buttons with selected-ring. Promote to a `ColorSwatchPicker` primitive or use radio inputs styled with `radio` and color rings.
- **[arch] "Hire a foreman" empty card** with dashed border + `+` icon — bespoke. Reuse the same empty-state primitive used in jobs templates band.
- **[arch] Required-skills cards** are the same custom card-with-checkbox pattern (CheckboxCard) repeated from onboarding & job form. Promote.
- **[medium] Right-rail "Untitled crew" preview** uses `bg-primary` band — heavy alongside the bespoke gold/olive panels elsewhere. Consider de-emphasizing.

## /employer/crews/new-shift (and /crews/shifts/[id]/edit)

- **[arch] Shift-type radio cards** are the same RadioCard pattern (Work shift, Training, Day off, Holiday).
- **[arch] Crew-assignment radio cards** repeat the pattern.
- **[arch] Day-of-week pill toggles** repeat the pattern from JobForm Schedule.
- **[medium] "Ready to create" footer** at zero-state — same lying-completeness bug.
- **[low] Worker preview iPhone mockup** shows `Crew · Location` placeholders, `06:00–14:00` time, `Tools + water + lunch` bring list — implying real data. With no crew picked yet, render dashes.

---

## /employer/workers (Find workers)

- **[medium] Pro-feature gate masks the entire page.** Locked behind upgrade — fine — but with verification still pending **and** billing not available (per /billing's footer "Billing is not available yet"), this surface has no path forward at all. Either show "available after verification" copy, or let the user explore the search UI in disabled / preview mode.
- **[arch] The locked-state card** (`bg-base-100 border-base-300 rounded-2xl border` + lock icon + heading + body + button) is a hand-rolled empty/locked state. Promote.

## /employer/workers/[id]

(Not exercised — no real workers in the seed, and the search-list is gated. Source check: same hand-rolled patterns expected.)

---

## /employer/messages

- **[medium] "TEMPLATES — Use the bolt icon in the composer to drop in a template." in the sidebar with no thread open.** No composer is visible until a thread is selected. Hide the help line until the composer is on screen, or move it into the composer empty state.
- **[arch] Folder list, conversation list, and thread pane are all hand-rolled three-column layout** using `border-r` dividers. daisyUI doesn't ship a chat shell out of the box, but the folder buttons should at least be a daisyUI `menu`.
- **[low] "Folder empty." copy.** Voice-bare. Use "No conversations in this folder yet."
- **[low] "+ New thread" / "⚡ New broadcast"** — same lightning-bolt concern as Candidates.

---

## /employer/payroll

- **[medium] Taxes shows `$-0.00`** at empty state — sign artifact. Should show `$0.00`.
- **[medium] H-2A compliance band shows specific numbers (`$19.97/hr Adverse Effect Wage`, `3-fourths guarantee tracked`) at zero workers / zero hours.** With no payroll data, this implies the system is doing real H-2A math. It's not — it's a placeholder line. Hide / dim until a period has lines.
- **[arch] Net Payout dark hero card** uses bespoke `bg-neutral` + radial-gradient ambient glow. This is part of the Tierra dark-card pattern but not packaged as a reusable primitive — so it's been copied between dashboard, payroll, and billing with subtle differences. Promote a `<DarkHeroCard>` primitive.
- **[low] Header has 4 buttons crowding the right side** — Generate / New period / Export 941 / Approve. Group secondary actions under a `Tools ▾` dropdown; keep `Approve & run payroll` as the lone primary.

---

## /employer/billing

- **[medium] "Active postings: 2"** in the current-plan hero — actual count is 1 draft. Either count drafts in this number (then the badge should clarify "drafts + active = 2"), or report only `active` jobs (which is 0 here).
- **[medium] `Upgrade to Pro` / `Upgrade to Enterprise` buttons render but are disabled,** with the caveat in tiny text below — "Billing is not available yet — please contact support." Make the gating explicit: badge each upgrade card with `Coming soon` and replace the button with a `Notify me` / `Contact sales` link, or hide the buttons.
- **[arch] Plan tier cards** are bespoke. Keep the visual but factor into a single `<PlanCard>` primitive consumed by all three tiers.
- **[low] Free card shows the word "Free" twice** (header subtitle + the visual price block).

## /employer/billing/success

(Not exercised — never reached the upgrade flow because billing is gated.)

---

## /employer/compliance

- **[blocker] `/v1/employer/compliance/items` returns 500 because of a Prisma migration drift.** Server log:
  ```
  PrismaClientKnownRequestError: The column `compliance_items.evidence_storage_key` does not exist in the current database.
  → services/api/src/employer/compliance/routes.ts:40
  ```
  The Prisma model has the column; the database migration that adds it has not been applied. Fix: run `prisma migrate deploy` (or the equivalent Supabase migration) so `compliance_items` matches the Prisma model. The page renders an empty/default state because the front-end swallows the 500 — find that swallow path and surface an error toast so this kind of regression doesn't ship silently.
- **[high] "59% compliant" + "All clear — no actions due" + "You're all caught up" are mutually contradictory.** A score of 59% means there are unmet items. The empty-action state should only show when score is 100% (or the score should reflect "what's left to do"). Reconcile copy + score so they agree.
- **[medium] Donut score visual is hand-rolled SVG.** Fine for now, but factor into a primitive used by compliance + reports.

## /employer/compliance/audit

- **[low] No issues with the rendered binder itself** — it follows the formal AgConnect letterhead style and matches the project's print-document convention.
- **[medium] Score (59%) and status legend ("Compliant · Action required · Not in compliance") shown in the binder while the API that computes the score is currently 500-ing.** Means the binder rendered with stale or default data. Block render or show "Score unavailable" if the items API failed.

---

## /employer/reports

- **[medium] Chart shows `June 2026` and `Jun 1` X-axis label even though the current date is May 4, 2026.** Default range bug — should show the current week / current month.
- **[medium] KPI tiles mix `0` and `—` empty markers.** Hires this season = `0`, the rest = `—`. Pick one and apply consistently for "no data yet".
- **[medium] Empty chart has no Y-axis labels** — looks broken at a glance. Render axes with the units they'll eventually have, or replace with a "no data yet" empty state.
- **[low] "across 1 job type"** with `0` hires implies coverage; with no real data, hide the explanatory line.

---

## /employer/profile

- **[medium] Inconsistent required-field treatment with onboarding.** Onboarding labels Business address with `*`; this page does not. Both should drop the asterisk per the project convention. ([apps/web/src/components/employer/ProfileEditor.tsx](apps/web/src/components/employer/ProfileEditor.tsx)).
- **[low] Right-rail "Business identity" panel duplicates the form inputs.** It's fine as a snapshot for context, but the columns are wider than they need to be and the eyebrow `BUSINESS IDENTITY` repeats the page title. Tighten or drop.

---

## /employer/account

- **[high] Page embeds raw Clerk `<UserProfile>` UI** instead of a custom Tierra-themed profile. The default Clerk widget is purple-avatar, "Development mode" badge, "Secured by Clerk" footer — entirely off-brand. Per project direction this surface needs to be a custom Tierra profile that uses the Clerk SDK underneath. Replace with a custom layout that consumes Clerk's `useUser()` / `<SignIn>`-style hooks but renders all chrome with our daisyUI primitives. Hide the "Development mode" footer chip in any environment that isn't local-dev.

---

## /employer/help

- **[low] Topic cards** have hover-target affordance but unclear destination — there's no apparent article behind each. Either link to a real help article or treat them as info cards (drop the cursor-pointer style).
- **[low] Top-right "Help" button** in the topbar lands here; the user-menu also has "Help & support". Two paths is fine — but the topbar button should be a daisyUI `btn btn-sm btn-ghost`, not the hand-rolled rounded chip.

---

## Cross-cutting

### Architecture / convention violations

- **[arch] Custom-component repetition.** A small set of bespoke patterns are reinvented across many files: `RadioCard`, `CheckboxCard`, status `badge`-shaped pill, filter pill, count pill, KPI tile, dark-hero card, three-column kanban, empty-state card with dashed border, locked/upsell card. Promote each to a single primitive in `components/employer/primitives/` (or `@agconn/ui`) and replace the inlined copies. Today, the visual drift across copies is real — for example, three different "rounded-full px-2 py-0.5" badges with three different font sizes.
- **[arch] daisyUI primitives that *should* be used but aren't:** `card`, `card-bordered`, `badge` (with all soft/outline variants), `alert` (warning/error/info/success/soft), `stats` + `stat`, `menu` + `menu-active`, `tab tab-bordered`, `kbd`, `input` + `input-bordered`, `join` (for day-of-week pickers). Adopt these as part of the cleanup pass.
- **[arch] Canonical container.** Every employer-shell page uses `px-5 pb-16 pt-8` or similar instead of the canonical `container mx-auto px-5 md:px-8 lg:px-20`. Apply consistently — sidebar already establishes a fixed-width column, but the main pane content should respect the `lg:px-20` outer breathing room.
- **[arch] 200-line house rule violations.**
  - `apps/web/src/components/employer/JobForm.tsx` — **532**
  - `apps/web/src/app/[locale]/employer/(shell)/jobs/page.tsx` — **454**
  - `apps/web/src/components/employer/OnboardingForm.tsx` — **379**
  - Crew/shift section files — verify each.
  - These should be split before more features land here.
- **[arch] Footer "completeness" indicator across all multi-step forms** (`OnboardingForm`, `JobForm`, `CrewEditorPage`, `NewShiftPage`) optimistically initializes to "All required fields complete / Ready to create" and only flips false after the user clicks Save. Move all to compute-from-state on every render.
- **[arch] Inline field errors are absent everywhere.** The summary-only model is the same in JobForm, OnboardingForm, CrewEditorPage. Add an inline `<p className="label text-error">` rendered inside each `fieldset` when an error exists for that field.
- **[arch] Required-field convention is broken in three places** (Onboarding business address `*`, JobForm Spanish title labeled `(optional)` but required, JobForm descriptions labeled `(optional)` but min-length required). Apply the rule once: required is the default and unmarked; only optional fields take the `(optional)` suffix.

### Tenant separation

- **[medium] Workers detail filters by `tenantId`.** [services/api/src/employer/workers/routes.ts:140](services/api/src/employer/workers/routes.ts#L140) — `where: { id, tenantId, onboardedAt: { not: null }, deletedAt: null }`. Per the project's three-bucket model, **workers are platform-level (no tenant)** and should not be filtered by `tenantId`. Either the schema has `tenantId` on `worker_profile` (a bigger architectural deviation), or this column is somewhere else and the join is implicit (in which case it's correct — but the code needs a comment). Verify the schema and either remove the predicate or document why it stays.
- **[low] `payrollLine.update` uses `where: { id: lineId }`** ([routes.ts:206](services/api/src/employer/payroll/routes.ts#L206)) without re-asserting `tenantId` / `employerId`. It's gated by a prior `findFirst` that does check tenant access, so this is safe **if** Prisma's update isn't invoked in any other code path. To be defense-in-depth, add `tenantId` to the update's where. (This pattern repeats for `payrollPeriod.update` at line 112.)
- **[low] Cross-tenant probe not exercised.** I only had one tenant available and could not directly attempt to read another tenant's IDs. Recommend a Playwright integration test that spawns Tenant A + Tenant B, signs in as A, and tries to GET each of B's resource IDs (job, crew, shift, application, payroll period, compliance item) via the API — every one must 404 / 403.

### Bilingual parity

- Did not exhaustively spot-check ES, but the i18n string `t('experience').replace('Experience', 'Skills')` in `/applications/[id]` will desync EN and ES, since the replace only covers EN.

### Console / network errors observed

- The repeating Chrome-extension exception `Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received` is **not** an app error — it's a third-party Chrome extension running in the user's browser. Ignore.
- The compliance 500 (above) **is** an app error — listed as a blocker.

