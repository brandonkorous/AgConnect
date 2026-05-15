# 06 — Skills Wallet: Acceptance Criteria

## Functional

- [ ] Wallet shows all completed enrollments with `cert_url` set as "AGCONN verified" cards.
- [ ] Wallet shows manual certs from `worker_profiles.certifications` as "Self-reported" cards.
- [ ] Tapping an AGCONN cert shows preview + Download + Share.
- [ ] Tapping a self-reported cert shows metadata only (no Download).
- [ ] Cert download opens / saves the PDF (24h-signed URL).
- [ ] Share menu populates EN or ES text per current locale.
- [ ] Workers can only see their own certs (RLS).
- [ ] Wallet updates within 60 seconds of training-org marking completion.

## Non-functional

- [ ] Wallet list P95 < 200ms with 50 certs.
- [ ] Cert PDF preview loads within 2s on mobile 4G.
- [ ] Signed URL expiry is exactly 24h; expired URLs show "Refresh" CTA.

## Test scenarios

### Unit

1. Wallet API merges enrollments and manual certs in date-sorted order.
2. Self-reported entries appear without download button.

### Integration

1. **Cert flow:** worker enrolls → org marks complete → `cert_url` set → wallet API returns cert with valid signed URL.
2. **Cross-tenant isolation:** worker A in Tenant 1 cannot download cert belonging to worker B in Tenant 2.
3. **Manual cert add:** add cert via resume editor → appears in wallet.

### E2E

1. Open wallet → tap cert → preview loads → tap Download → PDF downloads.
2. Open wallet → tap Share → share menu opens → tap WhatsApp → opens with prefilled text.
3. Switch language → wallet text updates; cert title remains EN+ES on PDF (intentional).

## Definition of done

- All RLS scoping verified.
- Mobile Safari + Android Chrome PDF preview tested (Safari often hides embed; fallback link works).
- Sentry tags every cert-download with `enrollmentId` for usage analytics.
