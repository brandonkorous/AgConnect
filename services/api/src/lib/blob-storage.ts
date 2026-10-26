import { deleteBlob, signBlobUrl, uploadBlob } from './blob-client.js';

// File storage on Azure Blob (AG-11), one private container per resource type, names kept from the Supabase buckets.
// Keys are `<tenantId>/<scopeId>/<random>.<ext>` (grant reports: `<reportType>/<runId>.<ext>`), unchanged by the move.
const CONTAINERS = {
  jobPhotos: 'job-photos',
  complianceEvidence: 'compliance-evidence',
  grantReports: 'grant-reports',
  certs: 'certs',
} as const;

const JOB_PHOTO_URL_SECONDS = 60 * 60;
const PHOTO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/heic': '.heic', 'image/heif': '.heif',
};
const EVIDENCE_EXT: Record<string, string> = { 'application/pdf': '.pdf', ...PHOTO_EXT };

function cryptoRandomKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function inferExt(fileName: string, contentType: string, known: Record<string, string>): string {
  const dot = fileName.lastIndexOf('.');
  if (dot > 0 && dot < fileName.length - 1) return fileName.slice(dot).toLowerCase();
  return known[contentType.toLowerCase()] ?? '';
}

type Body = ArrayBuffer | Buffer | Uint8Array;

// Job photos: private like everything else, so the API hands employers a one-hour read URL.
export type UploadJobPhotoArgs = { tenantId: string; jobId: string; fileName: string; contentType: string; body: Body };

export async function uploadJobPhoto(args: UploadJobPhotoArgs): Promise<{ storageKey: string }> {
  const storageKey = `${args.tenantId}/${args.jobId}/${cryptoRandomKey()}${inferExt(args.fileName, args.contentType, PHOTO_EXT)}`;
  await uploadBlob({ container: CONTAINERS.jobPhotos, storageKey, contentType: args.contentType, body: args.body });
  return { storageKey };
}

// job_photos.url holds the storage key; a row still holding a full URL is passed through unchanged.
export function jobPhotoUrl(urlOrKey: string): string {
  if (/^https?:\/\//.test(urlOrKey)) return urlOrKey;
  return signBlobUrl(CONTAINERS.jobPhotos, urlOrKey, JOB_PHOTO_URL_SECONDS);
}

export async function deleteJobPhoto(storageKey: string): Promise<void> {
  await deleteBlob(CONTAINERS.jobPhotos, storageKey);
}

export function isAllowedPhotoType(contentType: string): boolean {
  return Object.hasOwn(PHOTO_EXT, contentType.toLowerCase());
}

// Compliance evidence (I-9s, signed audit binders): PII, never cached, read through 60-second URLs.
export type UploadComplianceEvidenceArgs = { tenantId: string; itemId: string; fileName: string; contentType: string; body: Body };

export async function uploadComplianceEvidence(args: UploadComplianceEvidenceArgs): Promise<{ storageKey: string }> {
  const storageKey = `${args.tenantId}/${args.itemId}/${cryptoRandomKey()}${inferExt(args.fileName, args.contentType, EVIDENCE_EXT)}`;
  await uploadBlob({
    container: CONTAINERS.complianceEvidence, storageKey, contentType: args.contentType, body: args.body, cacheControl: 'no-store',
  });
  return { storageKey };
}

export async function deleteComplianceEvidence(storageKey: string): Promise<void> {
  await deleteBlob(CONTAINERS.complianceEvidence, storageKey);
}

export async function signComplianceEvidenceUrl(storageKey: string, expiresInSeconds: number = 60): Promise<string> {
  return signBlobUrl(CONTAINERS.complianceEvidence, storageKey, expiresInSeconds);
}

export function isAllowedEvidenceType(contentType: string): boolean {
  return Object.hasOwn(EVIDENCE_EXT, contentType.toLowerCase());
}

// Grant reports: cross-tenant by design, admin only.
export type UploadGrantReportArgs = { runId: string; reportType: string; format: 'csv' | 'xlsx'; contentType: string; body: Body };

export async function uploadGrantReport(args: UploadGrantReportArgs): Promise<string> {
  const storageKey = `${args.reportType}/${args.runId}.${args.format}`;
  await uploadBlob({
    container: CONTAINERS.grantReports, storageKey, contentType: args.contentType, body: args.body, cacheControl: 'no-store',
  });
  return storageKey;
}

export async function signGrantReportUrl(storageKey: string, expiresInSeconds: number = 300): Promise<string> {
  return signBlobUrl(CONTAINERS.grantReports, storageKey, expiresInSeconds);
}

// Certificates: written by cert-generator, read by the wallet through 24-hour URLs.
export async function signCertUrl(storageKey: string, expiresInSeconds: number = 60 * 60 * 24): Promise<string> {
  return signBlobUrl(CONTAINERS.certs, storageKey, expiresInSeconds);
}
