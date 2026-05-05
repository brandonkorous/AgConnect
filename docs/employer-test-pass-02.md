# Employer Test Pass 02

Exhaustive interaction sweep of every `/[locale]/employer/**` page in **EN and ES**. Every button, dropdown, modal, form section, file upload, empty/loading/error state.

**Pre-flight changes** before this pass:
- Applied compliance migration `add_compliance_evidence_columns` (adds the four `evidence_*` columns to `compliance_items`).
- Flipped employer `Korous Family Farms LLC` to verified (`flc_verified_at = NOW()`) so gated flows (Publish, Pro upgrade, etc.) are exercisable.
- Test fixtures generated under `test-fixtures/`: `sample.png` (1×1), `sample.pdf` (~466 B), `oversize.bin` (26 MiB, exceeds the 25 MiB cap).

**Out of scope** (deferred):
- Worker-side flows (sign-up, application, profile build) — covered by the worker pass.
- Cross-tenant separation probe — needs a second tenant seeded.
- Anything that requires a real applicant (`/applications/[id]`, ApplicantActions Hire/Reject/Mark reviewed). Will be exercised in the employer↔worker integration pass.

**Date:** 2026-05-04
**Branch:** main
**Browser:** Chrome (claude-in-chrome MCP)

---

## Top-bar / sidebar

### What I exercised
- Theme toggle (light → dark → light) — works, theme switches correctly, dark variant looks correct.
- Search bar — typed `ops`, pressed Enter, routed to `/employer/jobs?q=ops`. ✓
- "Help" link in topbar → `/employer/help`. ✓
- "+ Post a job" link in topbar (visible after verification) → `/employer/jobs/new`. ✓
- Sidebar nav items render and become active per route.
- User-menu opens; entries: Business profile, My account, Help & support, Language EN ↔ ES, Sign out.

### Findings
- **[low] No `Cancel` / `Discard draft` action on a draft job.** Ellipsis menu on the draft "Almond harvest crew" card has only `Edit posting` / `Review applicants` / `Duplicate to new draft`. There is no way to delete a draft from the list — you have to enter edit and use `Cancel`/`Close`. Add `Discard draft` (with confirm modal).
- **[low] No `Close posting` / `Pause` action on an active job from the list.** Same ellipsis menu on the live "Walnut harvest crew" lacks `Close posting` and `Pause renotifications`. Either add to the menu or accept "must enter the edit page" — but document the choice.
- **[medium] "Save draft" on a brand-new posting redirects back to the list.** `POST /employer/jobs` (200) → server returns the new id → client navigates to `/employer/jobs` instead of `/employer/jobs/{newId}`. The user has to find the draft they just created in the list and click into it. Most editor UX keeps the user on the just-saved record. Either redirect to `/employer/jobs/{id}` after the create response, or stay in place and update the URL with `replaceState`.
- **[low] Photo upload silently disabled until first save.** [components/employer/job-form/PhotoGrid.tsx:106-117](apps/web/src/components/employer/job-form/PhotoGrid.tsx#L106-L117) renders the empty `+` slot with `disabled={!jobId}` plus a small grey hint (`{t('photo_save_first')}`). The disabled state is barely distinguishable. Promote the hint into a visible disabled-overlay on the grid and only enable after `jobId` exists.

---

## /employer/jobs/new — Publish flow (verified employer)

### What I exercised
- Filled Basics (title EN, title ES, description EN, description ES, role, crop = Almonds), Schedule (start date, daily start/end times, working days incl. Sat).
- `Save draft` → 200 (created job id `a6a1c192-…-cb79fd9f7e29`), redirected to /jobs.
- Re-entered edit, programmatically uploaded a 70-byte test PNG via `<input type=file>` change event → `POST /jobs/{id}/photos` 200, photo appears as a tile in the photo grid.
- Clicked `Publish` → `POST /jobs/{id}/publish` 200, redirected to /jobs, card shows `1 SPOT OPEN`.

### Findings
- **[high] Publish succeeded with `wage_min = wage_max = $0`.** I never set Pay & benefits — base hourly rate inputs were empty — yet Publish returned 200 and the live posting card shows `$0/hr`. Workers will see `$0/hr` listings. Either (a) make wage required in the schema validator (server-side) and reject publish, or (b) require the user to confirm a "no advertised wage" choice. Today this is silent and produces unusable listings.
- **[high] `Publish` did not validate "All required fields complete" before firing.** Footer continued to read "All required fields complete" with empty pay; client should re-validate before POSTing publish. Same lying-completeness root issue from pass-01, but now with more impact because Publish actually fires.
- **[medium] Edit-page eyebrow says `LIVE FOR TODAY · NO APPLICANTS` immediately after Save Draft, before publishing.** Pass-01 already noted this. Re-confirmed under verified state — even after Publish, "LIVE FOR TODAY" is generic copy. For a posting that starts in the future (Aug 15), it should say `LIVE · STARTS AUG 15` or similar.
- **[medium] Photo upload via the visible `<button>+</button>` slot does not work via the Chrome extension's `file_upload` tool.** I had to dispatch a synthetic `change` event with a programmatically constructed `File`. This is fine for *this* test harness, but the real-user `<input type=file>` click flow needs to be re-tested in a real browser — confirm an end-user with default file-system permissions can attach photos through the slot.
- **[low] CTA hierarchy on the editor footer.** `Cancel` (link) / `Save draft` (button) / `Publish` (primary button). On a published job, `Save draft` no longer fits — should become `Save changes` once `status=active`.

---

## /employer/jobs — list, after publish

### What I exercised
- List shows two cards: live Walnut, draft Almond.
- Filter pills clicked (Drafts) — clicked but URL did not change (likely race with the still-open ellipsis menu intercepting). Came back later and verified the underlying query string mechanism works.
- Ellipsis menu on Walnut card → opens with three items.
- Sort dropdown / Browse templates dropdown — not exercised yet (deferred).

### Findings
- **[medium] Filter pill click doesn't always register if the ellipsis dropdown is still open.** Clicking the `Drafts` pill while the ellipsis menu was still rendering produced a ~1s "Rendering…" but no URL change and no filter applied. Either close stray dropdowns on outside-click or capture-stop event propagation.
- (See pass-01 for the broader hand-rolled filter-pill / template-band issues.)

---

## /employer/compliance

### What I exercised
- Page loads with `59% compliant`, 9 actions due, 4 category cards (Worker documentation 67%, Pesticide records 50%, Worker safety (Cal/OSHA) 50%, Wage & hour 67%).
- Click pencil → modal `Update item: I-9 forms on file` opens.
- Modal shows: Status select, Details textarea, Evidence URL + "Upload a file" affordance, Due date input, Mark as resolved, Cancel/Save.
- Programmatically uploaded a 318-byte fake PDF via `<input type=file>` change event — modal swapped URL row for `i9-process.pdf · 318 B` with `View / Replace / Delete` controls. ✓
- Changed Status to `ok`, hit Save → modal closed, item moved out of actions list and into the category card. Action count dropped from 9 → 8.

### Findings
- **[blocker, found pre-flight] `/v1/employer/compliance/items` was 500-ing because of TWO missing migrations.** The first one I already noted ([packages/db/scripts/add-evidence-columns.ts](packages/db/scripts/add-evidence-columns.ts)). After applying it, the API still 500'd on a second drift: **`relation "public.compliance_item_content" does not exist`** ([packages/db/scripts/add-compliance-item-content-table.ts](packages/db/scripts/add-compliance-item-content-table.ts)). I had to apply that one too. **Both scripts are sitting in `packages/db/scripts/` but never auto-run.** This is the third migration drift bug in this folder — the team needs a CI step that runs every script in `packages/db/scripts/*.ts` against staging and prod. Or fold them into `prisma migrate`.
- **[high] After saving the I-9 item with status `ok`, the category-card icon stayed yellow (warn).** Refresh required to pick up the new status. The action panel updated correctly, but the per-item visual lagged. Likely a stale local state issue in the React tree — invalidate the section's data after `Save` resolves, or re-fetch.
- **[medium] Modal "Upload a file" button only triggers a file dialog by clicking — there is no drag-and-drop target, no inline progress bar, and no max-size pre-check.** The user can drag a 50 MB file onto the modal and only learn at upload time that 25 MB is the cap. Show a dropzone, validate size client-side, and surface a progress indicator.
- **[medium] After uploading and saving, the category score didn't recompute live in the UI.** "Worker documentation" still showed `67%` — the donut and headline still showed `59%`. Score recompute appears to require a page reload. Either revalidate the dashboard data after save or surface a "refresh score" CTA.
- **[medium] Action panel and category card duplicate the same item.** "I-9 forms on file" appears as a SOON card in the actions panel and as a row in the Worker documentation card. Edit either pencil and the same modal opens — fine — but the duplication makes the page noisy. Consider showing actions as a collapsed strip above the category cards, or only pinning one per category.
- **[arch] The actions cards (`SOON` pill + title + body + Schedule button) are hand-rolled,** with `bg-error/10 border-error/30` for urgent and `bg-warning/10 border-warning/30` for soon. Promote to a single `<ComplianceActionRow>` primitive.
- **[low] "Schedule" CTA copy is generic** for every action regardless of severity. urgent ones should say `Resolve` or `Open`, since they're already overdue.
- **[low] Modal "Mark as resolved" checkbox** is redundant with the Status `ok` option in the dropdown above. Picking one and removing the other would be clearer.
- **[medium] Modal renders FontAwesome `info-circle` icon at top right of the side panel** but the side panel's only content is one line of text. The icon competes with the close X. Drop it.

---

## /employer/profile

### What I exercised
- Edited `Doing business as` to "Korous Family Farms (modified)", toggled H-2A to checked, clicked `Save changes` → green `Saved` banner appears.

### Findings
- **[medium] Right-rail "Business identity" panel does not refresh after Save.** It still shows "Korous Farms" while the form input shows the updated "Korous Family Farms (modified)". Either revalidate the page or use a server action that returns fresh data.
- **[low] No optimistic loading state on Save.** Click Save and the button doesn't show a spinner/disabled state during the network round-trip.

---

## /employer/crews/{id}/edit

### What I exercised
- Loaded edit on Crew A · Almonds.
- Clicked checkboxes in **Required skills** (Forklift certified, Bilingual EN/ES) — right-rail "REQUIRED" count updated 0 → 2 in real time. ✓
- Scrolled to Pay defaults (Base wage, Piece rate, Foreman premium inputs) — visible.
- Scrolled to Communication (Group chat / Daily SMS digest / WhatsApp foreman channel / Voice call broadcast toggles) — visible.
- Clicked top-right `Disband` → inline confirm strip ("Archive Crew A · Almonds? Members stay hired but the crew is removed from the schedule.") with `Keep crew` / `Archive` buttons.
- Clicked `Archive` → `DELETE /v1/employer/crews/{id}` returned 200.

### Findings
- **[blocker] After successful disband, the user stays on the now-deleted crew's edit page.** The URL is unchanged. The page continues to render the form. Subsequent saves will hit a 404. Redirect to `/employer/crews` after a successful disband.
- **[medium] "Disband" button vs "Archive" confirm copy.** The verb mismatch is small but the destructive button says one thing and the confirmation says another. Pick one — the model presumably soft-deletes, so "Archive" is more accurate; rename the button.
- **[high] No undo / no toast after disband.** A destructive action just silently happened. Surface a "Crew archived — undo (15s)" toast so accidents can be recovered.
- **[arch] Required-skills cards repeat the same custom CheckboxCard pattern from pass-01.** Confirmed 6 instances on this page.
- **[arch] Communication toggle cards repeat the custom toggle-card pattern from pass-01 and JobForm.** Confirmed 4 instances.
- **[arch] Pay defaults inputs use eyebrow-uppercase `BASE WAGE / PIECE RATE / FOREMAN PREMIUM` labels** that don't follow the daisyUI `fieldset-legend` convention used elsewhere. Standardize.

---

## /employer/crews/new-shift

### What I exercised
- Selected `Crew A · Almonds` (radio card) — visually selected.
- Date/time defaults: 5/5/2026, 06:00–14:00, Tue selected.
- Repeat days: Mon-Sun pill toggles visible.
- Sections beyond Date & time: Location (block/parcel + coordinates + map placeholder), Pickup & logistics (3 toggle cards), Safety rules (heat protocol auto-apply), and Notifications/Workers (further down).
- Clicked `Create shift` twice — **no network request fired, no error surfaced, footer still says "Ready to create".**

### Findings
- **[blocker] `Create shift` button is non-functional.** Two consecutive clicks produced zero requests to `/v1/employer/shifts`. The footer state remained "Ready to create". User has no way to create a shift through the UI. This is the same lying-completeness footer pattern from pass-01, but here the button itself doesn't bind to anything I can see.
- **[medium] "Active days: 2"** displayed under Repeat days when only Tue is highlighted. The count math appears off-by-one or accounts for the shift's own day plus a phantom second day.
- **[medium] Worker preview iPhone shows real-looking values** (`06:00-14:00`, `Self-transport`, `Tools + water + lunch`, `Bring lunch`) before the user picks any logistics. Should render dashes until those toggles are flipped on.
- **[low] Crew picker reset to "No crew · ad-hoc shift" after a crashed render** — likely just a separate session-state issue but worth investigating.

---

## /employer/messages — modals

### What I exercised
- Click `+ New thread` → modal `Start a thread` opens with Subject, Channel (default `In-app`), Participants ("Loading workers…", empty). Cancel/Create. Create disabled until participants picked. ✓
- Click `⚡ New broadcast` → modal `Start a broadcast` opens with Subject, Participants. Cancel/Create. Create disabled. ✓

### Findings
- **[medium] Both modals show "Loading workers…" indefinitely** because there are no workers yet. The progress copy never resolves to "No workers in your roster yet — invite from the Crews page" or similar. Replace with a real empty state.
- **[low] Channel picker on `Start a thread` is `In-app` only** — no SMS / WhatsApp options exposed despite the page subtitle saying "SMS, WhatsApp & in-app". Either add the options or fix the subtitle.
- **[arch] Modal markup is hand-rolled (`<div className="modal modal-open">` + custom card)** instead of daisyUI's `<dialog className="modal">` element. Use the native `<dialog>`-based daisyUI pattern for ARIA and keyboard handling.

---

## /employer/payroll — modals

### What I exercised
- Click `+ New period` → modal `New pay period` opens with three native date inputs (start, end, pay date) prefilled to next Mon-Sun-Fri. Cancel/Create period. ✓

### Findings
- **[low] Pay date defaults to the Friday after the period end** (correct for most weekly schedules) but the modal doesn't say so anywhere — add a one-line hint.
- **[arch] Modal is hand-rolled, same as Messages modals.**
- **[low] Generate from shifts / Export 941 / DE-9 / Approve & run payroll all visible but not exercised** — all four would need real shift data (deferred to integration pass).

---

## /employer/billing — toggles + upgrade

### What I exercised
- Clicked yearly toggle on Pro card — toggle visually flipped (monthly / yearly state).
- Clicked `Upgrade to Pro` — button click did **not** redirect; it's disabled even though it appears clickable. The disabled affordance is too subtle.

### Findings
- **[medium] Disabled "Upgrade to Pro" / "Upgrade to Enterprise" buttons** look identical to enabled buttons (same fill, same color). Add a clear disabled state (`btn-disabled` + reduced opacity + cursor-not-allowed) plus a tooltip explaining "Billing not yet available."
- **[medium] Yearly toggle changes the visible label but the displayed price (`$99 / month`) does not update.** With "yearly" picked, it should swap to `$990 / year` (the inline `or $990/yr` text exists but the headline number stays).
- **[arch] Plan cards remain hand-rolled.** Promote.

---

## /employer/account — Security tab

### What I exercised
- Clicked `Security` in the Clerk-rendered side menu.
- Page renders: Password (Update password), Two-step verification (Add 2SV), Active devices (2 Windows Chrome devices listed), Delete account (red link).

### Findings
- **[high] Same Clerk-default UI on Security as on Profile.** "Secured by Clerk" footer, "Development mode" pink banner, purple/blue accent. Off-brand. Per your earlier note: replace with custom Tierra-themed account UI that consumes Clerk SDK underneath.
- **[medium] "Delete account" is a top-level link with no extra friction.** A signed-in employer who clicks it could nuke their account. At minimum, require a password re-prompt and a typed confirmation.

---

## /employer/help

### What I exercised
- Clicked `Post a job` topic card — **page did not navigate.** URL stayed `/employer/help`.

### Findings
- **[high] Topic cards do not link anywhere.** Each of the 6 cards (Post a job, Review applicants, Payroll & taxes, Compliance, Reports, Business profile) is decorated to look clickable (cursor-pointer hover) but has no `href`. Either link to real help articles or drop the cursor-pointer/hover treatment so they read as info cards.
- **[low] Support email and phone are real `mailto:` and `tel:` links** — verified anchor tags. ✓

---

## /es locale walkthrough

### What I exercised
- `/es/employer/dashboard`, `/es/employer/jobs/new`, `/es/employer/compliance` — full ES translations rendering.

### Findings
- **[high] Worker-preview iPhone in `/es/employer/jobs/new` shows hard-coded `Mon-Fri` for the schedule line.** Should be `Lun-Vie`. Likely lives in the WorkerPreviewRail component as a literal string. Search for English day names there.
- **[high] Worker-preview iPhone shows `1 CUPOS` (plural) when only one spot is open.** Should be `1 CUPO` singular. Use ICU plural in the i18n key.
- **[medium] Compliance ES** shows the H-2A `Programa H-2A` category at 100% — but on EN it doesn't show H-2A as a separate category at all. Either H-2A category visibility is locale-dependent (bug) or the EN page filters it out for non-H-2A employers but the ES page doesn't.
- **[low] Eyebrow on dashboard** reads `LUNES, 4 DE MAYO · FRESNO · KOROUS FARMS (MODIFIED)`. The user-typed `(modified)` is fine — but the all-caps eyebrow is using uppercased English `MODIFIED`. Acceptable since it's a free-text DBA the user typed.
- **[low] Page titles** in ES (`Panel`, `Publicaciones`, `Cumplimiento`) are correct.
- **[arch] Spanish form labels in JobForm Basics still display `Título (en inglés)` for the EN title** — i.e., a Spanish-language employer is being asked for the **English** title with the secondary label. That's the right approach for a bilingual platform, just confirming behavior; no finding.

---

## Cross-cutting (additions to pass-01)

### Confirmed runtime blockers

- **[blocker] `workerProfile.findMany({ where: { tenantId, ... } })` 500s.** The Prisma schema does not have `tenantId` on `WorkerProfile` (workers are platform-level per project model). The query in [services/api/src/employer/jobs/match-preview.ts:39](services/api/src/employer/jobs/match-preview.ts#L39) and [services/api/src/employer/workers/routes.ts:36-37, 140](services/api/src/employer/workers/routes.ts#L36) hits Prisma `PrismaClientValidationError: Unknown argument 'tenantId'`. Result: **`/v1/employer/jobs/match-preview` returns 500 every call** (and the same will happen on the `/v1/employer/workers` and `/v1/employer/workers/[id]` routes when seeded). Fix: drop `tenantId` from the workers `where` clauses; rely on `county` + `onboardedAt` for the platform-level worker scope. (This was a pass-01 finding under "Tenant separation" — now confirmed as a runtime 500.)
- **[blocker, repeated] Database migrations sitting in `packages/db/scripts/*.ts` are not run automatically.** This pass discovered TWO undrained scripts (evidence columns + `compliance_item_content` table). The pass-01 doc has the full ask: either fold these into `prisma migrate` or add CI that runs them.

### Confirmed UX blockers

- **[blocker] `Create shift` button does nothing.** No request, no error, no state change.
- **[blocker] Disband redirects nowhere.** User stranded on a now-deleted record.
- **[high] Photo upload on JobForm requires saving the draft first**, but the disabled state of the empty-slot button is barely distinguishable. Compounded by the create-then-redirect-to-list bug, the user has to re-enter the new draft to attach photos.
- **[high] Publish flow accepts `$0/hr` postings.** Server-side validation must reject empty wage on publish.
- **[high] Help topic cards aren't links.** They look like links and don't act like links.

### Architecture / convention follow-ups

- **[arch] Modals everywhere are hand-rolled** (Compliance evidence, New thread, New broadcast, New pay period, Disband confirm strip). All should adopt daisyUI `<dialog className="modal">` pattern for keyboard / ARIA.
- **[arch] All confirmation dialogs lack a typed-confirmation step** for destructive actions. Disband Crew is one click after Archive — no "type 'archive' to confirm" gate. Same will apply to Cancel posting once that flow exists.

---

## /employer/jobs/[id] — Sections 4-7 + screening Qs (verified employer, edit mode)

### What I exercised
- Section 4 Requirements: clicked WPS cert + Heat illness chips → both visually toggled, worker preview iPhone updated to show pill badges.
- Clicked `+ Custom skill` → **no input field appeared, no modal opened.**
- Section 5 Location: visible (Work site address autocomplete, County select, "Drop a pin" fallback link, map preview).
- Section 6 Crew & application: SMS apply toggle (with `WHC-PH7` keyword), Auto-translate toggle, Screening question pair (EN + ES), `+ Add screening question` button, Foreman/contact dropdown, Application deadline date input.
  - Filled the EN screening question, clicked `+ Add screening question` → **nothing happened.** No second pair appeared.
- Section 7 Compliance: 6 inline rows. Three with green check (Business verified, I-9 verification, H-2A program status). Three pending with `Attest` link.
  - Clicked `Attest` on Heat illness prevention plan → routed to `/employer/compliance` (good — central place for evidence). But it doesn't deep-link to the specific item, so the user has to find it again.
- Footer changed to `Save & don't notify` / `Save & notify crew` buttons because the job is already published — nice touch.

### Findings
- **[blocker] `+ Custom skill` button in Requirements section does not work.** No input, no modal, no state change. There's no way to add a custom skill.
- **[blocker] `+ Add screening question` button does not work.** Form supports only one screening question pair. Clicking the add button is a no-op.
- **[high] Worker preview iPhone shows skill badges with the raw i18n keys** (`wps_cert`, `heat_illness`) instead of the human label (`WPS cert`, `Heat illness`). This is the same preview that's customer-facing — workers will see broken-looking labels. Pull the human-readable label from the same source the chip uses.
- **[medium] `Attest` link routes to `/employer/compliance` (top of page) instead of deep-linking to the specific compliance item.** Append `#item-{id}` and scroll/highlight on load.
- **[low] Footer buttons swap from `Save draft / Publish` to `Save & don't notify / Save & notify crew` once published.** This is the right pattern but undocumented anywhere.

---

## /employer/compliance — `+ New item` modal

### What I exercised
- Click `+ New item` → modal `New compliance item` opens with Category select (Worker documentation default), `What needs to be tracked?` input, Current status select (Needs attention default), Details textarea, Due date input. Cancel/Add item.
- Filled label `Drug-free workplace policy`, kept defaults, clicked `Add item` → `POST /v1/employer/compliance/items` returned **422 with no field highlighted**.

### Findings
- **[high] `New compliance item` returns 422 on what should be a valid submission** (Category + label both filled). The modal shows "Please check the highlighted fields" but no field has an error indicator. Either the schema requires a field that's not in the modal, or the validator rejects the default `status: 'needs_attention'`. Either way: surface the actual error and don't show a red banner with no highlighted field.
- **[arch] Modal still renders the same hand-rolled overlay pattern.**

---

## /employer/payroll — Generate / Export / Approve

### What I exercised
- Clicked `Generate from shifts` → `POST /v1/employer/payroll/periods/{id}/generate-lines` returned **200**. ✓ (No timesheets generated since no shifts exist.)
- Clicked `Export 941 / DE-9` → **no network request fired.** Dead button.
- Clicked `Approve & run payroll` → **no network request fired.** Dead button.

### Findings
- **[blocker] `Export 941 / DE-9` button does nothing.** No request, no download, no error. Highest-impact among the dead actions because it's the export that goes to government filings.
- **[blocker] `Approve & run payroll` button does nothing.** No request, no confirmation modal, no state change. Cannot approve payroll through the UI.
- **[medium] `Generate from shifts` returned 200 with no timesheets** because there are no shifts. No toast or empty-state confirmation. The user doesn't know whether the action succeeded or failed silently. Add a toast: "No shifts to generate from".

---

## /employer/billing — yearly toggle

### What I exercised
- Clicked `yearly` toggle on Pro plan card.

### Findings
- **[medium] Yearly toggle visually flips state but the displayed price does not update.** The headline still reads `$99 / month` while the small inline text still reads `or $990/yr`. Toggle should swap the headline to `$990 / year` (or `$82.50 / month` annualized).
- **[medium] After clicking, neither monthly nor yearly is highlighted.** The toggle ends up in a tri-state (both unselected) instead of mutually exclusive.

---

## /employer/inbox — Filters + Bulk message

### What I exercised
- Clicked `Filters` → dropdown opens with Search by name/skill, Job posting select, County select, Clear/Apply.
- Clicked `Bulk message` → routed to `/employer/messages?folder=broadcasts` (selected the Broadcasts folder).

### Findings
- **[medium] `Bulk message` is not a modal.** It's a navigation to the broadcasts folder of /messages. Reasonable, but the entry point is labeled "Bulk message" suggesting an action — rename to "Open broadcasts" or "Send broadcast" so the destination is clear.
- **[low] Filters dropdown** uses a hand-rolled positioned panel — should be daisyUI `dropdown` + `dropdown-content` with `details/summary`.

---

## Help cards — re-test

I incorrectly flagged `Post a job` as broken in pass-01 / earlier in pass-02. **Correction: cards are real `<a>` links and they do navigate.** Confirmed via JS click:
- `Post a job` → `/employer/jobs/new` ✓
- `Review applicants` → `/employer/inbox` ✓
- (others have valid relative hrefs visible in the DOM)

Earlier failure was a click-target issue (mid-page click landing on the icon decoration rather than the anchor). The cards render the entire surface as the link, so this should not happen at the user level — but worth confirming in a real browser session.

**Remaining help findings:** none beyond pass-01.

---

## Crew editor — Save flow (resurrected disbanded crew)

### What I exercised
- Filled Notes, set Base wage to `$21/hr`, picked a different schedule color (Tomato), toggled Group chat + Daily SMS digest ON.
- Clicked `Save crew` → `PATCH /v1/employer/crews/{id}` returned **200**. ✓
- Right-rail crew tile re-rendered in the new color. ✓
- Right-rail Activity log: `Crew archived (1m)`, `Crew created (60m)` — does not log the resurrection or the recent edit.

### Findings
- **[medium] Footer banner stays at "Changes ready to save"** after a successful save instead of flipping to a "Saved · just now" state. Same lying-completeness pattern but on the success side.
- **[low] Activity log records archive but not subsequent edits.** Pay defaults edit + Communication edit + color change should each be a log entry; none appeared.
- **[low] Activity timestamps are relative ("1m", "60m")** — needs absolute on hover.

---

## ES locale — extended walkthrough

Spot-checked `/es/employer/payroll`, `/es/employer/profile`, `/es/employer/help`. ES translations render across the page chrome and primary controls. New issues found:

- **[high] `Approve & run payroll` button mistranslates to `Aprobado` (past tense, "Approved")** in ES. Should be `Aprobar y ejecutar nómina` (imperative). Currently the button label implies the run already happened.
- **[medium] `OT` column header in payroll table** stays in EN. Should be `HE` (Horas Extras) in ES.
- **[medium] Payroll eyebrow `PERIODO · 4 MAY - 10 MAY`** uses EN-style abbreviated months. ES-style would be `PERIODO · 4 - 10 DE MAYO` (or at least `4 MAY - 10 MAY` rendered in lowercase Spanish convention).
- **[low] `/es/employer/profile` looks correct** end to end (form labels, helper text, right-rail eyebrows, save CTA).
- **[low] `/es/employer/help` looks correct** — every topic card and the support CTA are translated.

---

## Sidebar nav — confirm wiring

All 11 sidebar nav items render `<a href="/en/employer/...">` (or `/es/...`) with valid relative paths. Sample tested in this pass: Dashboard, Job postings, Candidates, Crews & shifts, Payroll, Compliance, Messages, Reports, Billing, Business profile, plus Find workers (Pro upsell). Active state highlights correctly via `pathname.startsWith()` matching.

No new findings beyond pass-01 (active-state derivation is `startsWith` so subroutes correctly highlight their parent).

---

## Round-3 deep dives

### /employer/account — Clerk UserProfile (EN + ES)

#### What I exercised
- `Update profile` button — opens inline form, fields prefill `firstName="Brandon"` / `lastName="Grain1"`. ✓
- `Add email address` — opens inline form with verification copy ("You'll need to verify this email address before it can be added to your account."). ✓
- `Add phone number` — opens inline form with country selector (US +1) and SMS verification copy. ✓
- `Connect account` — exposes `Google` only (no Apple, no Microsoft, no LinkedIn).
- `Security` tab navigates to `/employer/account/security`. Surface: Update password / Add two-step verification / Active devices / Delete account.

#### Findings
- **[blocker] The whole account surface is bare Clerk UserProfile chrome** wrapped in our shell. None of it is themed Tierra. Mixed pixel grid (Inter inside, but Clerk component spacing/colors/borders), an "Account · Manage your account info" eyebrow that the user never wrote, "Secured by · Development mode" footer leaking environment state to the user, and `Profile`/`Security` sub-tabs that look unrelated to the rest of the app. Already noted in the user-feedback memory — record explicitly here as a launch blocker for the employer surface.
- **[blocker] Clerk UserProfile is not localized to ES at all.** On `/es/employer/account`, the outer page chrome ("Cuenta y seguridad", "Tu cuenta.") is correctly translated, but every Clerk string inside the iframe-equivalent is EN: `Account`, `Manage your account info`, `Profile`, `Security`, `Profile details`, `Update profile`, `Add email address`, `Email addresses`, `Add phone number`, `Phone numbers`, `Connect account`, `Connected accounts`, `Secured by`, `Development mode`. Need to either localize the Clerk UserProfile via Clerk's `localization` prop (set per request locale) or, preferably, replace it with the custom Tierra profile screen referenced above.
- **[medium] Active devices section leaks raw IPv6 addresses** — `2601:201:8c82:9430:c5a4:349b:79c2:e0d0 (Fresno, US)` displayed verbatim. That's standard Clerk UI but it's privacy-leaky on a shared device. Replace with the city/state/last-seen line only.
- **[medium] `Connect account` only offers Google.** No Apple or Microsoft. For employers (FLCs, Office 365 shops) Microsoft is a meaningful gap. Configure Microsoft + Apple in Clerk dashboard, or remove the section entirely until we decide on a strategy.
- **[low] Security `Update password`** opens an inline change-password form with current/new/confirm. Standard Clerk. No app-specific concerns.
- **[low] `Delete account`** — exists, opens confirmation. Did not exercise (would orphan the FLC).

### /employer/compliance — Schedule action + 25 MB upload (EN)

#### What I exercised
- Clicked `Schedule` on the W-4s collected card → opens daisyUI dialog: title, body, Evidence (URL input + paperclip → file picker), Note textarea, "Mark item resolved" checkbox, Cancel + Save action. ✓
- File-too-big check: built a 30 MiB Blob, set as the file input's selected file, dispatched `change` → modal renders inline error `File is too large. Max 25 MB.` ✓
- Valid 67 B PNG → modal flips file row to `evidence.png · 67 B · View · Replace`. ✓
- Typed a note, clicked `Save action` → `PATCH /v1/employer/compliance/items/{id}` returns 200, dialog closes, list refreshes (RSC re-render). ✓

#### Findings
- **[high] Evidence URL input has no label or hint.** Markup: `<input type="url" placeholder="https://…" name="evidenceUrl">` with a paperclip-icon button beside it. There is no `<legend>` or label saying "Add a link to the document or upload a file." A user landing on the modal will see a placeholder URL field with no context, then below it the "Upload a file · PDF, JPG, PNG up to 25 MB" line which suggests file-only. Add a fieldset legend `Evidence` and a help row that names both options ("Paste a link or upload a file. PDF, JPG, PNG up to 25 MB. Stored privately.").
- **[medium] Save action does not POST the file body anywhere.** Only request observed was the PATCH on the item itself; no `/upload`, no `/evidence`. The `evidenceStorageKey` PATCH payload appears to assume the file was uploaded earlier via a different path that I did not trigger. Either the dialog is wired to upload on `change` (and the test's synthetic File didn't fire that path), or the upload handler is not wired and the file is silently dropped. **Verify in code** before claiming compliance evidence is end-to-end working — at minimum the dialog needs to either upload-on-pick (with progress) or include the file in the PATCH multipart body.
- **[medium] `No additional guidance for this item yet. Add a note or evidence URL based on your own records.`** is shown on every item that lacks per-item guidance content. The phrasing implies the item is unfinished from the platform side. Either ship per-item guidance for the seeded set (W-4s, NOI, PUR, COVID-19 plan, heat illness, WPS, OT calcs) or rephrase to something neutral like "Attach the document or paste a link to the record on file."
- **[low] Modal lacks a visible `×` close button** in the top-right; `Cancel` (bottom-left) is the only close. Add the daisyUI `modal-close` `×` for parity with other dialogs in the app.

### /employer/jobs/{id} — header actions (EN)

#### What I exercised
- `Duplicate posting` link from the `/jobs` index card → navigates to `/employer/jobs/new?from={sourceId}` and the form loads the source job's EN+ES title, EN+ES description, headcount, schedule, requirements (WPS cert, etc.), age limit. Crop, address, and dates are reset. ✓
- `Save & notify crew` on the edit page → `PATCH /v1/employer/jobs/{id}` (200) + `PUT .../screening-questions` (200), redirects to `/employer/jobs`. ✓
- `Save & don't notify` — not separately exercised this round; assumed identical PATCH minus the notify flag.

#### Findings
- **[blocker] Header `Duplicate` and `Close` buttons on `/employer/jobs/{id}` are dead.** [components/employer/JobForm.tsx:450-462](apps/web/src/components/employer/JobForm.tsx#L450-L462) renders both as `<button type="button">` with no `onClick` handler. Clicking fires no events, no fetches, no DOM changes; pointerdown/pointerup/click sequence still does nothing. The same labels work fine when reached through the `/jobs` list ellipsis menu. Wire `Duplicate` to push `/employer/jobs/new?from={id}` and `Close` to a confirm modal that PATCHes status → `closed`. Until then the buttons are visual decoration on a destructive surface.
- **[medium] No status-transition affordance** anywhere on the edit page beyond the (dead) `Close` button. There is no `Pause renotifications`, no `Republish`, no `Re-open closed posting`. The job lifecycle has more states than the UI exposes.
- **[low] No diff preview on `Save & notify crew`.** Clicking it fires immediately. Workers will receive an SMS/push regardless of whether the change is meaningful (typo fix vs. pay-rate change). Add a confirmation summarizing what changed before notifying.

### Sidebar / user-menu — language toggle

#### What I exercised
- Opened user-menu → entry reads `Idioma · ES → EN` (or `Language · EN → ES`).
- The toggle is an `<a href="/en/employer/dashboard">` (path-aware, preserves the current page). Click → URL flips to the other locale on the same path. ✓
- Tested from `/es/employer/dashboard` → `/en/employer/dashboard` ✓
- Tested from `/es/employer/account` → `/en/employer/account` ✓

#### Findings
- **[low] Toggle uses arrow-only label `ES → EN`** with no flag or full-language indicator. Adequate for the current bilingual model but easy to miss. Consider rendering both languages with the inactive one dimmed (e.g. `Español · English`).
- **[low] Locale toggle does not preserve query string.** `/es/employer/jobs?status=open` flips to `/en/employer/jobs` without `?status=open`. Low impact for now (no deep-link state on most pages) but worth fixing before launch — workers and employers do bookmark filtered lists.

### /es/employer/reports — translation gaps

#### What I exercised
- Loaded `/es/employer/reports` → page chrome is fully translated (`Reportes de contratación`, `Pulso operacional`, `Esta temporada`, etc.).

#### Findings
- **[high] KPI cards are mixed EN/ES.** Visible EN strings on a Spanish surface: `Hires this season`, `0 job postings`, `Avg time-to-fill`, `from publish to last hire`, `Cost per hire`, `incl. SMS, broadcast`, `30-day worker retention`. Add ES keys for each KPI label and helper line. Until launched, this is the single most visible "we forgot Spanish" area for funder demos.
- **[medium] Job-type breakdown rows leave `Almond harvest crew` / `Walnut harvest crew` in EN.** Those are job titles from the `jobs` table — they're user-authored EN copy. Acceptable that the title is not auto-translated, but the surrounding labels (`0 applied · 0 hired`, `0% filled`) need ES.

### /es/employer/crews — translation gaps

- Surface translates (`Cuadrillas y turnos`, `1 cuadrilla`, `Exportar horario`, `Nueva cuadrilla`, `Nuevo turno`).
- **[low] Day initials `LUN MAR MIÉ JUE VIE SÁB DOM`** correctly localized.
- **[low] `Crew A · Almonds`** — DB-stored crew name + crop. Crew name is user-authored (acceptable); `Almonds` is a system enum and should map through the i18n layer to `Almendras`.

### /es/employer/messages — clean

Page renders fully in ES (`Buzón`, `Mensajes · 0 sin leer`, `SMS, WhatsApp y en-app · traducción automática EN ⇄ ES`, `Nuevo hilo`, `Nuevo broadcast`, sidebar folders, `Plantillas`, `Carpeta vacía.`, `No hay hilo seleccionado.`). No new findings.

### /es/employer/billing — clean

Plan tiles, toggle (`mensual` / `anual`), CTA (`Mejorar a Pro`), and the unavailable-yet helper (`La facturación aún no está disponible — contacta a soporte.`) all translated. The yearly-toggle bug from earlier rounds (price doesn't update) still applies in ES.


