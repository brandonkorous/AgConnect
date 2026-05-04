'use client';

import type { Route } from 'next';
import { useRef, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDay } from '@fortawesome/free-solid-svg-icons';

type Props = { value: string; basePath: string };

export function WeekJumper({ value, basePath }: Props) {
  const t = useTranslations('employer.crews.week_nav');
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (!v) return;
    router.push(`${basePath}?week=${v}` as Route);
  }

  function trigger() {
    const el = ref.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') el.showPicker();
    else el.focus();
  }

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={trigger}
        className="text-base-content/60 hover:text-base-content inline-flex items-center gap-1.5 text-xs"
      >
        <FontAwesomeIcon icon={faCalendarDay} className="h-3 w-3" />
        {t('jump_label')}
      </button>
      <input
        ref={ref}
        type="date"
        defaultValue={value}
        onChange={onChange}
        aria-label={t('jump_label')}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
      />
    </span>
  );
}
