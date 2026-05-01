import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faLocationDot,
    faSackDollar,
    faTruck,
    faUsers,
    faCheck,
    faPhone,
} from '@fortawesome/free-solid-svg-icons';

function MiniMap() {
    return (
        <div className="relative h-[160px] w-[220px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#2a3d2f] to-[#1a2620]">
            <svg viewBox="0 0 220 160" className="absolute inset-0 opacity-60" aria-hidden>
                <path
                    d="M0 80 Q 60 60, 110 80 T 220 80"
                    stroke="currentColor"
                    className="text-accent"
                    fill="none"
                    strokeWidth="1.5"
                    opacity={0.5}
                />
                <path
                    d="M0 110 Q 60 90, 110 110 T 220 110"
                    stroke="currentColor"
                    className="text-accent"
                    fill="none"
                    strokeWidth="1.5"
                    opacity={0.3}
                />
                <path
                    d="M0 50 Q 60 40, 110 60 T 220 50"
                    stroke="currentColor"
                    className="text-accent"
                    fill="none"
                    strokeWidth="1.5"
                    opacity={0.25}
                />
                <line x1="40" y1="0" x2="40" y2="160" stroke="white" opacity={0.06} />
                <line x1="120" y1="0" x2="120" y2="160" stroke="white" opacity={0.06} />
                <line x1="180" y1="0" x2="180" y2="160" stroke="white" opacity={0.06} />
            </svg>
            <FontAwesomeIcon
                icon={faLocationDot}
                className="text-accent absolute left-[58%] top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-full"
            />
            <div className="absolute bottom-2.5 left-3 font-mono text-[10px] uppercase tracking-wider text-white/60">
                <UpNextDistance />
            </div>
        </div>
    );
}

function UpNextDistance() {
    const t = useTranslations('worker.dashboard.up_next');
    return <>{t('map_distance')}</>;
}

export function UpNextShift() {
    const t = useTranslations('worker.dashboard.up_next');

    return (
        <section className="bg-neutral text-neutral-content relative mb-7 overflow-hidden rounded-3xl p-6">
            <div
                aria-hidden
                className="absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse 60% 100% at 100% 0%, oklch(83% 0.13 88 / 0.28), transparent 60%)',
                }}
            />
            <div className="relative flex flex-wrap items-center justify-between gap-8">
                <div className="min-w-0 flex-1">
                    <div className="text-accent font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">
                        {t('eyebrow')}
                    </div>
                    <h2 className="font-serif mt-2 text-3xl font-medium leading-[1.05] tracking-tight md:text-4xl">
                        {t('title')}
                    </h2>
                    <ul className="mt-3.5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-neutral-content/75">
                        <li className="inline-flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faLocationDot} className="h-3.5 w-3.5" />
                            {t('location')}
                        </li>
                        <li className="inline-flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faSackDollar} className="h-3.5 w-3.5" />
                            {t('pay')}
                        </li>
                        <li className="inline-flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faTruck} className="h-3.5 w-3.5" />
                            {t('pickup')}
                        </li>
                        <li className="inline-flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faUsers} className="h-3.5 w-3.5" />
                            {t('crew')}
                        </li>
                    </ul>
                    <div className="mt-5 flex flex-wrap gap-2.5">
                        <button type="button" className="btn btn-accent btn-sm">
                            {t('confirm')}
                            <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm border border-white/25 bg-transparent text-neutral-content hover:bg-white/10"
                        >
                            <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" />
                            {t('directions')}
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm border border-white/25 bg-transparent text-neutral-content hover:bg-white/10"
                        >
                            <FontAwesomeIcon icon={faPhone} className="h-3 w-3" />
                            {t('call_foreman')}
                        </button>
                    </div>
                </div>
                <MiniMap />
            </div>
        </section>
    );
}
