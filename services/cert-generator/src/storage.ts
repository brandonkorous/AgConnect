import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export type WriteArgs = {
  tenantId: string;
  enrollmentId: string;
  certificateId: string;
  contentType: string;
  body: Buffer;
};

export type CertWriter = {
  write: (args: WriteArgs) => Promise<string>;
};

// Storage adapter: in production we use Azure Blob with signed-URL access.
// In dev (no AZURE_BLOB_CONNECTION_STRING) we write to ./certs and serve via
// PUBLIC_WEB_URL. Both return a stable URL persisted on the Enrollment row.

async function makeAzureWriter(): Promise<CertWriter | null> {
  const connStr = process.env.AZURE_BLOB_CONNECTION_STRING;
  const container = process.env.AZURE_BLOB_CERT_CONTAINER ?? 'certificates';
  if (!connStr) return null;
  // Lazy import so dev doesn't pay for Azure SDK boot when not configured.
  const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } =
    await import('@azure/storage-blob').catch(() => ({} as unknown as typeof import('@azure/storage-blob')));
  if (!BlobServiceClient) {
    console.warn('[cert-generator] @azure/storage-blob not installed; falling back to local writer');
    return null;
  }
  const svc = BlobServiceClient.fromConnectionString(connStr);
  const containerClient = svc.getContainerClient(container);
  await containerClient.createIfNotExists();
  return {
    async write(args) {
      const blobName = `${args.tenantId}/${args.enrollmentId}/${args.certificateId}.html`;
      const blobClient = containerClient.getBlockBlobClient(blobName);
      await blobClient.uploadData(args.body, {
        blobHTTPHeaders: { blobContentType: args.contentType },
      });
      // Return a 24-hour SAS URL. The wallet refreshes on access; the row
      // stores the long-lived blob URL so we can re-sign on demand.
      const accountName = svc.accountName;
      const accountKey = process.env.AZURE_BLOB_ACCOUNT_KEY ?? '';
      if (!accountKey) return blobClient.url;
      const sas = generateBlobSASQueryParameters(
        {
          containerName: container,
          blobName,
          permissions: BlobSASPermissions.parse('r'),
          startsOn: new Date(),
          expiresOn: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        new StorageSharedKeyCredential(accountName, accountKey),
      ).toString();
      return `${blobClient.url}?${sas}`;
    },
  };
}

function makeLocalWriter(): CertWriter {
  const root = resolve(process.cwd(), 'certs');
  return {
    async write(args) {
      const dir = join(root, args.tenantId, args.enrollmentId);
      await mkdir(dir, { recursive: true });
      const file = join(dir, `${args.certificateId}.html`);
      await writeFile(file, args.body);
      const base = process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000';
      // Surfaced via apps/web/src/app/api/certs/[...path]/route.ts (a small
      // dev-only static handler). In prod the Azure writer takes over and
      // this branch is dead.
      return `${base}/api/certs/${args.tenantId}/${args.enrollmentId}/${args.certificateId}.html`;
    },
  };
}

export const writeCert = {
  async init(): Promise<CertWriter> {
    const azure = await makeAzureWriter();
    return azure ?? makeLocalWriter();
  },
};
