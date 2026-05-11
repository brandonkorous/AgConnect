import { fetchPlacementPreview } from '@/lib/reports-api';
import { PlacementReportBuilder } from './PlacementReportBuilder';

export const metadata = { title: 'Placement report — AgConn Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

const COUNTIES = ['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare'] as const;
const FUNDERS = ['CDFA', 'F3', 'CalOSBA', 'EDD', 'other'] as const;

function buildPreviewQs(sp: SearchParams): { qs: string; start: string; end: string } {
  const today = new Date();
  const defaultEnd = today.toISOString().slice(0, 10);
  const defaultStart = new Date(today.getFullYear(), today.getMonth() - 3, 1)
    .toISOString()
    .slice(0, 10);

  const start = typeof sp['start'] === 'string' && sp['start'] ? sp['start'] : defaultStart;
  const end = typeof sp['end'] === 'string' && sp['end'] ? sp['end'] : defaultEnd;

  const params = new URLSearchParams();
  params.set('start', start);
  params.set('end', end);

  if (sp['includeNames'] === 'true') params.set('includeNames', 'true');

  const counties = Array.isArray(sp['counties'])
    ? sp['counties']
    : sp['counties']
      ? [sp['counties']]
      : [];
  for (const c of counties) params.append('counties', c);

  const funders = Array.isArray(sp['funders'])
    ? sp['funders']
    : sp['funders']
      ? [sp['funders']]
      : [];
  for (const f of funders) params.append('funders', f);

  return { qs: params.toString(), start, end };
}

export default async function PlacementReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { qs, start, end } = buildPreviewQs(sp);
  const preview = await fetchPlacementPreview(qs);
  const includeNames = sp['includeNames'] === 'true';
  const format = sp['format'] === 'xlsx' ? 'xlsx' : 'csv';
  const email = typeof sp['email'] === 'string' ? sp['email'] : '';
  const counties = Array.isArray(sp['counties'])
    ? sp['counties']
    : sp['counties']
      ? [sp['counties'] as string]
      : [];
  const funders = Array.isArray(sp['funders'])
    ? sp['funders']
    : sp['funders']
      ? [sp['funders'] as string]
      : [];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-base-content/60">Platform / Reports</p>
        <h1 className="font-serif text-2xl font-medium tracking-tight">Placement report</h1>
        <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
          WIOA / CalJOBS-aligned hire export with anonymized participant IDs. All
          dates are America/Los_Angeles. Q2 / Q4 retention columns are placeholders
          for grantee follow-up.
        </p>
      </div>

      <PlacementReportBuilder
        counties={[...COUNTIES]}
        funders={[...FUNDERS]}
        defaults={{
          start,
          end,
          counties: counties as string[],
          funders: funders as string[],
          includeNames,
          format,
          email,
        }}
      />

      <PreviewSection
        ok={preview.ok}
        rows={preview.ok ? preview.data.rows : []}
        columns={preview.ok ? preview.data.columns : []}
        totalCount={preview.ok ? preview.data.totalCount : 0}
        errorCode={!preview.ok ? preview.error.code : undefined}
        errorMsg={!preview.ok ? preview.error.message : undefined}
      />
    </div>
  );
}

function PreviewSection({
  ok,
  rows,
  columns,
  totalCount,
  errorCode,
  errorMsg,
}: {
  ok: boolean;
  rows: Array<Record<string, string | number | null>>;
  columns: string[];
  totalCount: number;
  errorCode?: string;
  errorMsg?: string;
}) {
  if (!ok) {
    return (
      <div role="alert" className="alert alert-error">
        <span>
          Preview failed: {errorCode}
          {errorMsg ? ` — ${errorMsg}` : ''}
        </span>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-base-100 border-base-300 text-base-content/70 rounded-box border p-8 text-center text-sm">
        No placements match these filters.
      </div>
    );
  }

  return (
    <div className="bg-base-100 border-base-300 rounded-box border p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-serif text-lg font-medium">Preview</h3>
        <span className="text-base-content/60 font-mono text-xs tabular-nums">
          First {rows.length} of {totalCount} rows
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="table-zebra table-sm table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c} className="whitespace-nowrap text-xs">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c} className="whitespace-nowrap font-mono text-xs">
                    {r[c] === null || r[c] === undefined ? '' : String(r[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
