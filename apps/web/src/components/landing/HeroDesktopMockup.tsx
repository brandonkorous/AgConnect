import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faStar } from '@fortawesome/free-solid-svg-icons';
import { Wordmark } from '@/components/primitives/Wordmark';

export function HeroDesktopMockup() {
    const t = useTranslations('landing.hero.phone');

    return (
        <div className="mockup-window border-base-300 bg-base-100 w-full border shadow-2xl">
            <div className="border-base-300 bg-base-200 flex items-center gap-3 border-t px-4 py-2">
                <div className="border-base-300 bg-base-100 flex flex-1 items-center gap-2 border px-3 py-1.5">
                    <FontAwesomeIcon icon={faLock} className="text-secondary text-[10px]" />
                    <span className="text-secondary font-mono text-xs">agconn.com/jobs</span>
                </div>
                <Wordmark size="sm" tone="ink" />
            </div>

            <div className="grid grid-cols-[180px_1fr]">
                <div className="border-base-300 flex flex-col gap-4 border-r p-4" aria-hidden>
                    <span className="label text-secondary">Counties</span>
                    <ul className="menu menu-sm gap-1 p-0">
                        <li>
                            <a className="bg-primary text-primary-content active rounded-none">Fresno · 48</a>
                        </li>
                        <li>
                            <a className="rounded-none">Tulare · 31</a>
                        </li>
                        <li>
                            <a className="rounded-none">Kern · 22</a>
                        </li>
                        <li>
                            <a className="rounded-none">Madera · 19</a>
                        </li>
                        <li>
                            <a className="rounded-none">Kings · 14</a>
                        </li>
                    </ul>
                    <div className="border-base-300 border-t pt-3">
                        <span className="label text-secondary">Verified</span>
                        <ul className="mt-2 flex flex-col gap-2">
                            <li>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        defaultChecked
                                        className="checkbox checkbox-xs checkbox-primary"
                                    />
                                    <span className="text-base-content text-xs">FLC</span>
                                </label>
                            </li>
                            <li>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        defaultChecked
                                        className="checkbox checkbox-xs checkbox-primary"
                                    />
                                    <span className="text-base-content text-xs">Grower</span>
                                </label>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col gap-3 p-4">
                    <div className="flex items-center justify-between pb-1">
                        <p className="text-base-content font-serif text-lg font-semibold tracking-tight">
                            {t('jobs_near')}
                        </p>
                        <span className="badge badge-ghost text-xs">142 results</span>
                    </div>

                    <article className="card card-bordered border-base-300 bg-base-100">
                        <div className="card-body p-3 gap-2">
                            <div className="flex items-center justify-between">
                                <div className="badge badge-primary gap-1.5">
                                    <FontAwesomeIcon icon={faStar} className="text-accent text-[10px]" />
                                    <span className="text-xs font-semibold tracking-wider">
                                        {t('verified_flc')}
                                    </span>
                                </div>
                                <span className="text-secondary font-mono text-xs">{t('distance')}</span>
                            </div>
                            <p className="text-base-content font-serif text-base font-semibold leading-tight">
                                {t('job_title')}
                            </p>
                            <p className="text-secondary font-sans text-xs">{t('employer')}</p>
                            <div className="border-base-300 mt-1 flex items-center justify-between border-t pt-2">
                                <span className="text-primary font-serif text-sm font-semibold">{t('wage')}</span>
                                <button type="button" className="btn btn-primary ">
                                    {t('apply')}
                                </button>
                            </div>
                        </div>
                    </article>

                    <article className="card card-bordered border-base-300 bg-base-100">
                        <div className="card-body p-3 gap-2">
                            <div className="flex items-center justify-between">
                                <span className="badge badge-accent text-xs font-semibold tracking-wider">
                                    {t('training_label')}
                                </span>
                                <span className="text-secondary font-mono text-xs">{t('spots')}</span>
                            </div>
                            <p className="text-base-content font-serif text-base font-semibold leading-tight">
                                {t('training_title')}
                            </p>
                            <p className="text-secondary font-sans text-xs">{t('training_meta')}</p>
                        </div>
                    </article>
                </div>
            </div>
        </div>
    );
}
