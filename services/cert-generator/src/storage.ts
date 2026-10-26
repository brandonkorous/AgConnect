import { BlobServiceClient, StorageSharedKeyCredential, type ContainerClient } from '@azure/storage-blob';

// Generated certificate PDFs on Azure Blob (AG-11), in the private `certs` container.
// Key layout `<tenantId>/<enrollmentId>/<certificateId>.pdf`; the wallet API reads them through signed URLs.
const CONTAINER = 'certs';
const CONTENT_TYPE = 'application/pdf';

let cached: ContainerClient | null = null;
function container(): ContainerClient {
    if (cached) return cached;
    const name = process.env.AZURE_STORAGE_ACCOUNT;
    const key = process.env.AZURE_STORAGE_KEY;
    if (!name || !key) {
        throw new Error('cert-generator: AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY must be set');
    }
    const service = new BlobServiceClient(`https://${name}.blob.core.windows.net`, new StorageSharedKeyCredential(name, key));
    cached = service.getContainerClient(CONTAINER);
    return cached;
}

export type UploadCertArgs = {
    tenantId: string;
    enrollmentId: string;
    certificateId: string;
    body: Buffer;
};

// Overwrites: a regenerated certificate replaces the old PDF under the same key.
export async function uploadCert(args: UploadCertArgs): Promise<string> {
    const storageKey = `${args.tenantId}/${args.enrollmentId}/${args.certificateId}.pdf`;
    try {
        await container().getBlockBlobClient(storageKey).uploadData(args.body, {
            blobHTTPHeaders: { blobContentType: CONTENT_TYPE, blobCacheControl: 'no-store' },
        });
    } catch (e) {
        throw new Error(`cert-generator: blob upload failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    return storageKey;
}
