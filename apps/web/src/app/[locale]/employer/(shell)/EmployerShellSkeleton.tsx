'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function EmployerShellSkeleton() {
  return (
    <div className="flex min-h-screen items-start" aria-hidden>
      <div className="print:hidden hidden md:flex">
        <div className="bg-base-100 border-base-300 sticky top-0 min-h-screen w-[248px] shrink-0 flex-col gap-1 border-r p-4 pb-6 flex">
          <Skeleton h="2.25rem" w="60%" className="mb-4" />
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} h="2.5rem" className="mb-1" />
          ))}
        </div>
      </div>
      <main className="min-w-0 flex-1 flex flex-col min-h-screen">
        <div className="bg-base-100 border-base-300 h-14 border-b md:hidden flex items-center px-4 gap-3">
          <Skeleton h="1.5rem" w="2rem" />
          <Skeleton h="1.25rem" w="40%" />
        </div>
        <div className="bg-base-100 border-base-300 h-14 border-b hidden md:flex" />
        <div className="px-5 pt-8 pb-16 flex flex-col gap-4">
          <Skeleton h="2rem" w="40%" />
          <Skeleton h="1rem" w="60%" />
        </div>
      </main>
    </div>
  );
}
