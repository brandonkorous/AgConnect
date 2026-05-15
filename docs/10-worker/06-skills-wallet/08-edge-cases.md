# 06 — Skills Wallet: Edge Cases & Risks

## Cert revoked / removed

Org admin manually flags a cert as revoked (data correction).

**Mitigation:**

- Revocation flag on `enrollments.cert_revoked` (boolean) — not in MVP schema; add when needed.
- Revoked certs hidden from wallet but PDF stays in Blob (audit).
- For MVP, treat revocation as soft-delete the enrollment (not ideal — loses grant data). Confirm policy with grantee orgs before launch.

> **Inferred:** Revocation is uncommon in workforce training; defer until first incident.

## Signed URL expired during share

Worker shares a link, recipient opens it 25 hours later. Signed URL expired.

**Mitigation:**

- The shared URL is the platform URL (`agconn.com/wallet/cert/<id>`), not the raw signed Blob URL.
- The recipient sees a "Sign in to view" page (privacy-first) OR is redirected to `/verify/<certId>` (Phase 2).
- For MVP, sharing is platform-internal — recipient must be a worker on the platform with appropriate permissions.

## Self-reported cert in wallet without provenance

Worker manually adds "Tractor Safety — issued 2020" with no proof. Appears in wallet labeled "Self-reported".

**Behavior:** that's the design. Employers seeing the worker's profile know to distinguish "AGCONN verified" (we issued) from "Self-reported" (worker claims). Trust calibration is the employer's call.

## Long cert lists

A worker with 30+ trainings has a long wallet.

**Mitigation:**

- Sort by date descending so recent certs are top.
- Pagination at 50 (vanishingly rare in MVP).

## Duplicate certs from re-enrollment

Worker enrolls in a program, gets cert, enrolls again later, gets a second cert.

**Behavior:** both certs appear. They're different `enrollmentId`s with different `certificateId`s. This is correct — the worker took the program twice.

## Mobile share API quirks

`navigator.share` throws on desktop browsers; iOS Safari blocks share without user gesture; some Android browsers don't support files-share.

**Mitigation:**

- Feature-detect `navigator.share`; show fallback dropdown otherwise.
- For file sharing (PDF attachment), fall back to download-then-share-from-files-app (system share).
- Test on iOS Safari, Chrome iOS, Chrome Android, Samsung Internet, Firefox Android.

## Verify page abuse (Phase 2)

Once `/verify/<id>` is public, scrapers may enumerate cert IDs.

**Mitigation:**

- Cert IDs are 6-char hex with year prefix — ~16M space per year, hard to brute-force in bulk.
- Rate limit `/verify/*` to 60 req/min/IP.
- Verify page shows minimal data (first name + last initial); no contact info, no exact location.

## Privacy: cert PDF includes full name

The PDF shows the worker's full name. If a worker shares the link, anyone with access sees their full name.

**Mitigation:**

- Default sharing is platform-internal (sign-in required).
- Public verify page (Phase 2) shows redacted name.
- Worker can request name redaction (admin-mediated in MVP) — uncommon need.

## Employer access to worker certs

Employers see certs as part of the application review. They get the same signed-URL access.

**Mitigation:**

- Employer endpoint `/v1/employer/applications/:id` includes a redacted view of the worker's wallet.
- Signed URLs scoped to the employer's session (not transferable).

## Cross-tenant cert visibility

A worker who moves tenants — should their previous tenant's certs follow?

**Decision (MVP):** No. Each tenant has its own cert namespace. The worker re-enrolls in the new tenant's programs.

Phase 2: portable cert IDs at the AGCONN level, regardless of tenant. Out of scope.

## Cert PDF deletion

If the underlying object is deleted (storage cleanup, accidental), the wallet shows the cert metadata but Download fails.

**Mitigation:**

- Supabase Storage object versioning protects against accidents (recover the prior version).
- API checks object existence; if missing, surface "Cert PDF not available — contact support" instead of a broken download.

## Open questions

1. Public verification page — do partner orgs need it before launch? Test with one stakeholder before committing scope.
2. Cert revocation — what's the policy? Confirm with at least one CDFA contact.
3. Federated certs (AGCONN cert recognized by other workforce platforms) — is there an industry standard (Open Badges, BadgeCert)? Worth investigating Phase 3.
4. Self-reported cert verification — should we offer "request verification" flow? Out of scope for MVP.
