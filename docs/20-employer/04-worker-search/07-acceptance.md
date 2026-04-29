# 04 — Worker Search: Acceptance Criteria

## Functional

- [ ] Free-plan employers cannot access search (`402 plan_required_pro`).
- [ ] Pro-plan employers can search.
- [ ] Search response NEVER includes phone, email, last name (full), or exact zip — only first name + last initial + county.
- [ ] Filters (county, skills, certs, availability, q) combine correctly.
- [ ] `matchScore` reflects intersection of `wp.skills` and the search `skills` filter.
- [ ] Cert filter requires `enrollments.status = 'completed'` for matching topics.
- [ ] Workers without `onboardedAt` excluded from results.
- [ ] Employer can invite a worker to a specific posting; SMS arrives in worker's `preferredLang` within 5 min.
- [ ] Duplicate invite to the same `(employer, worker, job)` rejected (409).
- [ ] Worker can accept (creates application) or decline.
- [ ] After acceptance, contact info follows the standard application visibility rules.
- [ ] Search log row written for every search (anonymized analytics).

## Non-functional

- [ ] Search P95 < 300ms with 10k workers.
- [ ] Invite flow happy-path P95 < 500ms.

## Privacy

- [ ] No phone / email / lastName / zip in any search response or worker preview pre-application.
- [ ] Defensive: render-time PII assertions in UI components throw if PII fields are present.
- [ ] Workers' availability JSON is OK (not PII).
- [ ] Search log access restricted to admin (RLS).

## Test scenarios

### Unit

1. `WorkerCardSchema` rejects unknown / sensitive fields (`.strict()`).
2. Plan gate: Free employer call → 402; Pro employer call → 200.
3. Match score: with `skills: [a, b, c]` filter, worker with skills `[b, c, d]` returns matchScore = 2.

### Integration

1. **Search returns redacted cards:** verify response payload contains no `phone` / `email` / `lastName` / `zip`.
2. **Invite happy path:** invite → `worker_invitations` row → SMS in `sms_log` → worker accepts → `applications` row created.
3. **Already applied:** invite a worker who already applied → 409 `already_applied`.
4. **Cross-tenant:** Tenant 1 employer cannot see Tenant 2 workers.

### E2E

1. Pro employer searches Fresno + Tractor Operation → finds Maria → previews → invites to "Strawberry Picker" posting.
2. Maria receives SMS, taps link, accepts → application appears in employer's inbox.
3. Free employer visiting `/employer/workers` sees plan gate.

## Definition of done

- All redaction defenses tested.
- Search log rate alerts: > 100 searches/day per employer triggers Sentry warning (potential abuse).
- Admin runbook: how to investigate a worker complaint about being contacted.
- Privacy review: signed off on PII surface area.
