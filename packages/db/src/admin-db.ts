import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { makeRlsClient } from './rls.js';

// The owner connection (DATABASE_ADMIN_URL) for seeds and ops scripts; each call runs as app.role = 'admin'.
// It works whether or not the owner bypasses RLS, and never reaches a running service.
let client: PrismaClient | undefined;

function build(): PrismaClient {
  const url = process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_ADMIN_URL is not set — required for seeds and ops scripts');
  const base = new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: 4 }) });
  return makeRlsClient(base, { role: 'admin' });
}

export const adminDb: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    client ??= build();
    return Reflect.get(client as object, prop);
  },
});
