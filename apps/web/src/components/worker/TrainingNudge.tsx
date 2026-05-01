import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faArrowRight } from '@fortawesome/free-solid-svg-icons';

export function TrainingNudge() {
    const t = useTranslations('worker.dashboard.training');

    return (
        <section className="bg-base-100 border-base-300 rounded-2xl border p-4">
            <div className="mb-3 flex items-center gap-2.5">
                <FontAwesomeIcon icon={faGraduationCap} className="text-primary h-4 w-4" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-base-content/60">
                    {t('eyebrow')}
                </span>
            </div>
            <p className="font-serif text-lg font-medium leading-snug tracking-tight">
                {t('headline_lead')}{' '}
                <strong className="text-primary font-semibold">{t('headline_amount')}</strong>{' '}
                {t('headline_tail')}
            </p>
            <p className="text-base-content/60 mt-2 text-xs">{t('meta')}</p>
            <button type="button" className="btn btn-neutral btn-sm mt-3.5">
                {t('enroll')}
                <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
            </button>
        </section>
    );
}
