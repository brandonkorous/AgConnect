import { createHash } from 'node:crypto';
import { applyRlsToTx, Lang, pools, TranslationStatus, type Db } from '@agconn/db';

export type Messages = Record<string, unknown>;
export type MessagesEntry = { messages: Messages; etag: string };

interface Row {
  namespace: string;
  key: string;
  value: string;
  tenantId?: string | null;
}

// translation_keys_service_read is SELECT-only on published rows; a nil tenant keeps its uuid cast valid.
const NIL_UUID = '00000000-0000-0000-0000-000000000000';
const TTL_MS = 5 * 60 * 1000;

function assemble(rows: Row[]): Messages {
  const root: Messages = {};
  for (const row of rows) {
    const path = [...row.namespace.split('.'), ...row.key.split('.')];
    let cursor: Messages = root;
    for (let i = 0; i < path.length - 1; i++) {
      const segment = path[i];
      if (!segment) continue;
      const next = cursor[segment];
      if (typeof next !== 'object' || next === null || Array.isArray(next)) {
        cursor[segment] = {};
      }
      cursor = cursor[segment] as Messages;
    }
    const leaf = path[path.length - 1];
    if (leaf) cursor[leaf] = row.value;
  }
  return root;
}

// Tenant rows override global rows key by key.
function mergeRows(rows: Row[]): Messages {
  const merged = new Map<string, Row>();
  for (const r of rows.filter((x) => x.tenantId == null)) merged.set(`${r.namespace}|${r.key}`, r);
  for (const r of rows.filter((x) => x.tenantId != null)) merged.set(`${r.namespace}|${r.key}`, r);
  return assemble(Array.from(merged.values()));
}

export async function loadMessages(
  db: Pick<Db, '$transaction'>,
  locale: 'en' | 'es',
  tenantId: string | null,
): Promise<Messages> {
  return db.$transaction(
    async (tx) => {
      await applyRlsToTx(tx, { role: 'service', tenantId: tenantId ?? NIL_UUID });
      const rows = await tx.translationKey.findMany({
        where: {
          locale: locale as Lang,
          status: TranslationStatus.published,
          ...(tenantId ? { OR: [{ tenantId }, { tenantId: null }] } : { tenantId: null }),
        },
        select: { namespace: true, key: true, value: true, tenantId: true },
      });
      return mergeRows(rows);
    },
    { timeout: 15_000, maxWait: 5_000 },
  );
}

const cache = new Map<string, { at: number; entry: Promise<MessagesEntry> }>();

// One load per (locale, tenant) every 5 minutes, shared by concurrent callers; failures are not kept.
export function getMessagesEntry(
  locale: 'en' | 'es',
  tenantId: string | null,
  db: Pick<Db, '$transaction'> = pools.i18n,
  now: number = Date.now(),
): Promise<MessagesEntry> {
  const key = `${locale}|${tenantId ?? ''}`;
  const hit = cache.get(key);
  if (hit && now - hit.at < TTL_MS) return hit.entry;
  const entry = loadMessages(db, locale, tenantId).then((messages) => ({
    messages,
    etag: `"${createHash('sha1').update(JSON.stringify(messages)).digest('base64url')}"`,
  }));
  const slot = { at: now, entry };
  cache.set(key, slot);
  entry.catch(() => {
    if (cache.get(key) === slot) cache.delete(key);
  });
  return entry;
}

// Called when translations are published, so this replica serves the new copy at once.
export function clearMessagesCache(): void {
  cache.clear();
}
