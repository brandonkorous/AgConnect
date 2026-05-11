import Link from 'next/link';
import { fetchAewr } from '@/lib/system-api';
import { AewrEditor } from './AewrEditor';

export const metadata = { title: 'AEWR rates — AgConn Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AewrPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const stateCodeRaw = typeof sp['stateCode'] === 'string' ? sp['stateCode'] : undefined;
  const stateCode = stateCodeRaw?.toUpperCase().slice(0, 2);

  const result = await fetchAewr(stateCode);

  return (
    <div className="space-y-4">
      <div className="text-xs">
        <Link href="/system" className="link link-hover text-base-content/60">
          ← System
        </Link>
      </div>
      <div>
        <p className="eyebrow text-base-content/60">Platform</p>
        <h1 className="font-serif text-2xl font-medium tracking-tight">AEWR rates</h1>
        <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
          Federal H-2A Adverse Effect Wage Rate, set annually by USDOL ETA. AgConn cites
          this on worker wage transparency and AB 1513 payroll comparisons.
        </p>
      </div>

      <form className="bg-base-100 border-base-300 rounded-box flex flex-wrap gap-3 border p-3">
        <input
          type="text"
          name="stateCode"
          defaultValue={stateCode ?? ''}
          placeholder="state code (e.g. CA)"
          maxLength={2}
          className="input input-sm w-32 uppercase"
        />
        <button type="submit" className="btn btn-sm rounded-full">
          Filter
        </button>
        {stateCode && (
          <Link href="/system/aewr" className="btn btn-ghost btn-sm">
            Reset
          </Link>
        )}
      </form>

      {!result.ok ? (
        <div role="alert" className="alert alert-error">
          <span>
            {result.error.code} — {result.error.message}
          </span>
        </div>
      ) : (
        <AewrEditor rows={result.data.rates} />
      )}
    </div>
  );
}
