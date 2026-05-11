import { adminFetch } from '@/lib/api-server';
import { EmployerActivityBuilder } from './EmployerActivityBuilder';

export const metadata = { title: 'Employer activity — AgConn Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;
type PreviewRow = Record<string, string | number | boolean | null>;

function pickArray(sp: SearchParams, key: string): string[] {
  const v = sp[key];
  return Array.isArray(v) ? v : v ? [v as string] : [];
}

function defaults(sp: SearchParams) {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const fallbackEnd = fmt(today);
  const fallbackStart = fmt(new Date(today.getFullYear(), today.getMonth() - 3, 1));
  return {
    view: (['rows', 'by_county', 'by_license_type'] as const).includes(sp['view'] as 'rows')
      ? (sp['view'] as 'rows' | 'by_county' | 'by_license_type')
      : 'rows',
    start: typeof sp['start'] === 'string' && sp['start'] ? sp['start'] : fallbackStart,
    end: typeof sp['end'] === 'string' && sp['end'] ? sp['end'] : fallbackEnd,
    counties: pickArray(sp, 'counties'),
    licenseTypes: pickArray(sp, 'licenseTypes'),
    format: (sp['format'] === 'xlsx' ? 'xlsx' : 'csv') as 'csv' | 'xlsx',
  };
}

export default async function EmployerActivityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const d = defaults(sp);

  const preview = await adminFetch<{
    rows: PreviewRow[];
    totalCount: number;
    columns: readonly string[];
  }>('/admin/v1/reports/employer/preview', {
    query: {
      start: d.start,
      end: d.end,
      view: d.view,
      counties: d.counties.length ? d.counties : undefined,
      licenseTypes: d.licenseTypes.length ? d.licenseTypes : undefined,
      preview: 20,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-base-content/60">Platform / Reports</p>
        <h1 className="font-serif text-2xl font-medium tracking-tight">Employer activity</h1>
        <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
          Per-employer funnel: postings → applications → hires. Group by county or license
          type for grant reports.
        </p>
      </div>

      <EmployerActivityBuilder defaults={d} />

      {!preview.ok ? (
        <div role="alert" className="alert alert-error">
          <span>
            Preview failed: {preview.error.code}
            {preview.error.message ? ` — ${preview.error.message}` : ''}
          </span>
        </div>
      ) : preview.data.rows.length === 0 ? (
        <div className="bg-base-100 border-base-300 text-base-content/70 rounded-box border p-8 text-center text-sm">
          No employers match these filters.
        </div>
      ) : (
        <PreviewTable
          rows={preview.data.rows}
          columns={preview.data.columns}
          total={preview.data.totalCount}
        />
      )}
    </div>
  );
}

function PreviewTable({
  rows,
  columns,
  total,
}: {
  rows: PreviewRow[];
  columns: readonly string[];
  total: number;
}) {
  return (
    <div className="bg-base-100 border-base-300 rounded-box border p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-serif text-lg font-medium">Preview</h3>
        <span className="text-base-content/60 font-mono text-xs tabular-nums">
          First {rows.length} of {total} rows
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
                    {r[c] === null || r[c] === undefined
                      ? ''
                      : typeof r[c] === 'number' && c === 'hireRate'
                        ? `${(Number(r[c]) * 100).toFixed(1)}%`
                        : String(r[c])}
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
