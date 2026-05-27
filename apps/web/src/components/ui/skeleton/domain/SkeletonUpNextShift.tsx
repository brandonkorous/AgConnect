'use client';

import { Skeleton } from '../Skeleton';

export function SkeletonUpNextShift() {
  return (
    <section
      className="bg-neutral text-neutral-content relative mb-7 overflow-hidden rounded-3xl p-6"
      aria-hidden
    >
      <Skeleton h="0.75rem" w="10rem" className="mb-3 opacity-30" />
      <Skeleton h="2.5rem" w="60%" className="mb-4 opacity-30" />
      <div className="flex gap-3">
        <Skeleton h="1rem" w="8rem" className="opacity-25" />
        <Skeleton h="1rem" w="6rem" className="opacity-25" />
        <Skeleton h="1rem" w="7rem" className="opacity-25" />
      </div>
    </section>
  );
}
