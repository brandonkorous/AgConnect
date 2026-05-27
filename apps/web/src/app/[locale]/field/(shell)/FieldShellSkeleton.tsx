'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function FieldShellSkeleton() {
  return (
    <div className="bg-base-200 min-h-screen" aria-hidden>
      <div className="bg-base-100 border-base-300 h-14 border-b flex items-center px-4 gap-3">
        <Skeleton h="1.5rem" w="40%" />
      </div>
      <main className="mx-auto max-w-md px-4 pb-32 pt-4 space-y-3">
        <Skeleton h="2rem" w="60%" />
        <Skeleton h="1rem" w="80%" />
        <Skeleton h="8rem" />
        <Skeleton h="8rem" />
      </main>
    </div>
  );
}
