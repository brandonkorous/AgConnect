'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ShiftDraft } from './types';

type Props = {
  draft: ShiftDraft;
  crewName: string | null;
  assignedCount: number;
  confirmedCount: number;
  locale: string;
};

// Right-rail "what the worker sees" mockup. Wraps the SMS preview in the
// daisyUI `mockup-phone` chrome to match `apps/web/src/components/employer/
// job-form/WorkerPreviewRail.tsx` so both editors share the same visual
// vocabulary. EN/ES toggle mirrors the jobs editor.
export function PreviewRail({
  draft,
  crewName,
  assignedCount,
  confirmedCount,
  locale,
}: Props) {
  const t = useTranslations('employer.crews.edit_shift.preview');
  const [lang, setLang] = useState<'en' | 'es'>(locale === 'es' ? 'es' : 'en');

  const heatHigh = (draft.metadata.heatAdvisoryForecastF ?? 0) >= 95;
  const ratio = assignedCount > 0 ? Math.min(1, confirmedCount / assignedCount) : 0;
  const pct = Math.round(ratio * 100);

  return (
    <aside aria-label={t('rail_label')} className="hidden xl:block">
      <div className="flex items-center justify-between px-1.5 pb-2.5">
        <span className="text-base-content/60 font-mono text-[10.5px] font-bold uppercase tracking-[0.1em]">
          {t('worker_preview')}
        </span>
        <div className="bg-base-200 border-base-300 join rounded-full border p-0.5">
          {(['en', 'es'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={[
                'join-item rounded-full px-2.5 py-0.5 font-mono text-[10.5px] font-bold transition-colors',
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
            <PhoneStatusBar lang={lang} />
            <ShiftSmsCard
              lang={lang}
              draft={draft}
              crewName={crewName}
              heatHigh={heatHigh}
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
        <p className="text-base-content/60 mt-2 text-[11px]">
          {t('confirmations_help', {
            open: Math.max(0, assignedCount - confirmedCount),
          })}
        </p>
      </div>
    </aside>
  );
}

function PhoneStatusBar({ lang }: { lang: 'en' | 'es' }) {
  const carrier = lang === 'es' ? 'AgConn · SMS' : 'AgConn · SMS';
  return (
    <div className="text-base-content/50 mb-1.5 flex items-center justify-between font-mono text-[10.5px]">
      <span>9:41</span>
      <span>{carrier}</span>
    </div>
  );
}

function ShiftSmsCard({
  lang,
  draft,
  crewName,
  heatHigh,
}: {
  lang: 'en' | 'es';
  draft: ShiftDraft;
  crewName: string | null;
  heatHigh: boolean;
}) {
  const tEn = labels.en;
  const tEs = labels.es;
  const L = lang === 'es' ? tEs : tEn;

  const dateLabel = formatHumanDate(draft.shiftDate, lang);
  const timeLabel = `${draft.startTime}${draft.endTime ? `–${draft.endTime}` : ''}`;
  const pickup = draft.metadata.pickup?.enabled
    ? draft.metadata.pickup.label || L.pickup_default
    : L.no_pickup;
  const bring = draft.metadata.equipmentProvided ? L.bring_minimal : L.bring_all;
  const lunch = draft.metadata.lunchProvided ? L.lunch_provided : L.lunch_byo;

  return (
    <div className="bg-base-100 border-base-300 overflow-hidden rounded-2xl border shadow-sm">
      <div className="bg-primary text-primary-content flex items-center justify-between px-3 py-2">
        <span className="font-mono text-[9.5px] font-bold uppercase tracking-wider">
          {L.badge}
        </span>
        <span className="font-mono text-[10px] tabular-nums">{dateLabel}</span>
      </div>
      <div className="p-3.5">
        <div className="font-display text-[15px] font-medium leading-tight tracking-tight">
          {(crewName ?? L.no_crew) + ' · ' + (draft.locationLabel || L.no_location)}
        </div>
        <dl className="border-base-300 mt-2.5 grid gap-1.5 border-t border-dashed pt-2.5 text-[11px]">
          <Row label={L.row_time} value={timeLabel} />
          <Row label={L.row_pickup} value={pickup} />
          <Row label={L.row_bring} value={bring} />
          <Row label={L.row_lunch} value={lunch} />
        </dl>
        {heatHigh && (
          <div className="bg-warning/15 text-warning border-warning/30 mt-3 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold">
            {L.heat_pill.replace(
              '{degF}',
              String(draft.metadata.heatAdvisoryForecastF ?? 95),
            )}
          </div>
        )}
        <div className="mt-3 flex gap-1.5">
          <span className="bg-primary text-primary-content flex-1 rounded-md py-1.5 text-center text-[11px] font-bold">
            {L.confirm}
          </span>
          <span className="border-base-300 flex-1 rounded-md border bg-base-100 py-1.5 text-center text-[11px] font-bold">
            {L.decline}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-base-content/60">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}

function formatHumanDate(iso: string, lang: 'en' | 'es'): string {
  const [y = 0, m = 1, d = 1] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(y, m - 1, d));
}

// Inline copy for the SMS card. Kept here (not in the translation seed)
// because the text inside the phone *is* the worker-facing SMS body, which
// the worker receives in their language regardless of the employer locale —
// the EN/ES toggle exposes the dual rendering side by side.
const labels = {
  en: {
    badge: 'Shift',
    no_crew: 'Crew',
    no_location: 'Location',
    row_time: 'Time',
    row_pickup: 'Pickup',
    row_bring: 'Bring',
    row_lunch: 'Lunch',
    pickup_default: 'Yard, 5:30 AM',
    no_pickup: 'Self-transport',
    bring_minimal: 'Water + lunch',
    bring_all: 'Tools + water + lunch',
    lunch_provided: 'Provided',
    lunch_byo: 'Bring lunch',
    heat_pill: 'Heat advisory · forecast {degF}°F',
    confirm: 'Confirm',
    decline: "Can't make it",
  },
  es: {
    badge: 'Turno',
    no_crew: 'Cuadrilla',
    no_location: 'Ubicación',
    row_time: 'Hora',
    row_pickup: 'Recogida',
    row_bring: 'Lleva',
    row_lunch: 'Almuerzo',
    pickup_default: 'Patio, 5:30 AM',
    no_pickup: 'Transporte propio',
    bring_minimal: 'Agua + almuerzo',
    bring_all: 'Herramientas + agua + almuerzo',
    lunch_provided: 'Incluido',
    lunch_byo: 'Trae almuerzo',
    heat_pill: 'Aviso de calor · pronóstico {degF}°F',
    confirm: 'Confirmar',
    decline: 'No puedo',
  },
} as const;
