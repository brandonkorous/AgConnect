import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';

const tiles = [
    { id: 'workers', value: '2,400+' },
    { id: 'wage', value: '$19.50' },
    { id: 'retention', value: '87%' },
    { id: 'certs', value: '1,180' },
];

export function ImpactNumbers() {
    const t = useTranslations('landing.impact');

    return (
        <section className="bg-primary text-primary-content w-full">
            <div className="container mx-auto flex flex-col gap-16 px-5 py-24 md:px-8 md:py-28 lg:px-20 lg:py-30">
                <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-end lg:gap-16">
                    <div className="flex flex-1 flex-col gap-4">
                        <EyebrowLabel tone="honey" withRule>
                            {t('eyebrow')}
                        </EyebrowLabel>
                        <h2 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">
                            {t('headline')}
                        </h2>
                    </div>
                    <p className="text-primary-content/70 flex-1 font-sans text-base leading-relaxed lg:pb-4">
                        {t('body')}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {tiles.map((tile, i) => (
                        <div
                            key={tile.id}
                            className={`flex flex-col gap-3 px-8 py-9 ${i < tiles.length - 1 ? 'border-secondary lg:border-r' : ''
                                }`}
                        >
                            <p className="text-accent font-serif text-5xl font-semibold leading-none tabular-nums tracking-tight md:text-6xl">
                                {tile.value}
                            </p>
                            <p className="text-primary-content font-sans text-base font-semibold">{t(`tile.${tile.id}.label`)}</p>
                            <p className="text-primary-content/70 font-sans text-sm leading-relaxed">
                                {t(`tile.${tile.id}.body`)}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="border-secondary flex flex-col items-start gap-4 border-t pt-6 lg:flex-row lg:items-center lg:gap-6">
                    <p className="text-primary-content/70 font-sans text-sm">{t('cta.dashboard')}</p>
                    <a href="/impact" className="btn btn-accent ">
                        <span>{t('cta.link')}</span>
                        <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                    </a>
                    <p className="text-accent font-mono text-xs tracking-wider lg:ml-auto">
                        {t('source')}
                    </p>
                </div>
            </div>
        </section>
    );
}
