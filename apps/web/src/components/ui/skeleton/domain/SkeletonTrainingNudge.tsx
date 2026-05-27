'use client';

import { Skeleton } from '../Skeleton';

export function SkeletonTrainingNudge() {
  return (
    <section className="bg-base-100 border-base-300 rounded-2xl border p-4" aria-hidden>
      <div className="flex items-center gap-2.5 mb-3">
        <Skeleton w="1rem" h="1rem" r="0.125rem" />
        <Skeleton h="0.75rem" w="9rem" />
      </div>
      <Skeleton h="1.25rem" w="90%" className="mb-1" />
      <Skeleton h="1.25rem" w="65%" className="mb-2" />
      <Skeleton h="0.75rem" w="55%" className="mb-3.5" />
      <Skeleton h="2rem" w="6.5rem" r="9999px" />
    </section>
  );
}
