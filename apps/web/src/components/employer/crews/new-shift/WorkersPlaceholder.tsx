'use client';

import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';

export function WorkersPlaceholder() {
  const t = useTranslations('employer.crews.new_shift');

  return (
    <section
      id="workers"
      className="bg-base-100 border-base-300 mb-5 scroll-mt-24 rounded-2xl border p-6"
    >
      <header className="border-base-300 mb-5 border-b pb-4">
        <h2 className="font-display text-2xl font-light tracking-tight">
          {t('workers_placeholder.title')}
        </h2>
        <p className="text-base-content/60 mt-1 text-sm">{t('workers_placeholder.sub')}</p>
      </header>
      <div className="border-base-300 bg-base-200/40 flex flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center">
        <span className="bg-primary/10 text-primary grid h-10 w-10 place-items-center rounded-full">
          <FontAwesomeIcon icon={faUsers} className="h-4 w-4" />
        </span>
        <div className="text-sm font-semibold">{t('workers_placeholder.heading')}</div>
        <div className="text-base-content/60 max-w-xs text-xs leading-relaxed">
          {t('workers_placeholder.body')}
        </div>
      </div>
    </section>
  );
}
