'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faRotate } from '@fortawesome/free-solid-svg-icons';

type Props = { start: string; end: string };

const REFRESH_MS = 60_000;

export function KpiActions({ start, end }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const autoRefresh = params.get('autoRefresh') === '1';

  const [lastTick, setLastTick] = useState<number>(Date.now());

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => {
      setLastTick(Date.now());
      router.refresh();
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [autoRefresh, router]);

  function toggleAutoRefresh() {
    const sp = new URLSearchParams(params.toString());
    if (autoRefresh) sp.delete('autoRefresh');
    else sp.set('autoRefresh', '1');
    router.replace(`?${sp.toString()}`);
  }

  const exportQs = new URLSearchParams();
  exportQs.set('start', start);
  exportQs.set('end', end);
  for (const c of params.getAll('counties')) exportQs.append('counties', c);
  for (const t of params.getAll('tenantIds')) exportQs.append('tenantIds', t);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleAutoRefresh}
        className={`btn btn-sm rounded-full ${autoRefresh ? 'btn-primary' : 'btn-ghost'}`}
        aria-pressed={autoRefresh}
      >
        <FontAwesomeIcon
          icon={faRotate}
          className={`h-3.5 w-3.5 ${autoRefresh ? 'animate-pulse' : ''}`}
        />
        Auto-refresh {autoRefresh ? 'on' : 'off'}
      </button>
      {autoRefresh && (
        <span className="text-base-content/55 font-mono text-xs">
          {new Date(lastTick).toLocaleTimeString()}
        </span>
      )}
      <a
        href={`/api/export/kpi/export.csv?${exportQs.toString()}`}
        className="btn btn-sm btn-ghost rounded-full"
      >
        <FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5" />
        Export CSV
      </a>
    </div>
  );
}
