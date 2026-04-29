# 02 — Auth: Edge Cases & Risks

## Clerk → DB drift

The mirror approach trades a remote round trip for the risk of staying out of sync.

**Sources of drift:**

- Webhook lost (Clerk retries 5× over 24h; if all fail, the row stays stale).
- Webhook processed but the DB write rolled back due to a downstream error.
- Manual edits to Clerk Dashboard while the API service is down.

**Mitigations:**

- Nightly reconciliation job (`pg-boss` cron `auth-reconcile`) iterates Clerk users and ensures `users` row exists with correct mirror fields. Discrepancies logged + auto-corrected.
- `auth_events.status = 'failed'` rows surface in admin dashboard.
- On every `/v1/me` request, lazily refresh the mirror if the JWT `iat` is newer than `users.updatedAt` (cheap stale check).

## Clerk session vs. our tenant disabled

A user's Clerk session is valid (Clerk doesn't know about our tenant), but our tenant is soft-deleted. Behavior: `tenantMiddleware` returns `403 tenant_disabled`. The Clerk session itself remains valid. To actively log them out, the admin must call `clerkClient.sessions.revoke()` on the user's sessions when soft-deleting a tenant. Add to the soft-delete admin action.

## Role escalation race

A user is granted `admin` role in Clerk. Their existing JWT still has `role: 'employer'` until the next refresh.

**Behavior:** middleware reads role from Clerk `sessionClaims.publicMetadata.role`, which is set at JWT issue time. The user must refresh their session to get the new role. Workaround: `clerkClient.users.updateUser()` followed by `clerkClient.sessions.revoke()` forces re-auth. The admin role-grant tool does this automatically.

> **Inferred:** Don't trust the JWT role for security-critical writes. Re-validate role from `users.role` (the mirror) inside any admin endpoint that modifies billing, deletes users, or changes tenant settings. Slow path but safe.

## Webhook replay attacks

An attacker captures a Clerk webhook payload and replays it. Defense:

- Svix signature includes a timestamp; reject events older than 5 minutes.
- Insert into `auth_events` with `(svix_id)` as a unique key; duplicates `INSERT ... ON CONFLICT DO NOTHING` and return 200 immediately.

## Phone number changes

A worker changes their phone number in Clerk:

1. `user.updated` webhook fires.
2. `handleUserUpdated` updates `users.phone` and recomputes `users.phoneHash`.
3. `applications` and `enrollments` are unaffected (they reference `users.id`, not phone).
4. SMS templates use `users.phone`, so the next send uses the new number.

## Email changes for employers

Magic-link email change is a security-sensitive action. Clerk requires verification of the new email before applying. We trust Clerk's verification — `user.updated` webhook only fires after the new email is verified.

## Rate limits

Clerk's free tier has 10 req/sec/user limits on the user API. Mitigations:

- Mirror everything in our DB; never read from Clerk at request time except in the webhook handler.
- Bulk operations (e.g., admin re-syncs 1000 users) use Clerk's bulk endpoints + back off on 429.

## Lost session in middle of onboarding

User completes phone OTP, starts profile editing, session expires (default 7 days but mid-flow loss possible if browser cleared cookies).

**Behavior:** Next request → `401`. UI catches this → redirect to `/sign-in` with banner "Sign in again to continue where you left off." After re-auth, `POST /v1/onboarding/start` returns the correct `next_step`.

## Admin sign-in compromise

If an admin account is compromised, the entire system is exposed.

**Mitigations:**

- TOTP required for `role === 'admin'`.
- Admin actions log to `auth_events` with full payload.
- Quarterly admin access review (out of band — not a code feature).
- Critical admin endpoints (delete tenant, refund billing) require a second admin's approval — out of scope for MVP, but the architecture must not preclude it (don't bake "single admin" assumptions into permission code).

## Magic-link phishing

Magic-link emails can be intercepted or phished.

**Mitigations:**

- Magic links expire in 15 minutes (Clerk default).
- Magic links are single-use.
- Clerk binds the link to the originating browser fingerprint when possible.
- Email content includes "If you didn't request this, ignore this message" disclaimer in EN/ES.

## Open questions

1. Should admin use SAML SSO with Microsoft Entra ID instead of magic link? Out of scope for MVP but recommended before scale-out.
2. Step-up auth for billing actions — should employers re-verify identity before changing plan? Probably yes; not implemented in MVP.
3. Account recovery if a worker loses their phone number — currently requires support ticket. Self-serve recovery is risky for SMS OTP only.
