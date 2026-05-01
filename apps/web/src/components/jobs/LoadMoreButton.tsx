'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Route } from 'next';

type Props = { cursor: string; pageSize: number };

export function LoadMoreButton({ cursor, pageSize }: Props) {
  const t = useTranslations('worker.jobs.browse');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function loadMore() {
    const next = new URLSearchParams(searchParams);
    next.set('cursor', cursor);
    router.push(`${pathname}?${next.toString()}#more` as Route);
  }

  return (
    <button
      type="button"
      onClick={loadMore}
      className="border-base-300 rounded-full border bg-white px-5 py-2.5 text-[13px] font-semibold"
    >
      {t('load_more', { n: pageSize })}
    </button>
  );
}
