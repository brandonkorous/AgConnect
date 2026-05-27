'use client';

import { useTranslations } from 'next-intl';
type Translator = (key: string) => string;
import type { CrewInsightsView } from '@/lib/api/hooks/employer-ops';
import { DarkHeroCard } from '@/components/employer/primitives';
import { CREW_COLORS, type CrewDraft } from './types';

type Props = {
    draft: CrewDraft;
    foremanName: string | null;
    memberCount: number;
    insights: CrewInsightsView;
    locale: string;
};

export function RightRail({ draft, foremanName, memberCount, insights, locale }: Props) {
    const t = useTranslations('employer.crews.edit_crew.rail');
    const swatch = CREW_COLORS.find((c) => c.key === draft.color) ?? CREW_COLORS[5]!;
    const initial =
        draft.shortCode?.charAt(0).toUpperCase() ||
        draft.name.replace(/^Crew\s+/i, '').charAt(0).toUpperCase() ||
        'A';

    const peakPieces = Math.max(...insights.yield.map((y) => y.pieces), 0);

    return (
        <div className="grid gap-3.5">
            {/* Identity card. De-emphasized neutral surface with ambient olive glow;
          a small swatch keeps the crew color readable as identity, not chrome. */}
            <DarkHeroCard glow="olive">
                <div className="flex items-start justify-between gap-3">
                    <div className="font-display text-6xl font-light leading-none tracking-tight">
                        {initial}
                    </div>
                    <span
                        aria-hidden
                        className="mt-2 h-3 w-3 shrink-0 rounded-full ring-2 ring-white/20"
                        style={{ background: swatch.cssVar }}
                    />
                </div>
                <div className="mt-2 text-sm font-semibold">{draft.name || t('untitled_crew')}</div>
                <div className="mt-0.5 text-xs opacity-70">
                    {t('rail_subtitle', {
                        count: memberCount,
                        foreman: foremanName ?? t('no_foreman'),
                    })}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/15 pt-3">
                    <div>
                        <div className="font-mono text-[10px] font-bold uppercase tracking-wider opacity-60">
                            {t('members_label')}
                        </div>
                        <div className="mt-0.5 font-mono text-base font-bold tabular-nums">
                            {memberCount}
                        </div>
                    </div>
                    <div>
                        <div className="font-mono text-[10px] font-bold uppercase tracking-wider opacity-60">
                            {t('skills_label')}
                        </div>
                        <div className="mt-0.5 font-mono text-base font-bold tabular-nums">
                            {draft.requiredSkills.size}
                        </div>
                    </div>
                </div>
            </DarkHeroCard>

            {/* Yield (last 14 days). Real piecework data from shift assignments. */}
            <section className="bg-base-100 border-base-300 rounded-2xl border p-4">
                <div className="text-base-content/60 mb-2.5 font-mono text-[10px] font-bold uppercase tracking-wider">
                    {t('yield_label')}
                </div>
                {peakPieces === 0 ? (
                    <div className="text-base-content/55 py-3 text-xs">{t('yield_empty')}</div>
                ) : (
                    <>
                        <div className="flex h-16 items-end gap-0.5">
                            {insights.yield.map((y, i) => {
                                const h = Math.max(2, Math.round((y.pieces / peakPieces) * 100));
                                const isLast = i === insights.yield.length - 1;
                                return (
                                    <div
                                        key={y.date}
                                        title={`${y.date}: ${y.pieces.toLocaleString(locale)}`}
                                        className={[
                                            'flex-1 rounded-sm',
                                            isLast ? 'bg-accent' : 'bg-primary/40',
                                        ].join(' ')}
                                        style={{ height: `${h}%` }}
                                    />
                                );
                            })}
                        </div>
                        <div className="text-base-content/60 mt-2 text-xs">
                            {t('yield_peak', { count: peakPieces.toLocaleString(locale) })}
                        </div>
                    </>
                )}
            </section>

            {/* Activity feed. Filtered audit-log events for this crew. */}
            <section className="bg-base-100 border-base-300 rounded-2xl border p-4">
                <div className="text-base-content/60 mb-2.5 font-mono text-[10px] font-bold uppercase tracking-wider">
                    {t('activity_label')}
                </div>
                {insights.activity.length === 0 ? (
                    <div className="text-base-content/55 py-3 text-xs">{t('activity_empty')}</div>
                ) : (
                    <ul className="grid gap-2.5">
                        {insights.activity.map((a) => (
                            <li key={a.id} className="flex gap-2.5 text-xs">
                                <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                                <div className="min-w-0 flex-1">
                                    <div className="text-base-content/80 leading-tight">
                                        {actionLabel(t, a.action)}
                                    </div>
                                    <span
                                        className="tooltip tooltip-left text-base-content/50 mt-0.5 block font-mono text-[10px] tabular-nums"
                                        data-tip={absoluteTime(a.occurredAt, locale)}
                                    >
                                        {relTime(a.occurredAt, locale)}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

// Map crew audit-event actions to translation keys. The translator is cast
// to accept dynamic keys; missing keys fall back to the raw action via
// next-intl's error handler at the layout level.
function actionLabel(t: ReturnType<typeof useTranslations>, action: string): string {
    return (t as unknown as Translator)(`activity_action.${action}`);
}

function absoluteTime(iso: string, locale: string): string {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(d);
}

function relTime(iso: string, locale: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1) return 'now';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        month: 'short',
        day: 'numeric',
    }).format(new Date(iso));
}
