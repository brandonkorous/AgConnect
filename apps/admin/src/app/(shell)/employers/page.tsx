import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark, faClock } from '@fortawesome/free-solid-svg-icons';
import { fetchEmployers } from '@/lib/directory-api';
import { EmployerFilters } from './EmployerFilters';

export const metadata = { title: 'Employers — AgConn Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function EmployersDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const verified = sp['verified'];
  const verifiedFilter: 'true' | 'false' | 'pending' | undefined =
    verified === 'true' || verified === 'false' || verified === 'pending' ? verified : undefined;
  const result = await fetchEmployers({
    search: typeof sp['search'] === 'string' ? sp['search'] : undefined,
    licenseType: typeof sp['licenseType'] === 'string' ? sp['licenseType'] : undefined,
    verified: verifiedFilter,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="eyebrow text-base-content/60">Platform</p>
          <h1 className="font-serif text-2xl font-medium tracking-tight">Employers</h1>
          <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
            Directory of all employer profiles across tenants. Use the verification filter to
            triage the pending queue.
          </p>
        </div>
        <Link
          href="/reports/employer-activity"
          className="btn btn-ghost btn-sm rounded-full"
        >
          Activity report →
        </Link>
      </div>

      <EmployerFilters />

      {!result.ok ? (
        <div role="alert" className="alert alert-error">
          <span>
            {result.error.code} — {result.error.message}
          </span>
        </div>
      ) : result.data.employers.length === 0 ? (
        <div className="bg-base-100 border-base-300 text-base-content/70 rounded-box border p-8 text-center text-sm">
          No employers match these filters.
        </div>
      ) : (
        <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
          <table className="table">
            <thead className="bg-base-200">
              <tr>
                <th>Legal name</th>
                <th>License</th>
                <th>County</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {result.data.employers.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="text-sm font-medium">{e.legalName}</div>
                    {e.dbaName && (
                      <div className="text-base-content/60 text-xs">DBA: {e.dbaName}</div>
                    )}
                  </td>
                  <td className="text-xs">
                    {e.licenseType ? (
                      <span className="badge badge-ghost badge-sm">{e.licenseType}</span>
                    ) : (
                      <span className="text-base-content/40">—</span>
                    )}
                    {e.flcLicenseNum && (
                      <div className="text-base-content/60 mt-1 font-mono text-[11px]">
                        {e.flcLicenseNum}
                      </div>
                    )}
                  </td>
                  <td className="text-xs">{e.county ?? '—'}</td>
                  <td className="text-xs">
                    {e.contactEmail ? (
                      <span className="font-mono">{e.contactEmail}</span>
                    ) : (
                      <span className="text-base-content/40">—</span>
                    )}
                  </td>
                  <td>
                    {e.verified ? (
                      <span className="badge badge-success badge-sm gap-1">
                        <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" /> Verified
                      </span>
                    ) : e.rejected ? (
                      <span className="badge badge-error badge-sm gap-1">
                        <FontAwesomeIcon icon={faCircleXmark} className="h-3 w-3" /> Rejected
                      </span>
                    ) : (
                      <span className="badge badge-warning badge-sm gap-1">
                        <FontAwesomeIcon icon={faClock} className="h-3 w-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="font-mono text-xs">
                    {new Date(e.createdAt).toISOString().slice(0, 10)}
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/employers/${e.id}`}
                      className="link link-hover text-xs"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
