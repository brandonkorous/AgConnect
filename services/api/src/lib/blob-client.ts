import {
  BlobSASPermissions,
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';

// Azure Blob primitives (AG-11). Every container is private; reads go out as short-lived read-only SAS URLs.
// The account key lives here and nowhere else; the browser never talks to storage directly.
type Account = { name: string; credential: StorageSharedKeyCredential; service: BlobServiceClient };

let cached: Account | null = null;

function account(): Account {
  if (cached) return cached;
  const name = process.env.AZURE_STORAGE_ACCOUNT;
  const key = process.env.AZURE_STORAGE_KEY;
  if (!name || !key) throw new Error('AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY must be set for file storage');
  const credential = new StorageSharedKeyCredential(name, key);
  const service = new BlobServiceClient(`https://${name}.blob.core.windows.net`, credential);
  cached = { name, credential, service };
  return cached;
}

export type UploadArgs = {
  container: string;
  storageKey: string;
  contentType: string;
  body: ArrayBuffer | Buffer | Uint8Array;
  overwrite?: boolean;
  cacheControl?: string;
};

export async function uploadBlob(args: UploadArgs): Promise<void> {
  const blob = account().service.getContainerClient(args.container).getBlockBlobClient(args.storageKey);
  const data = args.body instanceof ArrayBuffer ? Buffer.from(args.body) : args.body;
  await blob.uploadData(data, {
    blobHTTPHeaders: { blobContentType: args.contentType, blobCacheControl: args.cacheControl ?? 'max-age=31536000' },
    // Without overwrite, an existing key is a conflict, like Supabase's upsert: false.
    conditions: args.overwrite ? undefined : { ifNoneMatch: '*' },
  });
}

export async function deleteBlob(container: string, storageKey: string): Promise<void> {
  await account().service.getContainerClient(container).getBlobClient(storageKey).deleteIfExists();
}

export function signBlobUrl(container: string, storageKey: string, expiresInSeconds: number): string {
  const { name, credential } = account();
  const sas = generateBlobSASQueryParameters({
    containerName: container,
    blobName: storageKey,
    permissions: BlobSASPermissions.parse('r'),
    startsOn: new Date(Date.now() - 60_000),
    expiresOn: new Date(Date.now() + expiresInSeconds * 1000),
  }, credential).toString();
  const path = storageKey.split('/').map(encodeURIComponent).join('/');
  return `https://${name}.blob.core.windows.net/${container}/${path}?${sas}`;
}
