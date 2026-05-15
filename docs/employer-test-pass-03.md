# Employer Test Pass 03

Full interaction sweep of every `/[locale]/employer/**` page in **EN and ES**. Every button, dropdown, modal, form section, file upload, empty/loading/error state. Functionality, design, UX, UI, translation, placement, bounding.

**Date:** 2026-05-05
**Branch:** main
**Browser:** Chrome (claude-in-chrome MCP)
**Strategy:** log-and-continue. No inline fixes during this pass. Findings only.

**Order (driven by data dependencies):**
1. Top-bar / sidebar / shell
2. Dashboard
3. Profile / business identity
4. Lookups (crops, roles, sites)
5. Crews (need workers — defer worker creation; sweep UI only)
6. Jobs (create, draft, publish — produces data for applications, hires, shifts, payroll)
7. Applications
8. Hires
9. Shifts
10. Payroll
11. Billing
12. Compliance
13. Messages
14. Weather
15. Workers
16. Contacts
17. Reports
18. Onboarding
19. Help, settings, account, locale switch
20. ES parity sweep across the same routes

---

## Findings

## 1 · Shell (top-bar / sidebar / global nav)

### What I exercised
- Topbar: AGCONN logo, `HIRE` pill, search input + `⌘K` hint, Help link, `+ Post a job` button, theme toggle.
- Sidebar: Dashboard / Job postings (badge: 1) / Candidates / Find workers (PRO badge) / Crews & shifts / Payroll / Compliance / Messages / Reports / Billing / Business profile.
- User menu (bottom-left pill): Business profile / My account / Help & support / Language ES|EN / Sign out.
- Search: typed `walnut`, pressed Enter → routed to `/employer/jobs?q=walnut` and rendered "1 match for "walnut"". ✓
- Theme toggle: light → dark → light. Visually clean transition. ✓

### Findings

- **[medium] `Ctrl+K` keyboard shortcut hint is wired into the UI but the shortcut does nothing.** The pill to the right of the search input shows `⌘K`. Pressing `Ctrl+K` from anywhere on the page does not focus the search. Either implement the global handler or remove the hint — a visible shortcut hint that doesn't work is worse than no hint.
- **[medium] Sidebar label "Candidates" routes to `/employer/inbox`.** The label promises a candidate-roster view; the URL and the page header it lands on are "Inbox / pipeline." Pick one. Recommend renaming the link to `Inbox` so it matches the destination header and the "Open full pipeline →" link from the dashboard.
- **[medium] Search input doesn't submit unless it has DOM focus.** Setting the value programmatically (or apparently typing while focus is elsewhere) and pressing Enter does nothing. Real users typing into the input are fine; users using the `⌘K` hint or anything that pre-fills the search are not. Add a global keydown handler on the document for Enter when the search has a value.
- **[low] Theme toggle is `<input type=checkbox>` with role "label \"Theme\" (checkbox)".** No discoverable `aria-label` like "Toggle dark mode." Toggle works for sighted/mouse users; verify screen-reader announcement and `:focus-visible` outline.
- **[low] Two `+ Post a job` CTAs side-by-side on the dashboard** — one in the topbar (right-most), one in the dashboard header right rail. Same destination, no functional difference. Drop the topbar one or the page-header one (probably the topbar — it should be context-free).
- **[low] User menu "Korous Family Farms (modified)"** is a leftover DBA edit from pass-02. Data artifact, not a finding — flagged so reviewers don't think the brand is broken.
- **[arch] Sidebar count badge on "Job postings" shows `1`** (the active count). Confirm this is total open postings, not unread/new. Today's value is ambiguous — is it `1 active`, `1 needing attention`, or `1 new since last visit`? Add a tooltip.

---

## 2 · Dashboard (`/employer/dashboard`)

### What I exercised
- Initial render with one active posting (Walnut harvest crew) and zero applicants.
- Featured job hero card with mini map.
- Stats row: Open positions / Spots remaining / Applicants 7 days / Avg. time to fill.
- Hiring pipeline strip: Applied / Reviewed / Hired / Rejected.
- Active job postings list.
- Right rail: Free plan / Profile health / Top new applicants.

### Findings

- **[medium] Dashboard featured / active crew hero card uses a stylized placeholder map** (small dark panel with the county name `MADERA` and `ongoing` text in the corner — no real geographic data, no marker, no basemap). The real map implementation that the Job editor's `Location & transport` section uses (Mapbox/Google with the worksite marker) should be reused here too — show the actual job-site marker on a real basemap, sized to fit the hero card. Per user note 2026-05-05: "on the dashboard, the active crew box needs the real map implementation as well."
- **[high] Date inconsistency between dashboard featured card and `/employer/jobs` list for the SAME posting.** Dashboard hero card eyebrow reads `FRI, AUG 14 · MADERA`; `/employer/jobs` row reads `STARTS Sat, Aug 15`. Two different days for the same job. Either (a) one field is "publish/show date" and the other is "actual start" — in which case the labels need to disambiguate (`STARTS AUG 15` vs `LIVE FROM AUG 14`), or (b) one of the two reads is computed in a different timezone and is genuinely off-by-one. This is a confidence-eroding bug for the primary user (the employer who created it).
- **[medium] `$0/hr` shown prominently on the dashboard hero card.** Re-confirmation of the pass-02 [high] finding (Publish accepted `wage_min = wage_max = 0`). The dashboard is the most-visited page, so this `$0/hr` is the loudest signal that the platform shipped an unusable listing. Server-side validator must reject publish without a wage.
- **[medium] `1 SPOT OPEN` chip on the active job row uses error-red styling** (`bg-error/10` border-error/30). "Open" is a positive employer state ("we have a spot ready to fill"), not an error/warning. Promote to neutral or `success`/`info` palette. Reserve red for actual errors (overdue, expired, rejected).
- **[medium] Hero card photo placeholder is a tiny grey `?` chip floating below the headline** when no photo has been uploaded. It reads as broken UI. Either hide the placeholder when no photo exists, or render a branded crop/illustration the size of the hero card.
- **[medium] `AVG. TIME TO FILL` stat has no value placeholder.** Card renders with the eyebrow, the unit hint ("from publish to last hire"), and a blank where the number should be — looks like a render failure. Show `—` (em-dash, Inter `tabular-nums`) so the empty state is intentional.
- **[low] `applicants · 0 new` on the active-job row colors `0 new` in gold (the brand accent).** Gold draws the eye and signals action — using it for `0 new` falsely suggests there's something to do. Use neutral grey for zero-states.
- **[low] Eyebrow `TUESDAY, MAY 5 · FRESNO` over the greeting** anchors the date in Fresno county, but the only active posting is in Madera. Confirm whether the eyebrow location is the employer's primary county (Korous Farms = Fresno) or the location of work. Either is defensible — needs a tooltip / hover hint to clarify.
- **[low] `Top new applicants` empty state on right rail says `No new applicants this week.`** with a `0 new` chip. Same gold-on-zero issue as above. Also: the chip + the prose say the same thing twice.
- **[low] Hiring pipeline column count chips are tiny black-on-white circles in the top-right corner of each empty card.** At small sizes the `0` is hard to read. Either grow the chip or move it inline next to the eyebrow.

---

## 3 · Profile / business identity (`/employer/profile`)

### What I exercised
- Page renders form: Legal business name, Doing business as (optional), EIN, Primary county dropdown, Programs (We hire H-2A workers checkbox), Business address (with `Change` button), Contact email/phone (optional), Save changes.
- Right rail: VERIFIED chip + Verified May 4, 2026 + summary (Legal name / DBA / Type GROWER / EIN / Primary county / Business address).
- Clicked `Change` on Business address → field swaps to typeahead `Start typing an address` + `Can't find it? Drop a pin on the map.` link.
- Typed `5500 N Palm` into typeahead → 6 Google-Places-style results returned (5500 North Palm Avenue, Fresno, CA 93704 first). ✓
- Cleared `Legal business name` (a required field) and clicked Save changes → no visible reaction, no toast, no inline error. Reloaded and confirmed the original name was retained — the form was silently blocked (likely by HTML5 `required`) but the user gets zero feedback.

### Findings

- **[high] Form silently blocks submit when a required field is empty — no inline error, no toast, no scroll-to-error.** Cleared `Legal business name`, clicked `Save changes`, nothing happened. No `:invalid` outline, no helper text turning red, no scroll. This is the third pass with the same pattern across multiple forms — adopt a single validation primitive (e.g., `<form>`-level `onInvalid` handler) that always renders an inline message *and* scrolls the offender into view *and* focuses it.
- **[medium] Save button has no loading/disabled state during the network round-trip.** Re-confirmation of pass-02 finding. Adds risk of double-submits.
- **[medium] Right-rail "Verification status" panel does not refresh after Save.** Re-confirmation of pass-02 finding. Either revalidate the page (`router.refresh()` or RSC re-render) after `Save changes` resolves, or render from the same source that the form mutates.
- **[low] `Change` on Business address swaps to typeahead but does not surface a `Cancel` or `Keep current` action.** Once you click Change, the only way to put the original address back is to retype it or reload the page (losing other field edits). Add a small `Cancel` link next to the typeahead.
- **[low] Typeahead results list shows out-of-state results (`Tucson, Arizona`, `Kansas City, Missouri`, `Palmer, Alaska`) for a Central-Valley-only employer.** Bias the Google Places query to California (`componentRestrictions: { country: 'us' }` + `bounds` around the Central Valley), or filter results client-side to CA. Out-of-state suggestions are noise for this user.
- **[low] Primary county dropdown only contains Fresno, Kern, Kings, Madera, Tulare.** Confirm this is the intended Phase-A scope. If the platform launches Stanislaus / San Joaquin / Merced soon (which the brand docs reference), that list will grow — make sure it's data-driven (lookup table) not hardcoded.
- **[low] H-2A checkbox helper says `Turns on H-2A compliance tracking (AEWR, housing inspection, 3/4 guarantee).`** Acronyms `AEWR` and `3/4 guarantee` are jargon-correct but opaque to a first-time grower. Either spell out (`Adverse Effect Wage Rate, three-quarters guarantee`) or tooltip them.
- **[low] `Doing business as (modified)`** in the right rail is leftover test data from pass-02. Not a finding — flagged so reviewers don't think the seed is broken.

---

## 4 · Lookups (`/employer/lookups`) + 404 page

### What I exercised
- Navigated directly to `/employer/lookups` (file path `services/api/src/employer/lookups/routes.ts` exists — wanted to see if there's a corresponding UI).

### Findings

- **[expected] No `/employer/lookups` UI page.** API-only surface. Not a bug, but worth confirming with the team that there's no plan to surface a UI for crops/roles/sites administration in this MVP. If admins need to add a crop or county, today they have to go through engineering.
- **[high] 404 page is the un-branded Next.js default.** Pure black background, default sans-serif `404 | This page could not be found.`, no AGCONN branding, no shell/sidebar, no theme respect (would also be black in light mode), no `Go back to dashboard` link, no "Did you mean…" hint. This is the *most likely* page a confused user lands on when they mistype a URL or follow a stale link — the absence of any orientation back to the app is a real UX hole. Add a branded `/[locale]/not-found.tsx` with the topbar+sidebar shell, a calm Tierra message, and a `← Back to dashboard` link in EN/ES.

---

## 5 · Crews & shifts (`/employer/crews`)

### What I exercised
- List view: header eyebrow `OPERATIONS · WEEK OF MAY 4 - MAY 10`, stats `1 crew · 0 confirmed · all filled · 0 hours scheduled`, CTAs `Export schedule`, `+ New crew`, `+ New shift`.
- Week navigator (◀ May 4 – May 10 ▶) and `Jump to a week` button.
- Schedule grid: one row "Crew A · Almonds" with `no foreman · 0 crew`, all 7 days showing `Off`.
- Crew leaders card for "Crew A" with foreman name "— hiring —", Size 0, Rating —, Edit crew + chat affordance.
- Clicked `+ New crew` → click did not navigate (URL stayed on `/crews`). Navigated directly to `/crews/new` — page rendered.
- Filled Basics on `/crews/new` (Crew name, Crew type = Harvest crew, Primary crop = Almond), validation footer flipped from `Add a crew name to continue.` to `Ready to create.`, Create crew button enabled.
- Clicked Create crew → POST `/v1/employer/crews` 200 → redirected to `/crews/{id}/edit`. ✓

### Findings

- **[blocker] Untranslated i18n key visible in UI.** ForemanSection on both `/crews/new` and `/crews/{id}/edit` renders a primary-styled green button literally labeled `employer.crews.edit_crew.foreman.hire_cta_button`. Console confirms: `IntlError: MISSING_MESSAGE: Could not resolve 'employer.crews.edit_crew.foreman.hire_cta_button' in messages for locale 'en'.` Translation key needs to land in both `en.json` and `es.json` (and DB-backed `translation_keys` per the bilingual-by-design rule). This is unshippable as-is.
- **[high] `+ New crew` link click on `/employer/crews` did not navigate** on the first attempt. The link `href` is `/en/employer/crews/new`. Direct navigation works, so the link target is fine. Most likely a Link-prefetch/event race (similar pattern to the filter-pill issue from pass-02). Investigate whether some overlay (the schedule grid? the user pill?) is intercepting clicks at that screen position.
- **[high] Stats row says `1 crew · 0 confirmed · all filled · 0 hours scheduled`.** "all filled" is a false positive — the only crew has 0 members and is actively `— hiring —`. "All filled" should not appear when target headcount > current. Either reword to `0 of 0 filled` or simply `not yet staffed`.
- **[high] Crew leaders card displays the foreman name as `— hiring —`** (literal em-dash + word + em-dash), which reads as data leak. If there's no foreman, render `Vacant` or `Hiring leader` (and translate it). Same prose appears as the bottom button label inside the card — looks like the prose is being doubled into a control.
- **[medium] Crew B "Save crew" button stays disabled with footer "No changes yet."** even though the just-created crew has empty Short code, no notes, no roster, no foreman, no required skills, no pay defaults. Saving an empty crew right after creation is benign — but the dirty-tracking should consider the crew "incomplete" rather than "no changes" when there are unfilled essential fields. Today the user has no signal that more setup is needed.
- **[medium] Crew name lost the interpunct `·` character.** I typed `Crew B · Walnut Harvest` (U+00B7); the saved/displayed value renders as `Crew B - Walnut Harvest` (hyphen). Either the API normalizes or my keyboard injection failed — repro in real browser to confirm. If the API normalizes punctuation, that breaks the brand convention (the seeded `Crew A · Almonds` uses interpunct).
- **[medium] Schedule color picker has 6 swatches but the selected state ring is hard to see** (subtle dark-on-dark ring). Pick a heavier ring or a checkmark to indicate selection. Also: no labels on swatches — a user with a color-vision difference cannot distinguish purple from red. Add an `aria-label` per swatch.
- **[medium] Right rail "Last 14 days yield" + "Activity" cards on the new-crew form** display `No piecework recorded for this crew yet.` and `No activity yet.` — these are pre-creation cards, so showing them is misleading. Hide both panels until first save, or dim/grey them out.
- **[low] `+ New crew` and `+ New shift` are styled identically** (both pill outlines), but `+ New shift` is a primary action (green-filled) and `+ New crew` is secondary (outline). Visually correct in screenshot — false alarm.
- **[low] "Crews / Day" header column** says exactly `CRWS / DAY` in the screenshot? Re-read — actually `CREWS / DAY`. OK.
- **[low] Bottom-of-form action bar is clipped at viewport bottom** when there are many sections. Sticky correctly, but on narrow viewports it overlaps the schedule color picker. Confirm at 1366×768 + sidebar open.
- **[low] `Roster · 0` step in the left nav is the only one with a count suffix.** Add counts to other sections too (`Required skills · 6`, `Foreman · 0`) for consistency, OR remove the count from Roster.
- **[low] Edit-page top-right has `Duplicate crew` and `× Archive`.** No way to delete a freshly-created mistake. Archive is reversible (good), but a `Discard` action for crews with no history (no shifts, no roster) would be friendlier than archive.

---

## 6 · Jobs (`/employer/jobs` + `/employer/jobs/{id}`)

### What I exercised
- List view: 2 cards (Walnut harvest crew live, Almond harvest crew DRAFT). Filter pills (All postings 2 / Open 1 / Urgent 1 / Filled 0 / Drafts 1 / Closed 0). Sort dropdown. Duplicate posting + New posting top-right.
- Ellipsis menus: live posting → Edit posting / Review applicants / Duplicate to new draft / Close posting / Pause renotifications. Draft → Edit posting / Review applicants / Duplicate to new draft / Discard draft. (Pass-02 gaps are now closed.)
- `Edit` link click on the Walnut card → did NOT navigate (URL unchanged). Direct nav worked.
- Editor (`/employer/jobs/{id}`): all 7 sections (Basics / Schedule / Pay & benefits / Requirements / Location & transport / Crew & application / Compliance), TIP callout, right-rail mockup-phone Worker preview with EN/ES toggle.
- Editor footer banner: `1 field needs attention · Not yet saved` while wage was empty (pass-02 publish-without-wage bug confirmed at the editor surface).
- Filled `Base hourly rate` 19.50 → 22.00, clicked `Save & notify crew` → modal `Notify the crew of these changes?` with clean before/after diff: `BASE HOURLY RATE MINIMUM $0/hr → $19.5/hr` and `BASE HOURLY RATE MAXIMUM $0/hr → $22/hr` + Cancel + Send notification.
- Cancelled the modal, clicked `Save & don't notify` → save succeeded (buttons disabled), worker preview phone re-rendered with `$166 - $187` daily and `$19.5/hr`.

### Findings

- **[high] `Edit` link click on the job card did not navigate** (same Link-click race as `+ New crew` on `/employer/crews`). Repro: load `/employer/jobs`, click the inline `Edit` link on a card. Likely the card has an overlay or onClick stop-propagation. Direct URL nav works. Fix at the click-handler layer.
- **[high] Plural bug in worker preview: `1 SPOTS · STARTS AUG 15`** (should be `1 SPOT`). The mockup-phone right-rail uses an `s`-suffixed string regardless of count. Use `useTranslations` plural form (`{count, plural, one {# spot} other {# spots}}`) — and re-test ES which has its own pluralization rules.
- **[high] Currency formatting drops trailing zero — `$19.5/hr` instead of `$19.50/hr`.** Both the diff modal and the worker preview phone show the unpadded form. For currency, always render two decimal places (`Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`). This will read as more polished and avoids visual ambiguity (`$19.5` looks like a typo).
- **[medium] After successful save, footer subtitle still reads `Not yet saved`** even though buttons disable and the editor's underlying state is clean. Update the subtitle to `Saved a moment ago` (relative time) on save success.
- **[medium] Editor's Worker preview right rail eyebrow says `TAKE-HOME / DAY` over the dollar range.** That wording implies after-tax / after-deductions take-home, which is misleading for a pre-tax gross hourly rate × hours estimate. Use `EST. GROSS / DAY` or `DAILY ESTIMATE` instead.
- **[medium] `Crop` chips in Basics section render but no chip is selected** for the Walnut posting (despite the title being "Walnut harvest crew"). Either the seed didn't link the crop, or the chip-selected state isn't visually distinct. Re-confirm by clicking a chip and seeing whether selection persists across save.
- **[low] `+ New posting` and `Duplicate posting` CTAs in the page header collide visually** at the right edge — `Duplicate posting` is a secondary outline button next to the green primary `New posting`. The duplicate is for power-users — consider demoting it into the ellipsis or only showing it when there's something selected.
- **[low] `1 SPOT OPEN` chip on the live editor uses red/error styling** (same finding as dashboard) — keep them in sync when fixing.
- **[low] TIP callout `Postings with photos and a piece rate fill 2.3× faster.`** is fine as a marketing nudge, but the source of `2.3×` should be cited or removed. If it's product-team aspiration rather than measured data, make it qualitative (`fill faster`) until you have numbers.
- **[low] Section nav uses `01` … `07` numeric prefixes.** If a section is added later (Compliance grew to two parts, etc.), the numbers shift. Either drop the numbers or commit to them as stable.
- **[low] The Worker preview mockup-phone status bar shows time `9:41`** — Apple's classic mockup time. Cute, but inconsistent with a Tierra "calm, civic" aesthetic that uses real clock-time. Use the actual `now` time (or a generic `--:--`).

---

## 7 · Inbox / Candidates (`/employer/inbox`)

### What I exercised
- Empty state: header `Candidates · 0 active`, subtitle `0 new · 0 reviewed · 0 hired this season`. Filter pills (All / New / Reviewed / Hired / Archived) each with `0` chip.
- `Filters` popover (top-right): Search by name or skill (placeholder `María, tractor, supervisor…`), Job posting (All postings), County (All counties), Clear / Apply.
- `Open broadcasts` link → `/employer/messages` (Broadcasts folder).

### Findings
- **[low] Page header says `Candidates`** but the URL is `/employer/inbox` (sidebar label is also `Candidates`). Pick one term and use it everywhere — already noted in shell findings.
- **[low] `0 new · 0 reviewed · 0 hired this season`** with "this season" only on the last term reads ambiguous — does "this season" qualify all three or only "hired"? Move it to the start (`This season: 0 new · 0 reviewed · 0 hired`) or to the eyebrow.
- **[good] Bilingual placeholder `María, tractor, supervisor…`** is a thoughtful inclusive touch.

---

## 8 · Workers (`/employer/workers`)

### What I exercised
- Loaded `/employer/workers` while on the Free plan.

### Findings
- **[medium] `/employer/workers` shows nothing but the Pro paywall** — there's no "what would I get" preview. Even a blurred mock or a single-row example would help an employer understand what they're paying for. Today it's a lock icon, two sentences, and a CTA. Add a sample search-result strip (faded, "Pro preview").
- **[low] No header / page title** above the paywall card — the page renders as a centered modal in an empty layout. A page header (`Find workers`) would orient users who landed here from a deep link.
- **[low] Sidebar label `Find workers` differs from URL `/workers`** — accept the mismatch, but don't have a separate `Workers` route in some other context that means something different. (Confirm only one `/workers`.)

---

## 9 · Crews/shifts/new-shift (`/employer/crews/new-shift`)

### What I exercised
- Direct nav to `/crews/new-shift?date=2026-05-06` (the link from the schedule grid).
- Form scaffold: Shift type (Work shift / Training / Day off / Holiday), Assign crew (No crew · ad-hoc / Crew A · Almonds / Crew B · Walnut Harvest / + Create a new crew), Date & time (date, status, start, end, repeat days), and partially visible Location / Logistics / Safety / Notifications / Workers sections.
- Right rail: Worker preview mockup-phone with EN/ES toggle showing the SHIFT card a worker would see (Time / Pickup / Bring / Lunch + Confirm + Can't make it buttons).

### Findings
- **[high] `/employer/crews/shifts` (the parent route, no id)** 404s with the un-branded Next.js page. Folder exists but no `page.tsx`. Either add an index page (a flat list of all shifts) or have it redirect to `/employer/crews` (the schedule grid).
- **[medium] Crew B card in the Assign-crew picker shows `Crew B - Walnut Harvest` (hyphen)** — confirms that the interpunct I tried to type was lost. Replicates the punctuation-normalization concern from §5.
- **[low] Both Crew A and Crew B cards display the foreman name as `— hiring —`.** Same data-leak finding as `/crews`.
- **[low] Right-rail mockup-phone shows `Crew · Location` placeholder + 4 dashed rows.** Until a crew + work site are picked, the preview is blank. That's correct — but the eyebrow could explain ("Pick a crew and time to preview").

---

## 10 · Compliance (`/employer/compliance` + `/compliance/audit`)

### What I exercised
- Compliance dashboard: 75% compliant, 7 actions need attention strip, 4 category cards (Worker documentation 100%, H-2A program 100%, Pesticide records 50%, Worker safety 50%).
- Action cards each have `Schedule` CTA.
- `Audit binder PDF` button → `/compliance/audit` rendered as a print-style document (AGCONN letterhead, doc id, Generated date, sections §1 Summary / §2 documentation / §3 h2a / etc., per-category tables Status/Item/Details/Due).

### Findings
- **[medium] Audit-binder section headings inconsistent capitalization.** `§1 Summary` (titlecase), `§2 documentation` (lowercase), `§3 h2a` (lowercase). Should all be titlecase: `§2 Documentation`, `§3 H-2A`. The lowercase form makes the binder look like a draft.
- **[medium] Action cards' `Schedule` CTA is generic regardless of severity** (re-confirms pass-02). Urgent items should say `Resolve` or `Open now`.
- **[medium] Score donut on the dashboard duplicates the headline** — both say `75%` within 200px of each other. Drop the donut or drop the headline.
- **[low] `7 actions need your attention`** subtitle says `7 actions due — review and resolve when ready`. The word "ready" suggests no urgency, but several items are SOON and one mentions Cal/OSHA §3395 (heat illness — high severity). Distinguish "due now" from "preparing for season."

---

## 11 · Messages (`/employer/messages`)

### What I exercised
- Empty inbox view with sidebar folders: All conversations, Candidates, Active crew, Foremen, Broadcasts.
- Search messages input. Empty state in main pane: `No thread selected.`
- `+ New thread` and `+ New broadcast` (gold) CTAs top-right.

### Findings
- **[low] Two-pane empty state is very flat** — folder list on left, search box on top, and `No thread selected.` centered. Add a "Start your first thread" empty-state illustration and an inline `+ New thread` button.
- **[low] `+ New broadcast` button is gold** while `+ New thread` is outline. Gold reads as the primary action — confirm broadcasts (1-to-many) are intended as the more emphasized action over individual threads, or swap.
- **[low] `INBOX` eyebrow + `Messages · 0 unread`** title — "0 unread" using gold accent is the same false-positive issue as the Top new applicants chip on the dashboard.

---

## 12 · Payroll (`/employer/payroll`)

### What I exercised
- Loaded the Payroll dashboard with no timesheet data: header `Payroll · runs Friday`, eyebrow `PAY PERIOD · MAY 4 - MAY 10`, hero `NET PAYOUT · THIS PERIOD $0.00` with sub-stats, side card `SEASON-TO-DATE $0.00 · Across 1 pay periods · 0 unique workers`, H-2A compliance callout, empty `Worker timesheets · ready to approve` table.

### Findings
- **[medium] `Approved` chip in the page header is green/positive** even though there are 0 timesheets to approve. The chip represents the *period status* (the period has been auto-approved because there's nothing to approve), but the visual reads as "good news!" — confusing. Either suppress the chip until there's data or change copy to `No timesheets`.
- **[medium] Plural bug `Across 1 pay periods · 0 unique workers`** — should be `1 pay period`. Use ICU plural or the `useTranslations()` `t.rich` form.
- **[medium] H-2A compliance callout reads `3-fourths guarantee tracked · Adverse Effect Wage $19.97/hr applied`** — confirm `$19.97` is the live AEWR pulled from a config table, not a hardcoded value (CA 2026 AEWR is `$19.97`, but it changes annually). If hardcoded, surface a tracker.
- **[low] `Tools` dropdown next to `+ New period`** — what's in it? Could not test (tooltip-only without click). At minimum show a chevron or aria-haspopup so users know it expands.
- **[low] Hero card `NET PAYOUT · THIS PERIOD $0.00`** — when there's no data, render `—` or "No timesheets yet" instead of `$0.00` (which implies you ran payroll and got zero).

---

## 13 · Billing (`/employer/billing`)

### What I exercised
- Header `Billing & plan`, hero `CURRENT PLAN Free · Active postings limit 2 · Worker search ✗ · Priority listing ✗`.
- Three plan cards: Free (CURRENT chip), Pro $99/mo, Enterprise $299/mo. Each Pro/Enterprise card has monthly/yearly pill toggle + disabled `Upgrade to Pro` / `Upgrade to Enterprise` button.
- Bottom callout: `Billing is not available yet — please contact support.`

### Findings
- **[medium] Free card visually unbalanced.** Pro has bullets at the top + price at the bottom. Free has the bullet (`Active postings: 2`) at the bottom, leaving a large empty space above. Mirror the Pro layout: short description + bullets + (no price line for Free).
- **[medium] Disabled `Upgrade to Pro` button + below-the-card hint** + below-the-grid global callout all say the same thing (`Billing is not available yet — please contact support.`). Triple-stated. Pick one location.
- **[low] Yearly/monthly pill on Free card** — there is no pill on Free since it has no price. Consider a "no commitment" badge to make the Free card visually parallel.
- **[low] Pro card `Worker search` and `Priority listing`** are listed as features — but on Enterprise they're "Worker search" + "Priority listing" + 4 more. Show a "Everything in Pro, plus:" prefix on Enterprise to reinforce the upgrade narrative.

---

## 14 · Reports (`/employer/reports`)

### What I exercised
- Header `Hiring reports`, subtitle `Operational pulse · season vs. last year · DOL/EDD-ready exports`.
- Top-right: `This season` / `Export CSV`.
- KPI strip: HIRES THIS SEASON / AVG TIME-TO-FILL / COST PER HIRE / 30-DAY WORKER RETENTION — all `0`.
- Chart: `Applicant flow vs. spots filled · weekly` with empty state `No applicant data yet — once jobs receive applications, weekly flow will appear here.`
- Two cards: `By job type · season` (Almond + Walnut, 0 applied · 0 hired · 0% filled), `Top performers · this season` (blank, no copy).

### Findings
- **[medium] KPI cards render `0`** for `Avg time-to-fill`, `Cost per hire`, `30-day worker retention` — these should be `—` (em-dash) when there's no data. `0 days time to fill` and `0% retention` are both misleading.
- **[medium] `Top performers · this season` panel has no empty-state copy** — the card is just blank below the eyebrow. Add `No worker hires yet.` or a small skeleton.
- **[low] `By job type · season` row uses a small green pin icon at the right** — what does it mean? Add a tooltip.
- **[low] Eyebrow `ANALYTICS · SEASON 2026`** is fine. Confirm "Season 2026" maps to a real season window (e.g., harvest season runs across calendar years).

---

## 15 · Help (`/employer/help`)

### What I exercised
- Page header `How can we help?` + subtitle.
- 6 topic cards in 3×2 grid (Post a job, Review applicants, Payroll & taxes, Compliance, Reports, Business profile) — each with FontAwesome icon + 2-line description.
- `Talk to a person` panel: copy + email button (support@agconn.com) + phone (`(559) 867-5309`) + hours `Mon-Fri · 7:00 a.m. - 6:00 p.m. PT`.

### Findings
- **[medium] Topic cards are not links** — they're styled like clickable cards but only the page-header search would let a user act on them. Wire each card to an article (`/help/posting-a-job`, etc.) or to an in-app drawer.
- **[low] Email button is solid green** (primary CTA style). Phone button is outlined. Both are equally important contact paths — either flatten to two outlined buttons or be deliberate about which is primary.
- **[low] Phone number** confirm it's wrapped in `<a href="tel:+15598675309">` so mobile users can tap-to-call.
- **[low] Hours format `Mon-Fri · 7:00 a.m. - 6:00 p.m. PT`** uses `a.m./p.m.` (with periods, lowercase) — fine for a print-style register, but inconsistent with the rest of the app (worker preview uses `6:00 AM`). Pick one.
- **[low] No search input on the help page itself** — only the global topbar search, which is for "jobs, applicants" and won't return help articles. Add a help-only search input.

---

## 16 · Account (`/employer/account`)

### What I exercised
- Loaded the Clerk-mounted `My account` page. Skeleton appeared for ~3s before content rendered.
- Form sections: Profile photo (default avatar + Change photo CTA), Personal info (First / Last name), Email addresses (`bkorous+grain1@gmail.com` PRIMARY + VERIFIED + `Add email`), Phone numbers (empty, `Add phone`).
- Tabs: Profile · Security.

### Findings
- **[medium] Clerk hydration takes ~3s** and the only feedback is a generic skeleton (3 grey lines). Customize the skeleton to match the actual layout (avatar circle + name fields + email rows) so it doesn't feel like a stalled page.
- **[low] Form column is ~600px wide on a 1538px viewport** — wide whitespace on the right makes the page feel half-built. Either widen the column or balance with a right-rail summary card (e.g., "This account belongs to: Brandon · Joined May 2026").
- **[low] User display name is `Brandon Grain1`** — flagged earlier as a test-data artifact. The `1` suffix is from seed naming.

---

## 17 · Onboarding (`/employer/onboarding`)

### What I exercised
- Direct nav to `/employer/onboarding` while already onboarded.
- Page renders the full first-run setup form: Legal business name (empty), DBA (optional), Business type cards (Grower selected), EIN, Primary county (Fresno), Programs, Business address, Contact email/phone.
- Minimal layout (no shell sidebar) — full-page card on a `base-200` background. AGCONN logo top-left, ES locale switch top-right.

### Findings
- **[high] Already-onboarded users can navigate to `/employer/onboarding`** and see an EMPTY first-run form that does not pre-fill from their existing profile. If a user submits, they would either overwrite their profile with empty values or trigger duplicate-business creation. Either redirect verified employers to `/employer/dashboard` or hydrate the form with their current values and treat it as `Edit business setup`.
- **[medium] Form is essentially identical to `/employer/profile`** — same fields, same layout. Decide which is the source of truth. Recommend: onboarding becomes a wizard for new users, profile becomes the only edit surface.
- **[low] Locale switch top-right shows just `ES`** — bare two-letter abbreviation looks like a flag-less language pill. Add a globe icon and an aria-label.

---

## 18 · Job applicants empty state (`/employer/jobs/{id}/applicants`)

### What I exercised
- Skipped (would only see an empty state with no data — covered by inbox empty state already).

### Findings
- **[deferred] Need a worker pass to test the applicants list with real data.** Apply through the worker flow as part of the next pass.

---

## 19 · ES parity sweep

### What I exercised
- `/es/employer/dashboard` — fully translated. Sidebar (Panel / Publicaciones / Candidatos / Buscar trabajadores / Cuadrillas y turnos / Nómina / Cumplimiento / Mensajes / Reportes / Facturación / Perfil del negocio). Greeting `Buenas tardes, Brandon.` + eyebrow `MARTES, 5 DE MAYO · FRESNO`. Hero card `VIE 14 DE AGO · MADERA / Cuadrilla de cosecha de nueces — 1 puesto restante`. Stats `POSICIONES ABIERTAS / PUESTOS RESTANTES / APLICANTES · 7 DÍAS / TIEMPO PROM. PARA LLENAR`. Pipeline `APLICADOS / REVISADOS / CONTRATADOS / RECHAZADOS / Sin postulantes en esta etapa`. Right rail `SIN SUBSCRIPCIÓN ACTIVA / Plan gratis` + `SALUD DEL PERFIL VERIFICADO 100%`.
- `/es/employer/crews` — `Cuadrillas y turnos / 2 cuadrillas · 0 confirmados · todas llenas · 0 horas programadas` with day headers `LUN MAR MIÉ JUE VIE SÁB DOM`. Each empty day cell shows `Libro`. Capataces (foremen) section with `— contratando —`.
- `/es/employer/jobs/{id}` — full editor in ES. Sections `Lo básico / Horario / Pago y beneficios / Requisitos / Ubicación y transporte / Cuadrilla y solicitud / Cumplimiento`. Crops chips `Uva / Almendra / Cítricos / Tomate / Lechuga / Fresa / Pistacho / Nuez / Fruta de hueso / Verdes de hoja / Otro cultivo`. Worker preview phone localized to ES with `1 CUPO · INICIA AUG 15 / GANANCIA DIARIA / $166-$187 / $19.5/hr / HORARIO 6:00 AM - 2:30 PM Lun a Sáb / TRANSPORTE Transporte propio / APLICAR POR SMS WHC-PH7 / Aplicar ahora (1 toque)`.

### Findings

- **[high] `/es/employer/crews` shows `Libro` in every empty day cell** — should be `Libre` (off / free). `Libro` means "book". Translation bug. (`crews/page.tsx` schedule grid empty-day label.)
- **[high] Spanish typo: `SUBSCRIPCIÓN` should be `SUSCRIPCIÓN`** (no `b`). Appears on `/es/employer/dashboard` as `SIN SUBSCRIPCIÓN ACTIVA` in the right-rail Free plan card. Common Spanish typo.
- **[high] Worker preview in ES editor shows `INICIA AUG 15`** — month abbreviation `AUG` did not localize. Should be `AGO`. The day name and date number localize correctly elsewhere (`MARTES, 5 DE MAYO`, `VIE 14 DE AGO`), so the worker-preview component is using a hardcoded EN month list rather than `Intl.DateTimeFormat('es-MX', { month: 'short' })`.
- **[medium] Foreman placeholder leaks in BOTH locales identically.** EN: `— hiring —`. ES: `— contratando —`. The em-dash-word-em-dash pattern is consistently rendered as a name. Replace with a translated label like `Vacante` (ES) / `Vacant` (EN).
- **[medium] ES dashboard re-uses the same red-error styling for `1 PUESTO ABIERTO`** — repros the EN `1 SPOT OPEN` color finding in ES. Fix once at the chip primitive.
- **[good] Currency stays in `$` in ES** — correct (USD). Numerals use `19.5` not `19,5` (ES typically uses comma) — consider en-US numeric format intentionally for parity with payroll docs, or switch to es-MX format. **Open question:** which Spanish locale is canonical — `es-MX`, `es-US`, or generic `es`? File a decision.
- **[good] Sidebar wraps `Buscar trabajadores` to two lines cleanly** without overflow.
- **[good] Greeting respects time-of-day in ES** (`Buenas tardes` for afternoon).

---

## Summary (all sections)

**Blockers (1):** Untranslated i18n key `employer.crews.edit_crew.foreman.hire_cta_button` rendered to the user as a button label.

**High-priority findings (10):**
- Date inconsistency (`AUG 14` vs `Aug 15`) on the same job between dashboard hero and `/jobs` list.
- Profile form silently blocks submit on missing required field — no inline error.
- `+ New crew`, `Edit` job-card link, `+ New posting` Link clicks intermittently fail to navigate (Link race).
- Crews stats lie: `all filled` shown for an unstaffed crew.
- Crews leader card displays placeholder `— hiring —` as the foreman name.
- Worker preview plural bug `1 SPOTS`.
- Currency formatting drops trailing zero (`$19.5/hr` vs `$19.50/hr`).
- 404 page is the un-branded Next.js default.
- `/employer/crews/shifts` 404s (folder exists, no `page.tsx`).
- Already-onboarded users can hit `/employer/onboarding` and overwrite/duplicate via the empty form.
- ES: `Libro` instead of `Libre` on the crews schedule grid.
- ES: `SUBSCRIPCIÓN` typo (should be `SUSCRIPCIÓN`).
- ES: month abbreviation `AUG` not localized in worker preview.

**Medium / Low:** Many — see individual sections.

**Re-confirmations from pass-02 still present:**
- Publish accepted `wage_min = wage_max = 0` (Walnut posting still shows `$0/hr` on dashboard until I patched it during this pass).
- Right-rail "Verification status" panel does not refresh after profile save.
- Save button has no loading/disabled state on profile.
- Action cards' `Schedule` CTA copy is generic regardless of severity.

**Pass-02 issues now fixed:**
- Job-list ellipsis menus now include `Close posting`, `Pause renotifications`, `Discard draft`.

**Deferred (need worker pass):**
- `/employer/jobs/{id}/applicants` with real applicant data.
- `/employer/applications/{id}` (ApplicantActions Hire / Reject / Mark reviewed).
- Cross-tenant isolation probe (need a second seeded tenant).
