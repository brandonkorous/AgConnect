import { useTranslations } from 'next-intl';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { TestimonialCard } from './TestimonialCard';

const ids = ['1', '2', '3'] as const;

export function Testimonials() {
    const t = useTranslations('landing.testimonials');

    return (
        <section className="bg-base-100 w-full">
            <div className="container mx-auto flex flex-col gap-16 px-5 py-24 md:px-8 md:py-28 lg:px-20 lg:py-30">
                <div className="flex flex-col gap-4">
                    <EyebrowLabel tone="soil" withRule>
                        {t('eyebrow')}
                    </EyebrowLabel>
                    <h2 className="text-base-content font-serif text-4xl font-medium tracking-tight md:text-5xl lg:text-6xl">
                        {t('headline')}
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {ids.map((id) => (
                        <TestimonialCard key={id} id={id} />
                    ))}
                </div>
            </div>
        </section>
    );
}
