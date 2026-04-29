# 02 — Resume Editor: Acceptance Criteria

## Functional

- [ ] Worker can edit any field on contact, experience, education, skills, certifications, availability, languages.
- [ ] Edits autosave on field blur (debounced 500ms).
- [ ] Save status pill reflects: idle / saving / saved / error / offline.
- [ ] Adding an experience/education/cert via API or UI returns the new index; deleting compacts the array (no holes).
- [ ] Re-upload requires explicit confirmation; on cancel, no DB change.
- [ ] Re-upload triggers parser; UI polls `/v1/profile/resume/status`; result populates `resume` field.
- [ ] Re-upload preserves the previous Blob path as backup (audit trail).
- [ ] Preview-as-employer hides phone, email, exact zip; shows first name + last initial only.
- [ ] Workers with `onboardedAt = null` redirect to onboarding when accessing `/profile`.
- [ ] Concurrent edits from two tabs: server returns `409 conflict` when client's `updatedAt` is stale; UI prompts refresh.

## Non-functional

- [ ] Autosave latency < 500ms after blur.
- [ ] Editor first paint < 1.5s on mobile 4G.
- [ ] Editor works offline: edits queue locally and flush within 5s of reconnection.
- [ ] No layout shift when entering / exiting inline edit mode.

## Test scenarios

### Unit

1. PATCH endpoint validates against `PatchProfileBody` Zod schema; rejects unknown keys (`.strict()`).
2. `experience/:index` PATCH on out-of-range index returns 404.
3. Preview-as-employer redacts phone, email, zip.

### Integration

1. **Edit & save:** PATCH name + skill → GET returns updated values, `updatedAt` advanced.
2. **Re-upload overwrite:** upload new resume → parse → existing `resume.experience` replaced; `resume_raw_url` updated.
3. **Conflict detection:** two clients PATCH simultaneously → second client sees `409 conflict`.
4. **RLS:** worker A cannot PATCH worker B's profile (request 403).

### E2E (Playwright)

1. Open `/profile`, edit first name, blur, refresh — name persists.
2. Add experience via UI, populate fields, blur — appears in preview-as-employer.
3. Switch language mid-edit — labels and save status update; in-progress edits preserved.
4. Trigger save error (server 500) → status pill shows error → retry succeeds.

## Definition of done

- All add/edit/remove paths covered by tests.
- Visual regression test fixtures captured for empty editor, fully-populated editor, edit-mode, preview-mode (EN + ES).
- a11y check: Lighthouse a11y ≥ 95 on `/profile`.
- Sentry tags every save failure with `field` for diagnosis.
