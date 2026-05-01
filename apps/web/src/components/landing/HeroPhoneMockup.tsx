import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { Wordmark } from '@/components/primitives/Wordmark';

export function HeroPhoneMockup() {
    const t = useTranslations('landing.hero.phone');

    return (
        <div className="mockup-phone">
            <div className="mockup-phone-camera"></div>
            <div className="mockup-phone-display bg-base-100">
                <div className="flex flex-col px-5 pt-12 pb-5">
                    <div className="flex items-center justify-between pb-4">
                        <Wordmark size="sm" tone="ink" />
                        <span className="badge badge-ghost bg-base-300 text-secondary border-0 font-medium tracking-wide">
                            {t('lang_pill')}
                        </span>
                    </div>

                    <div className="pb-4">
                        <p className="text-base-content font-sans text-base font-medium leading-tight">
                            {t('greeting')}
                        </p>
                        <p className="text-primary font-serif text-2xl leading-tight font-semibold tracking-tight">
                            {t('jobs_near')}
                        </p>
                    </div>

                    <div className="card card-bordered border-base-300 mb-3 bg-base-100">
                        <div className="card-body p-4 gap-0">
                            <div className="flex items-center justify-between">
                                <div className="badge badge-primary gap-1.5">
                                    <FontAwesomeIcon icon={faStar} className="text-accent text-[10px]" />
                                    <span className="font-semibold tracking-wider">{t('verified_flc')}</span>
                                </div>
                                <span className="text-secondary font-mono text-xs">{t('distance')}</span>
                            </div>
                            <p className="text-base-content mt-3 font-serif text-lg font-semibold leading-tight">
                                {t('job_title')}
                            </p>
                            <p className="text-secondary mt-1 font-sans text-sm">{t('employer')}</p>
                            <div className="border-base-300 mt-3 flex items-center justify-between border-t pt-3">
                                <span className="text-primary font-serif text-base font-semibold">
                                    {t('wage')}
                                </span>
                                <button type="button" className="btn btn-primary ">
                                    {t('apply')}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="card card-bordered border-base-300 bg-base-100">
                        <div className="card-body p-4 gap-0">
                            <div className="flex items-center justify-between">
                                <span className="badge badge-accent font-semibold tracking-wider">
                                    {t('training_label')}
                                </span>
                                <span className="text-secondary font-mono text-xs">{t('spots')}</span>
                            </div>
                            <p className="text-base-content mt-3 font-serif text-lg font-semibold leading-tight">
                                {t('training_title')}
                            </p>
                            <p className="text-secondary mt-1 font-sans text-sm">{t('training_meta')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
