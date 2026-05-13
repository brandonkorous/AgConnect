'use client';

import type { ShiftDraft } from './types';

type Lang = 'en' | 'es';

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

type Props = {
    lang: Lang;
    draft: ShiftDraft;
    crewName: string | null;
    heatHigh: boolean;
    touched?: Set<string>;
};

export function ShiftSmsCard({ lang, draft, crewName, heatHigh, touched }: Props) {
    const L = lang === 'es' ? labels.es : labels.en;

    const gated = touched != null;
    const dash = '—';
    const timeTouched = !gated || touched.has('startTime') || touched.has('endTime');
    const logisticsTouched = !gated || touched.has('metadata');

    const dateLabel = formatHumanDate(draft.shiftDate, lang);
    const timeLabel = timeTouched
        ? `${draft.startTime}${draft.endTime ? `–${draft.endTime}` : ''}`
        : dash;
    const pickup = !logisticsTouched
        ? dash
        : draft.metadata.pickup?.enabled
            ? draft.metadata.pickup.label || L.pickup_default
            : L.no_pickup;
    const bring = !logisticsTouched
        ? dash
        : draft.metadata.equipmentProvided
            ? L.bring_minimal
            : L.bring_all;
    const lunch = !logisticsTouched
        ? dash
        : draft.metadata.lunchProvided
            ? L.lunch_provided
            : L.lunch_byo;

    return (
        <div className="bg-base-100 border-base-300 overflow-hidden rounded-2xl border shadow-sm">
            <div className="bg-primary text-primary-content flex items-center justify-between px-3 py-2">
                <span className="font-mono text-[9.5px] font-bold uppercase tracking-wider">{L.badge}</span>
                <span className="font-mono text-[10px] tabular-nums">{dateLabel}</span>
            </div>
            <div className="p-3.5">
                <div className="font-display text-[15px] font-medium leading-tight tracking-tight">
                    {(crewName ?? L.no_crew) + ' · ' + (draft.locationLabel || L.no_location)}
                </div>
                <dl className="border-base-300 mt-2.5 grid gap-1.5 border-t border-dashed pt-2.5 text-xs">
                    <Row label={L.row_time} value={timeLabel} />
                    <Row label={L.row_pickup} value={pickup} />
                    <Row label={L.row_bring} value={bring} />
                    <Row label={L.row_lunch} value={lunch} />
                </dl>
                {heatHigh && (
                    <div className="bg-warning/15 text-warning border-warning/30 mt-3 rounded-md border px-2.5 py-1.5 text-xs font-semibold">
                        {L.heat_pill.replace(
                            '{degF}',
                            String(draft.metadata.heatAdvisoryForecastF ?? 95),
                        )}
                    </div>
                )}
                <div className="mt-3 flex gap-1.5">
                    <span className="bg-primary text-primary-content flex-1 rounded-md py-1.5 text-center text-xs font-bold">
                        {L.confirm}
                    </span>
                    <span className="border-base-300 flex-1 rounded-md border bg-base-100 py-1.5 text-center text-xs font-bold">
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

function formatHumanDate(iso: string, lang: Lang): string {
    const [y = 0, m = 1, d = 1] = iso.split('-').map(Number);
    return new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    }).format(new Date(y, m - 1, d));
}
