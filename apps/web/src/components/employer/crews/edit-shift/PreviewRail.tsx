'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ShiftSmsCard } from './ShiftSmsCard';
import type { ShiftDraft } from './types';

type Props = {
    draft: ShiftDraft;
    crewName: string | null;
    assignedCount: number;
    confirmedCount: number;
    locale: string;
    // When provided (new-shift flow), only show real values for fields the user
    // has explicitly engaged. Omit (edit flow) to render every field.
    touched?: Set<string>;
};

export function PreviewRail({
    draft,
    crewName,
    assignedCount,
    confirmedCount,
    locale,
    touched,
}: Props) {
    const t = useTranslations('employer.crews.edit_shift.preview');
    const [lang, setLang] = useState<'en' | 'es'>(locale === 'es' ? 'es' : 'en');

    const heatHigh = (draft.metadata.heatAdvisoryForecastF ?? 0) >= 95;
    const ratio = assignedCount > 0 ? Math.min(1, confirmedCount / assignedCount) : 0;
    const pct = Math.round(ratio * 100);

    return (
        <aside aria-label={t('rail_label')} className="hidden xl:block">
            <div className="flex items-center justify-between px-1.5 pb-2.5">
                <span className="text-base-content/60 font-mono text-xs font-bold uppercase tracking-[0.1em]">
                    {t('worker_preview')}
                </span>
                <div className="bg-base-200 border-base-300 join rounded-full border p-0.5">
                    {(['en', 'es'] as const).map((l) => (
                        <button
                            key={l}
                            type="button"
                            onClick={() => setLang(l)}
                            className={[
                                'join-item rounded-full px-2.5 py-0.5 font-mono text-xs font-bold transition-colors',
                                lang === l
                                    ? 'bg-base-100 text-base-content'
                                    : 'text-base-content/40',
                            ].join(' ')}
                        >
                            {l.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mockup-phone mx-auto">
                <div className="mockup-phone-camera" />
                <div className="mockup-phone-display bg-base-200 overflow-y-auto">
                    <div className="flex flex-col gap-3 px-4 pt-10 pb-5">
                        <PhoneStatusBar />
                        <ShiftSmsCard
                            lang={lang}
                            draft={draft}
                            crewName={crewName}
                            heatHigh={heatHigh}
                            touched={touched}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-base-100 border-base-300 mt-3.5 rounded-2xl border p-3.5">
                <div className="text-base-content/60 mb-2 font-mono text-[10px] font-bold uppercase tracking-wider">
                    {t('confirmations_label')}
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-base-200 h-2 flex-1 overflow-hidden rounded-full">
                        <div
                            className="from-primary to-accent h-full bg-gradient-to-r"
                            style={{ width: `${pct}%` }}
                            aria-hidden
                        />
                    </div>
                    <span className="font-mono text-xs font-bold tabular-nums">
                        {confirmedCount}/{assignedCount || 0}
                    </span>
                </div>
                <p className="text-base-content/60 mt-2 text-xs">
                    {t('confirmations_help', {
                        open: Math.max(0, assignedCount - confirmedCount),
                    })}
                </p>
            </div>
        </aside>
    );
}

function PhoneStatusBar() {
    return (
        <div className="text-base-content/50 mb-1.5 flex items-center justify-between font-mono text-xs">
            <span>9:41</span>
            <span>AGCONN · SMS</span>
        </div>
    );
}
