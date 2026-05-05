import { useLocale, useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { WaitlistForm } from './WaitlistForm';

export function FinalCta() {
    const t = useTranslations('landing.final');
    const locale = useLocale();

    return (
        <section id="final-cta" className="bg-primary text-primary-content relative w-full overflow-clip">
            {/* <BackgroundSun /> */}
            <div className="relative container mx-auto grid grid-cols-1 gap-16 px-5 py-24 md:px-8 md:py-28 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:px-20 lg:py-30">
                <div className="flex flex-col gap-8">
                    <EyebrowLabel tone="honey" withRule>
                        {t('eyebrow')}
                    </EyebrowLabel>
                    <h2 className="text-primary-content font-serif text-5xl font-semibold leading-tight tracking-tight md:text-6xl lg:text-7xl">
                        {t('headline')}
                    </h2>
                    <p className="text-primary-content/70 font-sans text-lg leading-relaxed">{t('body')}</p>
                </div>

                <div className="flex flex-col gap-5">
                    <WorkerCard locale={locale} />
                    <EmployerCard locale={locale} />
                </div>
            </div>
        </section>
    );
}

function WorkerCard({ locale }: { locale: string }) {
    const t = useTranslations('landing.final.workers');
    return (
        <div className="card bg-base-100">
            <div className="card-body p-8 gap-4">
                <p className="text-secondary eyebrow">{t('eyebrow')}</p>
                <p className="card-title text-base-content font-serif text-2xl font-semibold tracking-tight leading-tight">
                    {t('headline')}
                </p>
                <WaitlistForm
                    audience="worker"
                    title=""
                    inputLabel={t('label')}
                    inputPlaceholder={t('placeholder')}
                    ctaText={t('cta')}
                    helpText={t('help')}
                    successText={t('success')}
                />
                <a
                    href={`/${locale}/worker/sign-up`}
                    className="link link-hover text-secondary text-sm"
                >
                    {t('signup_direct')}
                </a>
            </div>
        </div>
    );
}

function EmployerCard({ locale }: { locale: string }) {
    const t = useTranslations('landing.final.employers');
    return (
        <div className="card card-bordered bg-neutral text-neutral-content border-secondary">
            <div className="card-body p-8 gap-4">
                <p className="text-accent eyebrow">{t('eyebrow')}</p>
                <div className='flex'>
                    <p className="card-title text-neutral-content font-serif text-2xl font-semibold tracking-tight leading-tight">
                        {t('headline')}
                    </p>
                    <a href={`/${locale}/employer/sign-up`} className="btn btn-accent">
                        <span>{t('cta')}</span>
                        <FontAwesomeIcon icon={faArrowRight} className="text-neutral" />
                    </a>
                </div>
                <p className="text-neutral-content/70 font-sans text-xs">{t('help')}</p>
            </div>
        </div>
    );
}

function BackgroundSun() {
    return (
        <svg
            className="text-secondary absolute top-20 right-20 opacity-40"
            width="280"
            height="280"
            viewBox="0 0 92 92"
            aria-hidden
        >
            <circle cx="46" cy="46" r="46" fill="currentColor" />
            <path
                d="M46 18 C62 28 64 46 58 60 C52 70 46 76 46 76 C46 76 40 70 34 60 C28 46 30 28 46 18 Z"
                className="text-accent"
                fill="currentColor"
            />
        </svg>
    );
}
