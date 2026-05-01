import { useTranslations } from 'next-intl';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { FaqAccordion } from './FaqAccordion';

export function Faq() {
    const t = useTranslations('landing.faq');
    const grantT = useTranslations('landing.faq.grant_card');

    return (
        <section id="faq" className="bg-base-100 w-full">
            <div className="mx-auto grid grid-cols-1 gap-16 px-5 py-24 md:px-8 md:py-28 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:gap-20 lg:px-20 lg:py-30">
                <div className="flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start">
                    <EyebrowLabel tone="soil" withRule>
                        {t('eyebrow')}
                    </EyebrowLabel>
                    <h2 className="text-base-content font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl lg:text-6xl">
                        {t('headline')}
                    </h2>
                    <p className="text-base-content  font-sans text-lg leading-relaxed">
                        {t('intro')}
                    </p>
                    <div className="card bg-base-300 mt-4">
                        <div className="card-body p-5 gap-2">
                            <p className="text-secondary label">{grantT('eyebrow')}</p>
                            <p className="card-title text-base-content font-serif text-lg font-medium leading-tight">
                                {grantT('headline')}
                            </p>
                            <p className="text-base-content font-sans text-sm">{grantT('body')}</p>
                        </div>
                    </div>
                </div>

                <FaqAccordion />
            </div>
        </section>
    );
}
