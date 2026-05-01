import { useTranslations } from 'next-intl';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { AudienceCard } from './AudienceCard';

export function AudienceSplit() {
    const t = useTranslations('landing.audience');

    return (
        <section id="workers" className="bg-base-100 w-full">
            <div className="container mx-auto px-5 py-24 md:px-8 md:py-28 lg:px-20 lg:py-30">
                <div className="flex flex-col items-center align-middle gap-10 pb-16 lg:flex-row lg:gap-16">
                    <div className="flex flex-1 flex-col gap-5">
                        <EyebrowLabel tone="soil" withRule>
                            {t('eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-4xl font-medium tracking-tight md:text-6xl lg:text-6xl">
                            {t('headline')}
                        </h2>
                    </div>
                    <p className="text-base-content flex-1 font-sans text-lg leading-relaxed pb-2">
                        {t('intro')}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <AudienceCard
                        surface="moss"
                        eyebrow={t('workers.eyebrow')}
                        headline={t('workers.headline')}
                        bullets={[
                            t('workers.bullet1'),
                            t('workers.bullet2'),
                            t('workers.bullet3'),
                            t('workers.bullet4'),
                        ]}
                        ctaText={t('workers.cta')}
                        ctaHref="#final-cta"
                    />
                    <AudienceCard
                        surface="bone"
                        eyebrow={t('employers.eyebrow')}
                        headline={t('employers.headline')}
                        bullets={[
                            t('employers.bullet1'),
                            t('employers.bullet2'),
                            t('employers.bullet3'),
                            t('employers.bullet4'),
                        ]}
                        ctaText={t('employers.cta')}
                        ctaHref="#employers"
                    />
                    <AudienceCard
                        surface="sage"
                        eyebrow={t('training.eyebrow')}
                        headline={t('training.headline')}
                        bullets={[
                            t('training.bullet1'),
                            t('training.bullet2'),
                            t('training.bullet3'),
                            t('training.bullet4'),
                        ]}
                        ctaText={t('training.cta')}
                        ctaHref="#training-orgs"
                    />
                </div>
            </div>
        </section>
    );
}
