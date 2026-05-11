import { Lang, TranslationStatus, type Tx } from '@agconn/db';

export type TranslationCell = {
  id: string;
  value: string;
  status: TranslationStatus;
  updatedAt: string;
};

export type TranslationPair = {
  namespace: string;
  key: string;
  tenantId: string | null;
  en: TranslationCell | null;
  es: TranslationCell | null;
};

type RowLite = {
  id: string;
  namespace: string;
  key: string;
  locale: Lang;
  tenantId: string | null;
  value: string;
  status: TranslationStatus;
  updatedAt: Date;
};

// Build the (namespace, key) -> {en, es} view from a flat row set. Both locales
// for a given pair come back in the same list; we group here so the UI doesn't
// have to. Pairs missing one side surface a null cell.
export function pairRows(rows: RowLite[]): TranslationPair[] {
  const map = new Map<string, TranslationPair>();
  for (const r of rows) {
    const k = `${r.tenantId ?? '~'}|${r.namespace}|${r.key}`;
    let pair = map.get(k);
    if (!pair) {
      pair = {
        namespace: r.namespace,
        key: r.key,
        tenantId: r.tenantId,
        en: null,
        es: null,
      };
      map.set(k, pair);
    }
    const cell: TranslationCell = {
      id: r.id,
      value: r.value,
      status: r.status,
      updatedAt: r.updatedAt.toISOString(),
    };
    if (r.locale === Lang.en) pair.en = cell;
    else pair.es = cell;
  }
  return Array.from(map.values());
}

export type ListParams = {
  scope: 'platform' | 'tenant';
  tenantId?: string;
  namespace?: string;
  search?: string;
  status?: TranslationStatus;
  missingOnly?: boolean;
  limit: number;
  cursor?: string;
};

export async function listTranslations(
  db: Tx,
  params: ListParams,
): Promise<{ pairs: TranslationPair[]; nextCursor: string | null }> {
  const where: Record<string, unknown> = {
    tenantId: params.scope === 'platform' ? null : (params.tenantId ?? null),
  };
  if (params.namespace) where['namespace'] = { startsWith: params.namespace };
  if (params.search) {
    where['OR'] = [
      { namespace: { contains: params.search, mode: 'insensitive' } },
      { key: { contains: params.search, mode: 'insensitive' } },
      { value: { contains: params.search, mode: 'insensitive' } },
    ];
  }
  if (params.status) where['status'] = params.status;
  if (params.cursor) {
    const [ns, k] = decodeCursor(params.cursor);
    where['OR'] = [
      { namespace: { gt: ns } },
      { AND: [{ namespace: ns }, { key: { gt: k } }] },
    ];
  }

  // Fetch both locales of each matching pair in one round-trip. We over-fetch
  // slightly (2x the page size) since each pair is two rows.
  const rows = await db.translationKey.findMany({
    where,
    orderBy: [{ namespace: 'asc' }, { key: 'asc' }, { locale: 'asc' }],
    take: params.limit * 2 + 1,
    select: {
      id: true,
      namespace: true,
      key: true,
      locale: true,
      tenantId: true,
      value: true,
      status: true,
      updatedAt: true,
    },
  });

  let pairs = pairRows(rows);
  if (params.missingOnly) {
    pairs = pairs.filter((p) => p.en === null || p.es === null);
  }

  let nextCursor: string | null = null;
  if (pairs.length > params.limit) {
    pairs = pairs.slice(0, params.limit);
    const last = pairs[pairs.length - 1]!;
    nextCursor = encodeCursor(last.namespace, last.key);
  }

  return { pairs, nextCursor };
}

export type NamespaceSummary = { namespace: string; pairs: number };

export async function listNamespaces(
  db: Tx,
  scope: 'platform' | 'tenant',
  tenantId: string | null,
): Promise<NamespaceSummary[]> {
  const rows = await db.translationKey.groupBy({
    by: ['namespace'],
    where: {
      tenantId: scope === 'platform' ? null : tenantId,
      locale: Lang.en,
    },
    _count: { _all: true },
    orderBy: { namespace: 'asc' },
  });
  return rows.map((r) => ({ namespace: r.namespace, pairs: r._count._all }));
}

function encodeCursor(namespace: string, key: string): string {
  return Buffer.from(`${namespace}|${key}`).toString('base64url');
}

function decodeCursor(c: string): [string, string] {
  const parts = Buffer.from(c, 'base64url').toString('utf8').split('|');
  return [parts[0] ?? '', parts[1] ?? ''];
}
