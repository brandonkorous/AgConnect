'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

type Props = { locale: string };

export function EmployerSearchBox({ locale }: Props) {
  const t = useTranslations('employer.shell.topbar');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (!isCmdK) return;
      e.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    const path = (q
      ? `/${locale}/employer/jobs?q=${encodeURIComponent(q)}`
      : `/${locale}/employer/jobs`) as Route;
    router.push(path);
  }

  return (
    <form onSubmit={submit} className="flex flex-1 items-center" role="search">
      <label className="bg-base-100 border-base-300 text-base-content/60 focus-within:border-primary flex w-[360px] items-center gap-2.5 rounded-full border px-3.5 py-2">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3.5 w-3.5" />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('search_placeholder')}
          aria-label={t('search_placeholder')}
          className="placeholder:text-base-content/60 text-base-content flex-1 border-0 bg-transparent text-sm outline-none"
        />
        <kbd className="kbd kbd-sm ml-auto">{t('search_kbd')}</kbd>
      </label>
    </form>
  );
}
