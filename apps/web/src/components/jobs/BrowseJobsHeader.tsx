import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot, faBookmark } from '@fortawesome/free-solid-svg-icons';

type Props = {
  totalCount: number;
  county: string;
};

export function BrowseJobsHeader({ totalCount, county }: Props) {
  const t = useTranslations('worker.jobs.browse');
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <span className="text-base-content/60 font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">
          {t('eyebrow', { count: totalCount, county })}
        </span>
        <h1 className="font-serif mt-2 text-[32px] font-normal leading-[1.05] tracking-[-0.025em] sm:text-[44px]">
          {t.rich('headline', {
            shift: (chunks) => (
              <em className="text-primary font-light italic">{chunks}</em>
            ),
          })}
        </h1>
        <p className="text-base-content/70 mt-1.5 max-w-[640px] text-[14.5px]">
          {t('sub')}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="border-base-300 inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-2.5 text-[13px] font-semibold"
        >
          <FontAwesomeIcon icon={faLocationDot} className="h-3.5 w-3.5" />
          {t('map_view')}
        </button>
        <button
          type="button"
          className="bg-base-content text-base-100 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-[13px] font-medium"
        >
          <FontAwesomeIcon icon={faBookmark} className="h-3.5 w-3.5" />
          {t('save_search')}
        </button>
      </div>
    </div>
  );
}
