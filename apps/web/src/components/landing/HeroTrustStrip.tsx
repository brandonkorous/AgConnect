import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { getImpact } from '@/lib/api/landing';

const avatars = [
    { initial: 'M', bg: 'bg-accent', fg: 'text-accent-content' },
    { initial: 'J', bg: 'bg-primary', fg: 'text-primary-content' },
    { initial: 'P', bg: 'bg-secondary', fg: 'text-secondary-content' },
    { initial: 'L', bg: 'bg-base-300', fg: 'text-base-content' },
];

function formatCount(n: number): string {
    return n.toLocaleString('en-US') + '+';
}

export async function HeroTrustStrip() {
    const t = await getTranslations('landing.hero.trust');
    const impact = await getImpact();

    const workers = impact?.workersTotal ?? null;
    const employers = impact?.verifiedEmployers ?? 0;

    const line =
        workers && employers > 0
            ? t('line_dynamic', {
                  workers: formatCount(workers),
                  employers: formatCount(employers),
              })
            : t('line_fallback');

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
                <p className="text-secondary font-sans text-sm leading-snug">{line}</p>
            </div>
        </div>
    );
}
