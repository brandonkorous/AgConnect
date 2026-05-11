import Link from 'next/link';
import { fetchLookup, type LookupTable } from '@/lib/system-api';
import { LookupEditor } from './LookupEditor';

export const metadata = { title: 'Lookup tables — AgConn Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;
const TABLES: { slug: LookupTable; label: string }[] = [
  { slug: 'crops', label: 'Crops' },
  { slug: 'role-types', label: 'Role types' },
  { slug: 'skill-tags', label: 'Skill tags' },
];

export default async function LookupsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const tableRaw = typeof sp['table'] === 'string' ? sp['table'] : 'crops';
  const table: LookupTable = TABLES.some((t) => t.slug === tableRaw)
    ? (tableRaw as LookupTable)
    : 'crops';

  const result = await fetchLookup(table);

  return (
    <div className="space-y-4">
      <div className="text-xs">
        <Link href="/system" className="link link-hover text-base-content/60">
          ← System
        </Link>
      </div>
      <div>
        <p className="eyebrow text-base-content/60">Platform</p>
        <h1 className="font-serif text-2xl font-medium tracking-tight">Lookup tables</h1>
        <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
          Bilingual reference data shared across the platform. Edits save on blur. Deletes
          require super_admin and affect every existing reference.
        </p>
      </div>

      <div role="tablist" className="tabs tabs-border">
        {TABLES.map((t) => (
          <Link
            key={t.slug}
            href={`/system/lookups?table=${t.slug}`}
            role="tab"
            className={`tab ${table === t.slug ? 'tab-active' : ''}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {!result.ok ? (
        <div role="alert" className="alert alert-error">
          <span>
            {result.error.code} — {result.error.message}
          </span>
        </div>
      ) : (
        <LookupEditor table={table} rows={result.data.rows} />
      )}
    </div>
  );
}
