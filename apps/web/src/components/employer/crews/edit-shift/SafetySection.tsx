'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faSun } from '@fortawesome/free-solid-svg-icons';
import { SectionCard } from './SectionCard';
import { fetchWeatherForecast } from './api';
import type { ShiftDraft } from './types';

const ITEM_KEYS = [
    'wpsCleared',
    'ppeBriefingDone',
    'emergencyContactsLoaded',
    'restroomNearby',
] as const;

type Props = {
    draft: ShiftDraft;
    onChange: (patch: Partial<ShiftDraft>) => void;
    locale: string;
};

type WeatherStatus = 'idle' | 'loading' | 'ready' | 'error';

export function SafetySection({ draft, onChange, locale }: Props) {
    const t = useTranslations('employer.crews.edit_shift.safety');
    const md = draft.metadata;
    const safety = md.safety ?? {};
    const [status, setStatus] = useState<WeatherStatus>('idle');
    const [condition, setCondition] = useState<string | null>(null);

    function setSafety(patch: Partial<typeof safety>) {
        onChange({ metadata: { ...md, safety: { ...safety, ...patch } } });
    }

    useEffect(() => {
        const lat = draft.locationLat;
        const lng = draft.locationLng;
        const date = draft.shiftDate;
        if (lat == null || lng == null || !date) {
            setStatus('idle');
            return;
        }
        let cancelled = false;
        setStatus('loading');
        void fetchWeatherForecast(locale, lat, lng, date).then((res) => {
            if (cancelled) return;
            if (res && res.highTempF != null) {
                setStatus('ready');
                setCondition(res.condition);
                if (res.highTempF !== md.heatAdvisoryForecastF) {
                    onChange({
                        metadata: { ...md, heatAdvisoryForecastF: res.highTempF },
                    });
                }
            } else {
                setStatus('error');
            }
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft.locationLat, draft.locationLng, draft.shiftDate, locale]);

    const forecast = md.heatAdvisoryForecastF ?? 0;
    const heatHigh = forecast >= 95;
    const heatWarm = forecast >= 85 && forecast < 95;

    return (
        <SectionCard id="safety" title={t('title')} sub={t('sub')}>
            <div
                className={[
                    'flex items-start gap-3 rounded-2xl p-4',
                    heatHigh
                        ? 'bg-warning/15 border-warning/40 border'
                        : heatWarm
                            ? 'bg-accent/10 border-accent/30 border'
                            : 'bg-base-200/40 border-base-300 border',
                ].join(' ')}
            >
                <FontAwesomeIcon
                    icon={faSun}
                    className={[
                        'mt-0.5 h-5 w-5',
                        heatHigh
                            ? 'text-warning'
                            : heatWarm
                                ? 'text-accent'
                                : 'text-base-content/40',
                    ].join(' ')}
                />
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold leading-tight">
                        {status === 'loading'
                            ? t('heat.loading')
                            : status === 'error'
                                ? t('heat.unavailable')
                                : heatHigh
                                    ? t('heat.high_title', { degF: forecast })
                                    : t('heat.normal_title', { degF: forecast || '—' })}
                    </div>
                    <div className="text-base-content/70 mt-0.5 text-xs">
                        {status === 'loading'
                            ? t('heat.loading_help')
                            : status === 'error'
                                ? t('heat.unavailable_help')
                                : heatHigh
                                    ? t('heat.high_help')
                                    : t('heat.normal_help')}
                    </div>
                    {status === 'ready' && condition && (
                        <div className="text-base-content/55 mt-1.5 text-[10.5px] uppercase tracking-wider">
                            {t('heat.source', { condition })}
                        </div>
                    )}
                </div>
                <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 text-xs font-semibold">
                    <input
                        type="checkbox"
                        checked={Boolean(md.heatAdvisoryAutoApply)}
                        onChange={(e) => onChange({ metadata: { ...md, heatAdvisoryAutoApply: e.target.checked } })}
                        className="checkbox checkbox-primary checkbox-xs"
                    />
                    {t('heat.auto_apply')}
                </label>
            </div>

            <ul className="border-base-300 divide-base-300 mt-4 divide-y rounded-xl border">
                {ITEM_KEYS.map((k) => {
                    const on = Boolean(safety[k]);
                    return (
                        <li key={k} className="flex items-start gap-3 px-3.5 py-3">
                            <button
                                type="button"
                                aria-pressed={on}
                                onClick={() => setSafety({ [k]: !on })}
                                className={[
                                    'mt-0.5 grid h-5 w-5 shrink-0 cursor-pointer place-items-center rounded-full border transition',
                                    on
                                        ? 'bg-primary text-primary-content border-primary'
                                        : 'bg-base-100 border-base-300 text-transparent hover:border-base-content/40',
                                ].join(' ')}
                            >
                                <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" />
                            </button>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium">{t(`item.${k}.title`)}</div>
                                <div className="text-base-content/60 mt-0.5 text-xs">{t(`item.${k}.help`)}</div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </SectionCard>
    );
}
