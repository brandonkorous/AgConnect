import Link from 'next/link';
import { fetchFlags } from '@/lib/system-api';
import { FlagToggle } from './FlagToggle';
import { AddTenantOverride } from './AddTenantOverride';

export const metadata = { title: 'Feature flags — AgConn Admin' };
export const dynamic = 'force-dynamic';

export default async function FlagsPage() {
  const result = await fetchFlags();

  return (
    <div className="space-y-4">
      <div className="text-xs">
        <Link href="/system" className="link link-hover text-base-content/60">
          ← System
        </Link>
      </div>
      <div>
        <p className="eyebrow text-base-content/60">Platform</p>
        <h1 className="font-serif text-2xl font-medium tracking-tight">Feature flags</h1>
        <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
          Toggle features for the whole platform, or override per tenant. Code defines the
          list of known flags; this page sets state.
        </p>
      </div>

      {!result.ok ? (
        <div role="alert" className="alert alert-error">
          <span>
            {result.error.code} — {result.error.message}
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {result.data.flags.map((f) => (
            <section
              key={f.key}
              className="bg-base-100 border-base-300 overflow-hidden rounded-box border"
            >
              <header className="bg-base-200 border-base-300 flex items-baseline justify-between border-b px-4 py-2.5">
                <div>
                  <h2 className="font-mono text-xs font-semibold tracking-tight">{f.key}</h2>
                  <p className="text-base-content/60 mt-0.5 text-[11px]">{f.label}</p>
                </div>
              </header>
              <div className="divide-base-200 divide-y">
                <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <div className="text-xs">
                    <span className="badge badge-ghost badge-sm">platform default</span>
                  </div>
                  <FlagToggle
                    flagKey={f.key}
                    tenantId={null}
                    rowId={f.platform?.id ?? null}
                    enabled={f.platform?.enabled ?? false}
                    notes={f.platform?.notes ?? null}
                    variant="platform"
                  />
                </div>
                {f.tenantOverrides.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <div className="text-xs">
                      <span className="badge badge-info badge-sm">{o.tenantName}</span>
                      <span className="text-base-content/40 ml-2 font-mono text-[10px]">
                        {o.tenantSlug}
                      </span>
                    </div>
                    <FlagToggle
                      flagKey={f.key}
                      tenantId={o.tenantId}
                      rowId={o.id}
                      enabled={o.enabled}
                      notes={o.notes}
                      variant="override"
                    />
                  </div>
                ))}
                <div className="px-4 py-2">
                  <AddTenantOverride
                    flagKey={f.key}
                    tenants={result.data.tenants}
                    excludeTenantIds={f.tenantOverrides.map((o) => o.tenantId)}
                  />
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
