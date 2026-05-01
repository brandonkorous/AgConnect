import { useTranslations } from 'next-intl';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { FeaturedProgramCard } from './FeaturedProgramCard';

const programIds = ['1', '2', '3', '4'] as const;

export function FeaturedTraining() {
    const t = useTranslations('landing.featured_training');

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
                    <p className="text-base-content  flex-1 font-sans text-lg leading-relaxed lg:pb-2">
                        {t('body')}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {programIds.map((id) => (
                        <FeaturedProgramCard key={id} id={id} />
                    ))}
                </div>
            </div>
        </section>
    );
}
