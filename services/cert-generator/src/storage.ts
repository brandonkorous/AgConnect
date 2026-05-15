import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Supabase Storage adapter for generated certificate PDFs. The bucket is
// private — the wallet API hands out short-lived signed URLs (see
// services/api/src/lib/supabase-storage.ts → signCertUrl).
//
// Multi-tenancy layout matches the rest of the storage namespace:
//   `<tenantId>/<enrollmentId>/<certificateId>.pdf`
// RLS on the bucket constrains writes to the service role and reads to none —
// every read happens via a signed URL minted by the API.

const BUCKET = 'certs';
const CONTENT_TYPE = 'application/pdf';

let cached: SupabaseClient | null = null;
function getClient(): SupabaseClient {
    if (cached) return cached;
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error(
            'cert-generator: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set',
        );
    }
    cached = createClient(url, key, { auth: { persistSession: false } });
    return cached;
}

export type UploadCertArgs = {
    tenantId: string;
    enrollmentId: string;
    certificateId: string;
    body: Buffer;
};

export async function uploadCert(args: UploadCertArgs): Promise<string> {
    const storageKey = `${args.tenantId}/${args.enrollmentId}/${args.certificateId}.pdf`;
    const { error } = await getClient()
        .storage.from(BUCKET)
        .upload(storageKey, args.body, {
            contentType: CONTENT_TYPE,
            upsert: true,
            cacheControl: '0',
        });
    if (error) {
        throw new Error(`cert-generator: supabase upload failed: ${error.message}`);
    }
    return storageKey;
}
