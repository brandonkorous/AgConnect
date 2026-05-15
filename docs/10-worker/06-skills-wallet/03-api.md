# 06 — Skills Wallet: API

## GET /v1/wallet

Returns the unified wallet for the current worker.

Response:

```ts
const WalletResponse = z.object({
    items: z.array(WalletItemSchema),
});
```

Server logic:

1. Query `enrollments` where `workerId = me`, `status = 'completed'`, `cert_url IS NOT NULL`.
2. For each, generate a 24h-signed Supabase Storage URL for `cert_url`.
3. Read `worker_profiles.certifications` array.
4. Merge into a single sorted list (newest first by `issuedAt`).

## GET /v1/wallet/cert/:enrollmentId

Returns metadata + 302 to a signed Blob URL for the PDF.

```ts
const CertResponse = z.object({
    certificateId: z.string(),
    programTitleEn: z.string(),
    programTitleEs: z.string(),
    org: z.object({ name: z.string(), email: z.string().nullable() }),
    funder: FunderEnum,
    completedAt: z.string().date(),
    signedUrl: z.string(),
});
```

Or 302 directly to the PDF if `Accept: application/pdf`:

```ts
api.get('/v1/wallet/cert/:enrollmentId', async (c) => {
  const tx = c.get('db');
  const enrollment = await tx.enrollment.findUnique({ where: { id: c.req.param('enrollmentId') }, include: { program: { include: { org: { include: { employerProfile: true } } } } } });
  if (!enrollment?.certUrl) throw new HTTPException(404);

  const signedUrl = await supabaseStorage.getSignedUrl(enrollment.certUrl, '24h');

  if (c.req.header('accept')?.includes('application/pdf')) {
    return c.redirect(signedUrl, 302);
  }

  return c.json({ ...metadata..., signedUrl });
});
```

## POST /v1/wallet/cert/:enrollmentId/share

Generates a share-link for the cert. For MVP, this is just a deeplink to the platform.

```ts
const ShareResponse = z.object({
    shareUrl: z.string(), // e.g., agconn.com/wallet/cert/<enrollmentId>
    shareTextEn: z.string(),
    shareTextEs: z.string(),
});
```

Pre-rendered share text:

```ts
shareTextEn: 'I earned a certificate in {programTitle} via AGCONN. View it: {shareUrl}',
shareTextEs: 'Obtuve un certificado en {programTitle} con AGCONN. Velo aquí: {shareUrl}',
```

Used by the share menu to populate WhatsApp / SMS bodies.

## GET /verify/:certificateId (Phase 2)

Public, unauthenticated. Returns minimal metadata for verification:

```ts
const VerifyResponse = z.object({
    valid: z.boolean(),
    certificateId: z.string(),
    programTitle: z.string(), // not bilingual on this page; locale via URL
    workerFirstName: z.string(), // first name + last initial only
    workerLastInitial: z.string(), // "L"
    org: z.string(),
    funder: FunderEnum,
    completedAt: z.string().date(),
});
```

For MVP, returns: `{ valid: false, message: 'Verification page coming soon. Contact AGCONN support to verify a certificate.' }`. The PDF footer points to this URL anyway, so the page exists; it just doesn't yet do live verification.

## Errors

| code                | http | when                                 |
| ------------------- | ---- | ------------------------------------ |
| `not_found`         | 404  | enrollment doesn't exist or no cert  |
| `not_authenticated` | 401  | non-public endpoints                 |
| `cross_tenant`      | 404  | (RLS) cert belongs to another tenant |
