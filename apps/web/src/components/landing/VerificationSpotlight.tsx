import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { VerificationCard } from './VerificationCard';

const bullets = ['1', '2', '3'] as const;

export function VerificationSpotlight() {
    const t = useTranslations('landing.verification');

    return (
        <section className="bg-base-100 w-full">
            <div className="mx-auto grid grid-cols-1 items-center gap-16 px-5 py-24 md:px-8 md:py-28 lg:grid-cols-2 lg:gap-20 lg:px-20 lg:py-30">
                <div className="flex justify-center lg:justify-start">
                    <VerificationCard />
                </div>

                <div className="flex flex-col gap-8">
                    <EyebrowLabel tone="soil" withRule>
                        {t('eyebrow')}
                    </EyebrowLabel>
                    <h2 className="text-base-content font-serif text-4xl font-medium tracking-tight md:text-5xl lg:text-6xl">
                        {t('headline')}
                    </h2>
                    <p className="text-base-content  font-sans text-lg leading-relaxed">{t('body')}</p>

                    <ul className="flex flex-col gap-3.5 pt-2">
                        {bullets.map((b) => (
                            <li key={b} className="flex items-start gap-3.5">
                                <span className="bg-primary text-accent flex size-8 shrink-0 items-center justify-center rounded-full">
                                    <FontAwesomeIcon icon={faCheck} className="text-base" />
                                </span>
                                <span className="text-base-content font-sans text-base leading-snug">
                                    {t(`bullet${b}`)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
