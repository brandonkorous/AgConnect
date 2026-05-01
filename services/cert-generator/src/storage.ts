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

// Storage adapter: production will use Supabase Storage with signed URL
// access (target backend, not yet wired). In dev, write to ./certs and serve
// via PUBLIC_WEB_URL. Both branches return a stable URL persisted on the
// Enrollment row so the wallet can resolve it later.

async function makeSupabaseWriter(): Promise<CertWriter | null> {
  // TODO(supabase-storage): wire @supabase/storage-js once the bucket is
  // provisioned. Until then we always fall through to the local fs writer
  // so dev + preview environments keep working.
  return null;
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
      // dev-only static handler). When the Supabase writer lands this branch
      // becomes the dev-only fallback.
      return `${base}/api/certs/${args.tenantId}/${args.enrollmentId}/${args.certificateId}.html`;
    },
  };
}

export const writeCert = {
  async init(): Promise<CertWriter> {
    const supabase = await makeSupabaseWriter();
    return supabase ?? makeLocalWriter();
  },
};
