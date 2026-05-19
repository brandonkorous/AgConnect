# Phase 0 — Recon & Decisions (blocking, small)

Severity: P0 · blocks all phases. Goal: resolve the three unknowns whose answers
size and shape Phase 1, plus land the one safe refactor everything else assumes.

## Tasks

### 0.1 Existing `sms_*` User rows — RESOLVED

**Owner confirmed 2026-05-18: there are zero `sms_*` users in production.** No census
needed; the census script was removed. Phase 1's "migration" of legacy stubs is a
**no-op** — it reduces to deleting the `sms_*` code path, with no data migration. See
[03 §1.6](03-phase-1-identity.md).

### 0.2 Clerk Backend API semantics — ACCEPTED ASSUMPTION

Owner decision 2026-05-18: build on these assumptions; address only if an issue
surfaces in implementation. Not a gate.

- `users.createUser` with `phoneNumber` + `unsafeMetadata { role:'worker', locale }`,
  phone marked verified server-side. (Phone-only sign-up is already supported by the
  Clerk instance, so this is expected to work.)
- **Phone-number uniqueness is enforced** per instance — confirmed by owner. This is
  the property that makes ensure-by-phone idempotent and removes the merge algorithm.
- **MAU billing**: treated as a watch-item, not a blocker. If backend-created,
  never-signed-in users turn out to bill as MAU, revisit by making provisioning
  lazier; do not pre-optimize.

### 0.3 Lock the `consentMethod` matrix

| Value | Meaning |
|---|---|
| `sms_double_opt_in` | Texted an opt-in keyword, replied YES. |
| `web_otp` | Worker verified their phone during web sign-up. |
| `null` | Non-worker roles; workers with no phone / pre-consent. |

Update the schema comment at `packages/db/prisma/schema.prisma:493-507` and
`docs/00-foundation/05-sms-pipeline/` to state that `web_otp` is now actually written
(Phase 1), and that `consent != onboarded`.

### 0.4 Centralize E.164 phone normalization

Today `normalizeUsPhone` lives only in
`apps/web/src/components/auth/authShared.ts:3` (web-only; used by
`WorkerSignUpForm`, `EmployerSignUpForm`, `SignInForm`). Phase 1 needs the **same**
normalizer in `services/api` (Twilio webhook) and the Clerk provisioning primitive.

> **Inferred:** home is `packages/schemas` (a leaf package per
> `packages/CLAUDE.md`, depable by `apps/`, `services/`, and other packages). Export
> a pure `normalizeUsPhone(input): string | null` returning strict E.164 (`+1` + 10
> digits). Re-point `authShared.ts` to re-export it so the web call sites are
> unchanged. `packages/sms/src/inbound-number.ts` already has E.164 parsing — align,
> do not duplicate.

## Status

Phase 0 is **complete**.

- 0.1 — RESOLVED (zero `sms_*` users; census removed).
- 0.2 — ACCEPTED ASSUMPTION (phone-uniqueness confirmed; MAU is a watch-item).
- 0.3 — DONE. Consent matrix + `consent != onboarded` invariant written into
  `packages/db/prisma/schema.prisma` (User consent comment).
- 0.4 — DONE. `normalizeUsPhone` + `isUsE164` now live in
  `packages/schemas/src/phone.ts`; `apps/web/.../auth/authShared.ts` re-exports them
  so the three web call sites are unchanged. `packages/auth` will add the
  `@agconn/schemas` dependency when the Phase 1 primitive consumes it.
