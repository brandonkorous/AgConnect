// Server-only Supabase Storage wrapper. The service-role key lives here and
// nowhere else — clients always go through this module so we keep RLS + tenant
// scoping honest.
//
// Multi-tenancy model: ONE bucket per resource type, with the tenant_id as the
// first path segment. Every key is `<tenantId>/<jobId>/<random>.<ext>`. RLS in
// the bucket filters reads/writes to paths starting with the caller's tenant
// prefix, so cross-tenant leakage is impossible at the storage layer. Bucket
// names are code-controlled (not env) so they don't drift between deploys.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const BUCKETS = {
  jobPhotos: 'job-photos',
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

// Path layout: <bucket>/<tenant>/<job>/<random>.<ext>. Tenant prefix lets us
// scope deletes when a tenant is offboarded, and keeps signed URLs cleanly
// scoped per-tenant if we ever flip the bucket private.
export async function uploadJobPhoto(args: UploadJobPhotoArgs): Promise<UploadJobPhotoResult> {
  const client = getClient();
  const bucket = jobPhotoBucket();
  const ext = inferExt(args.fileName, args.contentType);
  const random = cryptoRandomKey();
  const storageKey = `${args.tenantId}/${args.jobId}/${random}${ext}`;

  const { error } = await client.storage.from(bucket).upload(storageKey, args.body, {
    contentType: args.contentType,
    upsert: false,
    cacheControl: '31536000', // 1y immutable
  });
  if (error) throw new Error(`supabase_upload_failed: ${error.message}`);

  const { data } = client.storage.from(bucket).getPublicUrl(storageKey);
  return { storageKey, publicUrl: data.publicUrl };
}

export async function deleteJobPhoto(storageKey: string): Promise<void> {
  const client = getClient();
  const bucket = jobPhotoBucket();
  const { error } = await client.storage.from(bucket).remove([storageKey]);
  if (error && !/Not Found/i.test(error.message)) {
    throw new Error(`supabase_delete_failed: ${error.message}`);
  }
}

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export function isAllowedPhotoType(contentType: string): boolean {
  return ALLOWED_TYPES.has(contentType.toLowerCase());
}

function inferExt(fileName: string, contentType: string): string {
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

function cryptoRandomKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
