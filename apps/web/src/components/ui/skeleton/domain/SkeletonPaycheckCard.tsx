'use client';

import { Skeleton } from '../Skeleton';

export function SkeletonPaycheckCard() {
  return (
    <section
      className="bg-primary text-primary-content relative overflow-hidden rounded-2xl p-5"
      aria-hidden
    >
      <Skeleton h="0.75rem" w="9rem" className="mb-3 opacity-25" />
      <div className="flex items-end justify-between gap-3 mb-3">
        <Skeleton h="2.5rem" w="65%" className="opacity-25" />
        <div className="text-right">
          <Skeleton h="0.75rem" w="3.5rem" className="mb-1 opacity-25" />
          <Skeleton h="0.875rem" w="2.5rem" className="ml-auto opacity-25" />
        </div>
      </div>
      <div className="flex justify-between border-t border-white/20 pt-3.5">
        <div className="space-y-1">
          <Skeleton h="0.625rem" w="3.5rem" className="opacity-25" />
          <Skeleton h="0.75rem" w="2.5rem" className="opacity-25" />
        </div>
        <div className="space-y-1">
          <Skeleton h="0.625rem" w="3.5rem" className="opacity-25" />
          <Skeleton h="0.75rem" w="2.5rem" className="opacity-25" />
        </div>
        <div className="space-y-1">
          <Skeleton h="0.625rem" w="3.5rem" className="opacity-25" />
          <Skeleton h="0.75rem" w="2.5rem" className="opacity-25" />
        </div>
      </div>
      <Skeleton h="2.25rem" w="100%" className="mt-3.5 opacity-25" />
    </section>
  );
}
