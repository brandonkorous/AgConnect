import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { APPLICATIONS, type StageKey } from './workerMockData';

const STAGE_BADGE: Record<StageKey, string> = {
    accepted: 'badge-success',
    interview: 'badge-warning',
    reviewed: 'badge-info',
    applied: 'badge-ghost',
};

export function ApplicationsPanel() {
    const t = useTranslations('worker.dashboard.apps');

    return (
        <section className="bg-base-100 border-base-300 overflow-hidden rounded-2xl border">
            <header className="border-base-300 flex items-center justify-between border-b px-5 py-4">
                <div>
                    <h2 className="font-serif text-2xl font-medium tracking-tight">{t('title')}</h2>
                    <p className="text-base-content/60 mt-0.5 text-xs">{t('subtitle')}</p>
                </div>
                <a
                    href="#"
                    className="text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline"
                >
                    {t('view_all')}
                    <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                </a>
            </header>

            <div
                role="row"
                className="border-base-300 text-base-content/60 grid grid-cols-[1.2fr_1.2fr_0.7fr_0.7fr_0.9fr_0.5fr] gap-4 border-b px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
            >
                <span>{t('cols.job')}</span>
                <span>{t('cols.employer')}</span>
                <span>{t('cols.start')}</span>
                <span>{t('cols.rate')}</span>
                <span>{t('cols.status')}</span>
                <span aria-hidden />
            </div>

            <ul>
                {APPLICATIONS.map((app, i) => (
                    <li
                        key={app.id}
                        className={[
                            'grid grid-cols-[1.2fr_1.2fr_0.7fr_0.7fr_0.9fr_0.5fr] items-center gap-4 px-5 py-3.5 text-sm',
                            i < APPLICATIONS.length - 1 ? 'border-base-300 border-b' : '',
                        ].join(' ')}
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="bg-base-200 grid h-8 w-8 shrink-0 place-items-center rounded-lg">
                                <FontAwesomeIcon icon={faLeaf} className="text-primary h-4 w-4" />
                            </div>
                            <div className="font-semibold">{app.title}</div>
                        </div>
                        <div className="text-base-content/70">{app.employer}</div>
                        <div className="font-mono text-sm font-semibold">{app.date}</div>
                        <div className="font-serif text-base font-medium tracking-tight">
                            {app.pay}
                        </div>
                        <div>
                            <span
                                className={`badge ${STAGE_BADGE[app.stage]} px-2 py-1 text-[10px] font-bold uppercase tracking-wider`}
                            >
                                {t(`stages.${app.stage}`)}
                            </span>
                        </div>
                        <div className="text-right">
                            <FontAwesomeIcon
                                icon={faArrowRight}
                                className="text-base-content/40 h-4 w-4"
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
