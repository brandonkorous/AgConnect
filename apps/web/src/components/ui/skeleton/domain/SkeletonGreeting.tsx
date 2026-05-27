'use client';

import { Skeleton } from '../Skeleton';

export function SkeletonGreeting() {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4" aria-hidden>
      <div>
        <Skeleton h="0.75rem" w="14rem" className="mb-2" />
        <Skeleton h="3rem" w="22rem" className="mb-2" />
        <Skeleton h="1rem" w="16rem" />
      </div>
    </header>
  );
}
