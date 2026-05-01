import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMobileScreen,
    faFileLines,
    faClock,
    faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';

const steps: { id: string; icon: IconDefinition; surface: 'bone' | 'moss' }[] = [
    { id: '1', icon: faMobileScreen, surface: 'bone' },
    { id: '2', icon: faFileLines, surface: 'bone' },
    { id: '3', icon: faClock, surface: 'bone' },
    { id: '4', icon: faCircleCheck, surface: 'moss' },
];

export function HowItWorks() {
    const t = useTranslations('landing.how');

    return (
        <section id="how" className="bg-base-200 w-full">
            <div className="mx-auto flex flex-col gap-16 px-5 py-24 md:px-8 md:py-28 lg:px-20 lg:py-30">
                <div className="flex flex-col gap-4">
                    <EyebrowLabel tone="soil" withRule>
                        {t('eyebrow')}
                    </EyebrowLabel>
                    <h2 className="text-base-content font-serif text-4xl font-semibold tracking-tight md:text-5xl">
                        {t('headline')}
                    </h2>
                </div>

                <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {steps.map(({ id, icon, surface }) => {
                        const isMoss = surface === 'moss';
                        const cardClass = isMoss
                            ? 'bg-primary text-primary-content'
                            : 'card-bordered bg-base-100 border-base-300';
                        const titleClass = isMoss ? 'text-primary-content' : 'text-base-content';
                        const bodyClass = isMoss ? 'text-primary-content/80' : 'text-base-content';
                        const detailClass = isMoss ? 'text-accent border-secondary' : 'text-secondary border-base-300';
                        const iconTone = isMoss ? 'text-accent' : 'text-primary';

                        return (
                            <li key={id} className={`card ${cardClass}`}>
                                <div className="card-body p-8 gap-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-accent font-serif text-6xl font-semibold leading-none tracking-tight">
                                            {String(id).padStart(2, '0')}
                                        </span>
                                        <FontAwesomeIcon icon={icon} className={`text-[40px] ${iconTone}`} />
                                    </div>
                                    <h3 className={`card-title font-serif text-2xl font-semibold tracking-tight ${titleClass}`}>
                                        {t(`step.${id}.title`)}
                                    </h3>
                                    <p className={`font-sans text-base leading-relaxed ${bodyClass}`}>
                                        {t(`step.${id}.body`)}
                                    </p>
                                    <p
                                        className={`mt-auto border-t border-dashed pt-3 font-mono text-xs ${detailClass}`}
                                    >
                                        {t(`step.${id}.tech`)}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}

