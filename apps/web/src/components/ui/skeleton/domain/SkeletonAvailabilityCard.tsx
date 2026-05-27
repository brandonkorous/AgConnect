'use client';

import { Skeleton } from '../Skeleton';

export function SkeletonAvailabilityCard() {
  return (
    <section className="bg-base-100 border-base-300 rounded-2xl border p-4" aria-hidden>
      <header className="flex items-start justify-between mb-3">
        <div>
          <Skeleton h="0.75rem" w="9rem" className="mb-1.5" />
          <Skeleton h="1.25rem" w="11rem" />
        </div>
        <Skeleton h="0.875rem" w="2.5rem" />
      </header>
      <ol className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <li key={i} className="bg-base-200 rounded-lg px-1 pb-2.5 pt-2 text-center">
            <Skeleton h="0.625rem" w="60%" className="mx-auto mb-1" />
            <Skeleton h="0.5rem" w="40%" className="mx-auto" />
          </li>
        ))}
      </ol>
      <Skeleton h="0.75rem" w="80%" className="mt-3" />
    </section>
  );
}
