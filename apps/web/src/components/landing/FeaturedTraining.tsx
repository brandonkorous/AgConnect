import { getTranslations, getLocale } from 'next-intl/server';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { FeaturedProgramCard } from './FeaturedProgramCard';
import { getFeaturedTraining } from '@/lib/api/landing';

export async function FeaturedTraining() {
    const [t, locale, programs] = await Promise.all([
        getTranslations('landing.featured_training'),
        getLocale(),
        getFeaturedTraining(),
    ]);

    if (programs.length === 0) return null;

    return (
        <section className="bg-base-200 w-full">
            <div className="mx-auto flex flex-col gap-16 px-5 py-24 md:px-8 md:py-28 lg:px-20 lg:py-30">
                <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-end lg:gap-16">
                    <div className="flex flex-1 flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-4xl font-medium tracking-tight md:text-5xl lg:text-6xl">
                            {t('headline')}
                        </h2>
                    </div>
                    <p className="text-base-content flex-1 font-sans text-lg leading-relaxed lg:pb-2">
                        {t('body')}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {programs.map((program, i) => (
                        <FeaturedProgramCard
                            key={program.id}
                            program={program}
                            locale={locale as 'en' | 'es'}
                            featured={i === 0}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
