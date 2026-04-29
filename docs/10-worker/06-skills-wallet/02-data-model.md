# 06 — Skills Wallet: Data Model

This feature is read-only over existing tables.

## Sources

The wallet aggregates two sources:

1. **Earned certs** — `enrollments` rows where `status = 'completed'` and `cert_url` is set. Each yields one cert with: program title (EN+ES), funder, completion date, cert URL, certificate ID.
2. **Manually-entered certs** — entries in `worker_profiles.certifications` (JSONB array). Each has: name, issuer, issued_at, expires_at. No PDF associated by default.

## Unified view shape

API combines both into a single response:

```ts
const WalletItemSchema = z.discriminatedUnion('source', [
    z.object({
        source: z.literal('enrollment'),
        id: z.string().uuid(), // enrollment id
        certificateId: z.string(),
        programTitleEn: z.string(),
        programTitleEs: z.string(),
        funder: FunderEnum,
        orgName: z.string(),
        completedAt: z.string().date(),
        certUrl: z.string(), // signed URL valid for 24h
        issuedAt: z.string().date(), // alias of completedAt
        expiresAt: z.string().date().nullable(),
    }),
    z.object({
        source: z.literal('manual'),
        id: z.string(), // generated client-side or stable hash
        name: z.string(),
        issuer: z.string().nullable(),
        issuedAt: z.string().date().nullable(),
        expiresAt: z.string().date().nullable(),
    }),
]);
```

## Indexes

No new indexes — relies on existing `enrollments(workerId, status)` and `worker_profiles` lookup.

## RLS

Wallet endpoint reads enrollments + worker profile via the worker's own session; standard self-only policies apply.

## Sharing

Phase 1 (MVP): "Share" button copies a link to the platform's worker-cert page (e.g., `agconn.com/wallet/cert/<id>`), which when opened either:

- Shows the cert PDF directly if the link includes a valid signed token, OR
- Shows a "Sign in to view" page (preferred for privacy — no public certs).

Phase 2: public `/verify/<certificateId>` endpoint that shows non-PII metadata (worker first name + last initial, program, completion date, org) suitable for sharing with employers outside the platform.

> **Inferred:** Default to private sharing for MVP. Public sharing introduces verification UX and privacy questions that aren't ready for launch.
