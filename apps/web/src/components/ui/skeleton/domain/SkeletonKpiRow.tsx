'use client';

import { Skeleton } from '../Skeleton';

function KpiTile() {
  return (
    <div className="stat bg-base-100 border-base-300 rounded-2xl border" aria-hidden>
      <Skeleton h="0.75rem" w="50%" className="mb-3" />
      <Skeleton h="2.25rem" w="70%" className="mb-2" />
      <Skeleton h="0.75rem" w="40%" />
    </div>
  );
}

export function SkeletonKpiRow() {
  return (
    <div className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <KpiTile key={i} />
      ))}
    </div>
  );
}
