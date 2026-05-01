import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faComments,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';

type Props = {
  locale: string;
  canPublish: boolean;
};

export function EmployerTopBar({ locale, canPublish }: Props) {
  const t = useTranslations('employer.shell.topbar');

  return (
    <div className="bg-base-100/85 border-base-300 sticky top-0 z-20 flex h-16 items-center gap-4 border-b px-8 backdrop-blur-md backdrop-saturate-150">
      <div className="flex flex-1 items-center">
        <label className="bg-base-100 border-base-300 text-base-content/60 flex w-[360px] items-center gap-2.5 rounded-full border px-3.5 py-2">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3.5 w-3.5" />
          <input
            type="search"
            placeholder={t('search_placeholder')}
            aria-label={t('search_placeholder')}
            className="placeholder:text-base-content/60 flex-1 border-0 bg-transparent text-sm outline-none"
          />
          <span className="bg-base-200 text-base-content/60 ml-auto rounded px-1.5 py-0.5 font-mono text-[10px]">
            {t('search_kbd')}
          </span>
        </label>
      </div>

      <button
        type="button"
        className="btn btn-ghost btn-sm border-base-300 border"
      >
        <FontAwesomeIcon icon={faComments} className="h-3.5 w-3.5" />
        {t('help')}
      </button>

      {canPublish && (
        <Link
          href={`/${locale}/employer/jobs/new`}
          className="btn btn-primary btn-sm"
        >
          <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
          {t('post_job')}
        </Link>
      )}
    </div>
  );
}
