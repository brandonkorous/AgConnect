// Server-only Supabase Storage wrapper. The service-role key lives here and
// nowhere else — clients always go through this module so we keep RLS + tenant
// scoping honest.
//
// Multi-tenancy model: ONE bucket per resource type, with the tenant_id as the
// first path segment. Every key is `<tenantId>/<scopeId>/<random>.<ext>`. RLS
// in the bucket filters reads/writes to paths starting with the caller's
// tenant prefix, so cross-tenant leakage is impossible at the storage layer.
//
// Bucket privacy:
//   - job-photos: PUBLIC (rendered in marketing surfaces, no PII).
//   - compliance-evidence: PRIVATE (I-9s, signed audit binders — PII/SSN).
//     Always served via short-lived signed URLs through the API.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const BUCKETS = {
  jobPhotos: 'job-photos',
  complianceEvidence: 'compliance-evidence',
  grantReports: 'grant-reports',
  certs: 'certs',
} as const;

let cached: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for Storage uploads');
  }
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

export function jobPhotoBucket(): string {
  return BUCKETS.jobPhotos;
}

export function complianceEvidenceBucket(): string {
  return BUCKETS.complianceEvidence;
}

// ─────────────────────────────────────────────────── Generic primitives

type UploadArgs = {
  bucket: string;
  storageKey: string;
  contentType: string;
  body: ArrayBuffer | Buffer | Uint8Array;
  upsert?: boolean;
  cacheControl?: string;
};

async function uploadToBucket(args: UploadArgs): Promise<void> {
  const client = getClient();
  const { error } = await client.storage.from(args.bucket).upload(args.storageKey, args.body, {
    contentType: args.contentType,
    upsert: args.upsert ?? false,
    cacheControl: args.cacheControl ?? '31536000',
  });
  if (error) throw new Error(`supabase_upload_failed: ${error.message}`);
}

async function deleteFromBucket(bucket: string, storageKey: string): Promise<void> {
  const client = getClient();
  const { error } = await client.storage.from(bucket).remove([storageKey]);
  if (error && !/Not Found/i.test(error.message)) {
    throw new Error(`supabase_delete_failed: ${error.message}`);
  }
}

function publicUrl(bucket: string, storageKey: string): string {
  const client = getClient();
  return client.storage.from(bucket).getPublicUrl(storageKey).data.publicUrl;
}

async function signedUrl(bucket: string, storageKey: string, expiresInSeconds: number): Promise<string> {
  const client = getClient();
  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(storageKey, expiresInSeconds);
  if (error || !data) throw new Error(`supabase_sign_failed: ${error?.message ?? 'unknown'}`);
  return data.signedUrl;
}

function cryptoRandomKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function inferExtFromImage(fileName: string, contentType: string): string {
  const dot = fileName.lastIndexOf('.');
  if (dot > 0 && dot < fileName.length - 1) return fileName.slice(dot).toLowerCase();
  switch (contentType.toLowerCase()) {
    case 'image/jpeg': return '.jpg';
    case 'image/png':  return '.png';
    case 'image/webp': return '.webp';
    case 'image/heic': return '.heic';
    case 'image/heif': return '.heif';
    default: return '';
  }
}

function inferExtFromEvidence(fileName: string, contentType: string): string {
  const dot = fileName.lastIndexOf('.');
  if (dot > 0 && dot < fileName.length - 1) return fileName.slice(dot).toLowerCase();
  switch (contentType.toLowerCase()) {
    case 'application/pdf': return '.pdf';
    case 'image/jpeg':      return '.jpg';
    case 'image/png':       return '.png';
    case 'image/webp':      return '.webp';
    case 'image/heic':      return '.heic';
    case 'image/heif':      return '.heif';
    default: return '';
  }
}

// ─────────────────────────────────────────────────── Job photos (public bucket)

export type UploadJobPhotoArgs = {
  tenantId: string;
  jobId: string;
  fileName: string;
  contentType: string;
  body: ArrayBuffer | Buffer | Uint8Array;
};

export type UploadJobPhotoResult = {
  storageKey: string;
  publicUrl: string;
};

export async function uploadJobPhoto(args: UploadJobPhotoArgs): Promise<UploadJobPhotoResult> {
  const bucket = jobPhotoBucket();
  const ext = inferExtFromImage(args.fileName, args.contentType);
  const storageKey = `${args.tenantId}/${args.jobId}/${cryptoRandomKey()}${ext}`;
  await uploadToBucket({
    bucket,
    storageKey,
    contentType: args.contentType,
    body: args.body,
  });
  return { storageKey, publicUrl: publicUrl(bucket, storageKey) };
}

export async function deleteJobPhoto(storageKey: string): Promise<void> {
  await deleteFromBucket(jobPhotoBucket(), storageKey);
}

const ALLOWED_PHOTO_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export function isAllowedPhotoType(contentType: string): boolean {
  return ALLOWED_PHOTO_TYPES.has(contentType.toLowerCase());
}

// ─────────────────────────────────────────────────── Compliance evidence (private bucket)

export type UploadComplianceEvidenceArgs = {
  tenantId: string;
  itemId: string;
  fileName: string;
  contentType: string;
  body: ArrayBuffer | Buffer | Uint8Array;
};

export type UploadComplianceEvidenceResult = {
  storageKey: string;
};

export async function uploadComplianceEvidence(
  args: UploadComplianceEvidenceArgs,
): Promise<UploadComplianceEvidenceResult> {
  const bucket = complianceEvidenceBucket();
  const ext = inferExtFromEvidence(args.fileName, args.contentType);
  const storageKey = `${args.tenantId}/${args.itemId}/${cryptoRandomKey()}${ext}`;
  await uploadToBucket({
    bucket,
    storageKey,
    contentType: args.contentType,
    body: args.body,
    cacheControl: '0', // PII — never cache
  });
  return { storageKey };
}

export async function deleteComplianceEvidence(storageKey: string): Promise<void> {
  await deleteFromBucket(complianceEvidenceBucket(), storageKey);
}

export async function signComplianceEvidenceUrl(
  storageKey: string,
  expiresInSeconds: number = 60,
): Promise<string> {
  return signedUrl(complianceEvidenceBucket(), storageKey, expiresInSeconds);
}

// ─────────────────────────────────────────────────── Grant reports (private bucket)
//
// Layout: `<reportType>/<runId>.<ext>`. Cross-tenant by design — admin-only.

export type UploadGrantReportArgs = {
  runId: string;
  reportType: string;
  format: 'csv' | 'xlsx';
  contentType: string;
  body: ArrayBuffer | Buffer | Uint8Array;
};

export async function uploadGrantReport(args: UploadGrantReportArgs): Promise<string> {
  const bucket = BUCKETS.grantReports;
  const storageKey = `${args.reportType}/${args.runId}.${args.format}`;
  await uploadToBucket({
    bucket,
    storageKey,
    contentType: args.contentType,
    body: args.body,
    cacheControl: '0',
  });
  return storageKey;
}

export async function signGrantReportUrl(
  storageKey: string,
  expiresInSeconds: number = 300,
): Promise<string> {
  return signedUrl(BUCKETS.grantReports, storageKey, expiresInSeconds);
}

// ─────────────────────────────────────────────────── Certs (private bucket)
//
// Layout: `<tenantId>/<enrollmentId>/<certificateId>.pdf`. Uploaded by the
// cert-generator service; read by the wallet API via 24h signed URLs.

export function certBucket(): string {
  return BUCKETS.certs;
}

export async function signCertUrl(
  storageKey: string,
  expiresInSeconds: number = 60 * 60 * 24,
): Promise<string> {
  return signedUrl(BUCKETS.certs, storageKey, expiresInSeconds);
}

const ALLOWED_EVIDENCE_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export function isAllowedEvidenceType(contentType: string): boolean {
  return ALLOWED_EVIDENCE_TYPES.has(contentType.toLowerCase());
}
