'use client';

import { Skeleton } from '../Skeleton';

function AppRow() {
  return (
    <div
      className="grid grid-cols-[1.2fr_1.2fr_0.7fr_0.7fr_0.9fr_0.5fr] items-center gap-4 px-5 py-3.5"
      aria-hidden
    >
      <div className="flex items-center gap-2.5">
        <Skeleton w="2rem" h="2rem" r="0.5rem" />
        <Skeleton h="1rem" w="80%" />
      </div>
      <Skeleton h="0.875rem" w="80%" />
      <Skeleton h="0.875rem" w="60%" />
      <Skeleton h="1rem" w="50%" />
      <Skeleton w="4.5rem" h="1.25rem" r="9999px" />
      <Skeleton w="1rem" h="1rem" className="justify-self-end" />
    </div>
  );
}

export function SkeletonApplicationsPanel() {
  return (
    <section
      className="bg-base-100 border-base-300 overflow-hidden rounded-2xl border"
      aria-hidden
    >
      <header className="border-base-300 flex items-center justify-between border-b px-5 py-4">
        <div>
          <Skeleton h="1.5rem" w="9rem" className="mb-2" />
          <Skeleton h="0.75rem" w="14rem" />
        </div>
        <Skeleton h="1rem" w="5rem" />
      </header>
      <div className="border-base-300 border-b px-5 py-3">
        <Skeleton h="0.625rem" w="100%" />
      </div>
      <div className="divide-y divide-base-300">
        {Array.from({ length: 4 }).map((_, i) => (
          <AppRow key={i} />
        ))}
      </div>
    </section>
  );
}
