'use client';

import { Skeleton } from '../Skeleton';

function MessageRow({ last }: { last?: boolean }) {
  return (
    <li
      className={`flex gap-2.5 px-4 py-3 ${last ? '' : 'border-base-300 border-b'}`}
      aria-hidden
    >
      <Skeleton w="1.75rem" h="1.75rem" r="9999px" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <Skeleton h="0.875rem" w="40%" />
          <Skeleton h="0.625rem" w="2rem" />
        </div>
        <Skeleton h="0.875rem" w="85%" />
      </div>
    </li>
  );
}

export function SkeletonMessagesCard() {
  return (
    <section className="bg-base-100 border-base-300 rounded-2xl border" aria-hidden>
      <header className="border-base-300 flex items-center justify-between border-b px-4 py-3.5">
        <Skeleton h="1.125rem" w="6rem" />
      </header>
      <ul>
        <MessageRow />
        <MessageRow />
        <MessageRow last />
      </ul>
    </section>
  );
}
