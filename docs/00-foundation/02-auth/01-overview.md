# 02 — Auth: Overview

## Purpose

All authentication for AGCONN runs through Clerk. The choice is recorded in kickoff ADR-003: Clerk's multi-tenant Organization model maps directly to AGCONN's tenant + employer structure, the SMS OTP flow is purpose-built for low-friction phone signup, and the role/metadata system gives us per-user RBAC without building auth infrastructure.

## Auth flows by role

- **Worker** — Phone + SMS OTP via Clerk hosted UI. No email, no password. Phone is verified at signup; subsequent sign-ins re-OTP.
- **Employer / Training Org** — Email + magic link via Clerk hosted UI (Clerk delivers the link via Resend, configured in Clerk Dashboard). Each employer/training-org account is a member of a Clerk Organization that represents either their business or the AGCONN tenant they belong to.
- **Admin** — Email + magic link via Clerk, plus a hardware-token TOTP second factor (enforced at the Clerk policy level for any user with `publicMetadata.role === 'admin'`).

## Tenancy mapping

- A Clerk **Organization** maps to either:
    - a **Tenant** (regional deployment, e.g., Central Valley), or
    - an **Employer** within a tenant (with `clerkOrgId` on the `employer_profiles` table).
- The middleware ([01-multi-tenancy/03-api.md](../01-multi-tenancy/03-api.md)) resolves `tenantId` from the Clerk org. Workers don't have an org; their `tenantId` lives in our `users` table and is set at onboarding.

## What lives where

| concern                                                | location                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------- |
| Identity (userId, phone, email, password-less factors) | Clerk                                                                     |
| Role                                                   | Clerk `publicMetadata.role` (mirrored to `users.role`)                    |
| Preferred language                                     | Clerk `publicMetadata.preferred_lang` (mirrored to `users.preferredLang`) |
| Tenant binding                                         | Clerk Organization (employers) or `users.tenant_id` (workers)             |
| Profile data (skills, county, etc.)                    | Our DB only — never Clerk                                                 |
| Session JWT validation                                 | Hono middleware via `@clerk/hono`                                         |

> **Inferred:** Mirror Clerk metadata into our DB rather than reading Clerk in every request. Clerk has rate limits and the round trip costs latency. The mirror is updated by webhook on every Clerk change. Drift is a known risk — see [08-edge-cases.md](08-edge-cases.md).

## Scope

In scope:

- Clerk SMS OTP (workers) and magic link (employers, training orgs, admins)
- Clerk Organizations → tenants and employers
- Webhook sync from Clerk to `users` and `employer_profiles`
- Hono middleware that validates JWT and exposes `userId`, `tenantId`, `userRole` on context
- Role-based authorization: `requireRole('admin')`, `requireRole(['employer', 'admin'])`
- Sign-out everywhere on suspicious activity

Out of scope:

- Self-service password reset (no passwords)
- Federated SSO (post-MVP)
- WebAuthn (post-MVP)
- Cross-tenant role granting (post-MVP)

## Success criteria

- A new worker can sign up and sign in using only a phone number, in either language, in under 60 seconds.
- A new employer can sign up via magic link and reach the dashboard within 90 seconds.
- 100% of API requests under `/v1/*` and `/admin/v1/*` are authenticated; unauthenticated requests get `401`.
- Clerk → DB sync lag P95 < 5 seconds.

## Dependencies

- Clerk account, with: SMS OTP enabled, Resend integration for magic links, Webhooks endpoint pointing to `api.agconn.com/webhooks/clerk`.
- [01-multi-tenancy](../01-multi-tenancy/) — tenantMiddleware uses Clerk org metadata.
- [06-email-pipeline](../06-email-pipeline/) — Resend for magic link delivery.
