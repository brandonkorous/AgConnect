'use client';

import { Skeleton } from '../Skeleton';

function JobCardPlaceholder() {
  return (
    <div className="border-base-300 bg-base-100 rounded-2xl border p-4" aria-hidden>
      <div className="flex items-center gap-3 mb-3">
        <Skeleton w="2.25rem" h="2.25rem" r="0.5rem" />
        <div className="flex-1 min-w-0">
          <Skeleton h="1.1rem" w="70%" className="mb-1" />
          <Skeleton h="0.75rem" w="40%" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <Skeleton w="3.5rem" h="1.25rem" r="9999px" />
        <Skeleton w="4rem" h="1.25rem" r="9999px" />
        <Skeleton w="3rem" h="1.25rem" r="9999px" />
      </div>
      <Skeleton h="0.875rem" w="50%" />
    </div>
  );
}

export function SkeletonMatchedJobs() {
  return (
    <section>
      <header className="mb-3.5 flex items-end justify-between gap-3">
        <div>
          <Skeleton h="1.5rem" w="12rem" className="mb-2" />
          <Skeleton h="0.875rem" w="18rem" />
        </div>
      </header>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <JobCardPlaceholder key={i} />
        ))}
      </div>
    </section>
  );
}
