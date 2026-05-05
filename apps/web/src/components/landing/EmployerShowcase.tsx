import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faTableCells, faHouse } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { EmployerDashboardMock } from './EmployerDashboardMock';

const bullets: { id: string; icon: IconDefinition }[] = [
    { id: '1', icon: faList },
    { id: '2', icon: faTableCells },
    { id: '3', icon: faHouse },
];

export function EmployerShowcase() {
    const t = useTranslations('landing.employer_showcase');

    return (
        <section id="employers" className="bg-neutral text-neutral-content w-full">
            <div className="mx-auto grid grid-cols-1 items-start gap-16 px-5 py-24 md:px-8 md:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-20 lg:px-20 lg:py-30">
                <div className="flex flex-col gap-8">
                    <div className="flex items-center gap-3.5">
                        <span className="bg-accent h-px w-8 shrink-0" aria-hidden />
                        <span className="text-accent eyebrow">{t('eyebrow')}</span>
                    </div>
                    <h2 className="font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl lg:text-6xl">
                        {t('headline')}
                    </h2>
                    <p className="text-neutral-content/70  font-sans text-lg leading-relaxed">{t('body')}</p>

                    <ul className="flex flex-col gap-5 pt-2">
                        {bullets.map(({ id, icon }) => (
                            <li key={id} className="flex items-start gap-4">
                                <span className="bg-accent text-accent-content flex size-12 shrink-0 items-center justify-center">
                                    <FontAwesomeIcon icon={icon} className="text-xl" />
                                </span>
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-neutral-content font-serif text-xl font-semibold">
                                        {t(`bullet${id}.title`)}
                                    </h3>
                                    <p className="text-neutral-content/70 font-sans leading-relaxed">
                                        {t(`bullet${id}.body`)}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="flex flex-wrap gap-3.5 pt-2">
                        <a href="#final-cta" className="btn btn-accent btn-lg">
                            {t('cta.primary')}
                        </a>
                        <a href="mailto:sales@agconn.com" className="btn btn-outline btn-accent btn-lg">
                            {t('cta.secondary')}
                        </a>
                    </div>
                </div>

                <div className="flex justify-center lg:justify-end">
                    <EmployerDashboardMock />
                </div>
            </div>
        </section>
    );
}

