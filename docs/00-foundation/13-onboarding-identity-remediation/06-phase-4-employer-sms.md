# Phase 4 — Employer SMS

Severity: P1, lowest priority. Last. Deliberately minimal.

Employers are email-first and onboard through the gated web reference path
(`employer/(shell)/layout.tsx:28-44` → `POST /v1/employer/onboarding` atomic
bootstrap). There is **no employer SMS onboarding wizard**.

## Tasks

- **Reuse the keystone.** Employer phone consent-capture parity via the Phase 1
  `ensureClerkUserByPhone` primitive — no employer-specific identity path.
- **STOP handling** for employer-associated numbers, consistent with worker opt-out
  semantics.
- Expand only if employer SMS demand materializes; otherwise stop here.

## Done when

An employer phone can be consent-captured and STOP-handled via the shared primitive,
with no new employer identity or onboarding surface introduced.
