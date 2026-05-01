import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';

const avatars = [
    { initial: 'M', bg: 'bg-accent', fg: 'text-accent-content' },
    { initial: 'J', bg: 'bg-primary', fg: 'text-primary-content' },
    { initial: 'P', bg: 'bg-secondary', fg: 'text-secondary-content' },
    { initial: 'L', bg: 'bg-base-300', fg: 'text-base-content' },
];

export function HeroTrustStrip() {
    const t = useTranslations('landing.hero.trust');

    return (
        <div className="flex items-center gap-4 pt-4">
            <div className="avatar-group -space-x-2.5 rtl:space-x-reverse">
                {avatars.map((a) => (
                    <div
                        key={a.initial}
                        className={`avatar placeholder border-base-100 flex h-10 w-10 items-center justify-center rounded-full border-2 ${a.bg} ${a.fg}`}
                    >
                        <span className="font-serif text-sm font-semibold">{a.initial}</span>
                    </div>
                ))}
            </div>
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <FontAwesomeIcon
                            key={i}
                            icon={faStar}
                            className="text-accent text-sm"
                        />
                    ))}
                    <span className="text-base-content ml-1 font-sans text-sm font-semibold">{t('rating')}</span>
                </div>
                <p className="text-secondary font-sans text-sm leading-snug">{t('line')}</p>
            </div>
        </div>
    );
}
