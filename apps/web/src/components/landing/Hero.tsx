import { useLocale, useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { HeroPhoneMockup } from './HeroPhoneMockup';
import { HeroDesktopMockup } from './HeroDesktopMockup';
import { HeroTrustStrip } from './HeroTrustStrip';

export function Hero() {
    const t = useTranslations('landing.hero');
    const locale = useLocale();

    return (
        <section id="main" className="bg-base-100 w-full">
            <div className="container mx-auto grid grid-cols-1 gap-12 px-5 pt-16 pb-20 md:px-8 md:pt-20 md:pb-24 lg:grid-cols-2 lg:gap-12 lg:px-20 lg:pt-24 lg:pb-28">
                <div className="flex flex-col gap-9 lg:pt-6">
                    <div className="badge badge-lg bg-base-300 text-primary border-0 gap-2 rounded-full font-semibold">
                        <span className="bg-primary h-1.5 w-1.5 shrink-0 rounded-full" aria-hidden />
                        {t('now_serving')}
                    </div>

                    <h1 className="text-base-content font-serif text-5xl font-semibold leading-tight tracking-tight sm:text-6xl md:text-6xl lg:text-7xl">
                        {t('headline')}
                    </h1>

                    <p className="text-base-content  font-sans text-lg leading-relaxed md:text-xl">
                        {t('subhead')}
                    </p>

                    <div className="flex flex-wrap gap-3.5 pt-2">
                        <a href={`/${locale}/sign-up?role=worker`} className="btn btn-primary btn-lg">
                            {t('cta.primary')}
                            <FontAwesomeIcon icon={faArrowRight} className="text-base" />
                        </a>
                        <a href={`/${locale}/sign-up?role=employer`} className="btn btn-outline btn-primary btn-lg">
                            {t('cta.secondary')}
                        </a>
                    </div>

                    <HeroTrustStrip />
                </div>

                <div className="flex items-center justify-center pt-6 lg:pt-12">
                    <div className="lg:hidden">
                        <HeroPhoneMockup />
                    </div>
                    <div className="hidden w-full lg:block">
                        <HeroDesktopMockup />
                    </div>
                </div>
            </div>
        </section>
    );
}
