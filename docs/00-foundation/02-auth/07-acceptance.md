# 02 — Auth: Acceptance Criteria

## Functional

- [ ] Worker can sign up with phone + SMS OTP only — no email, no password.
- [ ] Employer / training-org / admin can sign up with email + magic link only — no password.
- [ ] Admin sign-in requires TOTP second factor (enforced via Clerk policy on `role === 'admin'`).
- [ ] All `/v1/*` routes return `401 unauthenticated` for requests without a valid Clerk session.
- [ ] All `/admin/v1/*` routes return `403 wrong_role` for non-admin authenticated requests.
- [ ] `requireRole(['employer', 'admin'])` permits both roles and rejects others with `403`.
- [ ] `GET /v1/me` returns the canonical mirror of the current Clerk user.
- [ ] Updating `users.preferredLang` via `POST /v1/me/lang` propagates to Clerk `publicMetadata` within 1s.
- [ ] Clerk webhook `user.created` produces a `users` row with correct `tenantId` and `role`.
- [ ] Clerk webhook `user.deleted` soft-deletes the `users` row and revokes all sessions.
- [ ] Clerk webhook signature failures return `401 invalid_signature`; the event is NOT recorded as processed.
- [ ] Duplicate webhooks (same Svix `id`) are idempotent — no double-processing, no errors.

## Non-functional

- [ ] Webhook lag (Clerk event → `auth_events.processed_at`) P95 < 5s.
- [ ] Auth middleware overhead per request < 10ms (excluding DB query for tenant lookup).
- [ ] Sign-up to "first authenticated request" P95 < 60s for workers, < 90s for employers.
- [ ] Webhook handler throughput ≥ 100 events/sec on a single API pod.

## Test scenarios

### Unit

1. `requireRole(['admin'])` allows admin, rejects worker/employer/training_org.
2. Webhook signature verification: valid signature passes; tampered body, expired timestamp, or missing header fails.
3. `handleUserCreated` is idempotent: re-running with the same payload produces zero change.

### Integration

1. **Webhook → DB sync:** POST a signed `user.created` payload; assert `users` row exists with correct fields.
2. **Webhook idempotency:** POST the same `user.created` twice; assert exactly one `users` row.
3. **Role gate:** POST to `/admin/v1/tenants` as a worker → `403`; as admin → `200`.
4. **Session expiry:** present a JWT past expiry → `401 unauthenticated`.
5. **Tenant disabled:** soft-delete the user's tenant → next request → `403 tenant_disabled`.

### Manual

1. End-to-end SMS OTP signup as a worker.
2. End-to-end magic-link signup as an employer.
3. Admin TOTP enrollment + sign-in.
4. Trigger Clerk webhook by changing user metadata in Clerk Dashboard; confirm DB updates.

## Definition of done

- All Clerk webhook event types in [03-api.md](03-api.md) have handlers AND tests.
- `auth_events` table populated on every event; failures logged with stack traces in `errorMsg`.
- Sentry tag `event_type` on every webhook breadcrumb for incident triage.
- Clerk Dashboard configured with: SMS OTP enabled, Resend integration for magic link, Webhook endpoint pointing to `api.agconn.com/webhooks/clerk`, `CLERK_WEBHOOK_SECRET` set in Azure Key Vault.
