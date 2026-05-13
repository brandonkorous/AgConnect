import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Route } from 'next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import type { SavedSearch } from '@/lib/api/saved-searches';
import { getSmsApplyNumber, getSmsApplyKeyword } from '@/lib/sms-apply';

type Props = { locale: string; savedSearches: SavedSearch[] };

function filtersToHref(filters: SavedSearch['filters'], locale: string): string {
    const sp = new URLSearchParams();
    const firstCounty = filters.county?.[0];
    if (firstCounty) sp.set('county', firstCounty);
    if (filters.skills?.length) sp.set('skills', filters.skills.join(','));
    if (filters.wageMin !== undefined) sp.set('wageMin', String(filters.wageMin));
    if (filters.startBefore) sp.set('startBefore', filters.startBefore);
    const qs = sp.toString();
    return `/${locale}/worker/jobs${qs ? `?${qs}` : ''}`;
}

function filtersToLabel(filters: SavedSearch['filters'], locale: string): string {
    const parts: string[] = [];
    if (filters.county?.length) parts.push(filters.county.join(', '));
    if (filters.wageMin !== undefined) parts.push(`$${filters.wageMin}+/hr`);
    if (filters.skills?.length) parts.push(filters.skills.slice(0, 2).join(', '));
    return parts.join(' · ') || (locale === 'es' ? 'Todos los trabajos' : 'All jobs');
}

export async function BrowseJobsAside({ locale, savedSearches }: Props) {
    const t = await getTranslations({ locale, namespace: 'worker.jobs.browse.aside' });
    const visible = savedSearches.slice(0, 3);
    const smsNumber = getSmsApplyNumber();
    const smsKeyword = getSmsApplyKeyword();
    return (
        <div className="grid content-start gap-3.5">
            {smsNumber && (
                <div className="bg-base-content text-base-100 relative overflow-hidden rounded-2xl p-[18px]">
                    <div
                        aria-hidden
                        className="absolute inset-0"
                        style={{
                            background:
                                'radial-gradient(ellipse 70% 100% at 100% 0%, rgba(217,180,65,0.22), transparent 60%)',
                        }}
                    />
                    <div className="relative">
                        <div className="text-accent font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em]">
                            {t('sms.eyebrow')}
                        </div>
                        <div className="font-serif mt-1.5 text-[22px] leading-[1.2] tracking-[-0.02em]">
                            {t.rich('sms.body', {
                                keyword: smsKeyword,
                                number: smsNumber,
                                text: (chunks) => (
                                    <strong className="text-accent">{chunks}</strong>
                                ),
                                num: (chunks) => (
                                    <strong className="font-mono">{chunks}</strong>
                                ),
                            })}
                        </div>
                        <div className="mt-2 text-[12.5px] opacity-80">{t('sms.note')}</div>
                    </div>
                </div>
            )}

            <div id="map" className="border-base-300 rounded-2xl border bg-white p-[18px] scroll-mt-24">
                <div className="text-base-content/60 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em]">
                    {t('map.eyebrow')}
                </div>
                <div
                    className="border-base-300 relative mt-3 h-[220px] overflow-hidden rounded-[10px] border"
                    style={{
                        background: 'linear-gradient(135deg, #f0ead8, #e5dec5)',
                    }}
                >
                    <svg
                        viewBox="0 0 300 220"
                        className="absolute inset-0"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M0 100 Q 80 70, 150 90 T 300 80"
                            stroke="var(--color-primary)"
                            strokeWidth="1"
                            fill="none"
                            opacity="0.3"
                        />
                        <path
                            d="M0 140 Q 80 110, 150 130 T 300 120"
                            stroke="var(--color-primary)"
                            strokeWidth="1"
                            fill="none"
                            opacity="0.2"
                        />
                        <path
                            d="M30 0 L 30 220 M 110 0 L 110 220 M 200 0 L 200 220"
                            stroke="rgba(0,0,0,0.05)"
                            strokeWidth="0.5"
                        />
                    </svg>
                    {[
                        { x: 32, y: 38, n: 4, big: false },
                        { x: 60, y: 70, n: 12, big: false },
                        { x: 48, y: 130, n: 7, big: false },
                        { x: 78, y: 165, n: 3, big: false },
                        { x: 56, y: 100, n: 24, big: true },
                    ].map((p, i) => (
                        <div
                            key={i}
                            className={[
                                'absolute -translate-x-1/2 -translate-y-1/2 rounded-full font-mono font-bold shadow-md',
                                p.big
                                    ? 'bg-base-content text-accent px-2.5 py-1.5 text-[13px]'
                                    : 'bg-primary px-2 py-1 text-xs text-white',
                            ].join(' ')}
                            style={{ left: `${p.x}%`, top: `${p.y}%` }}
                        >
                            {p.n}
                        </div>
                    ))}
                    <div className="text-base-content/60 absolute bottom-2.5 left-2.5 font-mono text-[10.5px]">
                        {t('map.label')}
                    </div>
                </div>
                <Link
                    href={`/${locale}/worker/shifts`}
                    className="border-base-300 mt-3 block w-full rounded-full border bg-transparent py-2.5 text-center text-[12.5px] font-semibold no-underline"
                >
                    {t('map.cta_shifts')}
                </Link>
            </div>

            <div className="border-base-300 rounded-2xl border bg-white p-[18px]">
                <div className="flex items-center justify-between">
                    <div className="text-base-content/60 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em]">
                        {t('saved.eyebrow')}
                    </div>
                    <Link
                        href={`/${locale}/worker/saved-searches`}
                        className="text-primary text-[11.5px] font-semibold no-underline"
                    >
                        {t('saved.manage')}
                    </Link>
                </div>
                {visible.length === 0 ? (
                    <p className="text-base-content/60 mt-3 text-[12.5px]">
                        {t('saved.empty')}
                    </p>
                ) : (
                    <div className="mt-2">
                        {visible.map((s, i) => (
                            <Link
                                key={s.id}
                                href={filtersToHref(s.filters, locale) as Route}
                                className={[
                                    'flex items-center justify-between py-2.5 no-underline',
                                    i < visible.length - 1 ? 'border-base-300 border-b' : '',
                                ].join(' ')}
                            >
                                <div className="min-w-0">
                                    <div className="text-base-content truncate text-[13px] font-semibold">
                                        {s.name ?? filtersToLabel(s.filters, locale)}
                                    </div>
                                    <div className="text-base-content/60 font-mono text-xs">
                                        {filtersToLabel(s.filters, locale)}
                                    </div>
                                </div>
                                <FontAwesomeIcon
                                    icon={faArrowRight}
                                    className="text-base-content/50 h-3.5 w-3.5 shrink-0"
                                />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
