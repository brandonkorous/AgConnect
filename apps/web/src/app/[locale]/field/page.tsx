import { getTranslations } from 'next-intl/server';
import { fetchMyShifts, type ShiftRow } from '@/lib/api/me';
import { ShiftCard } from '@/components/field/today/ShiftCard';
import { ConfirmTile } from '@/components/field/today/ConfirmTile';
import { ArrivalTile } from '@/components/field/today/ArrivalTile';
import { NoShiftToday } from '@/components/field/today/NoShiftToday';

type Props = {
    params: Promise<{ locale: string }>;
};

function todayIso(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function pickTodayShift(shifts: ShiftRow[]): { today: ShiftRow | null; nextUpcoming: ShiftRow | null } {
    const today = todayIso();
    const todayShifts = shifts.filter((s) => s.shift.date === today);
    if (todayShifts.length > 0) {
        const sorted = [...todayShifts].sort((a, b) => a.shift.startTime.localeCompare(b.shift.startTime));
        return { today: sorted[0]!, nextUpcoming: null };
    }
    const upcoming = shifts.filter((s) => s.shift.date > today);
    upcoming.sort((a, b) =>
        a.shift.date === b.shift.date
            ? a.shift.startTime.localeCompare(b.shift.startTime)
            : a.shift.date.localeCompare(b.shift.date),
    );
    return { today: null, nextUpcoming: upcoming[0] ?? null };
}

export default async function FieldTodayPage({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'worker.field.today' });

    const today = todayIso();
    const horizon = new Date();
    horizon.setUTCDate(horizon.getUTCDate() + 30);
    const horizonIso = horizon.toISOString().slice(0, 10);

    const shifts = await fetchMyShifts({ from: today, to: horizonIso });
    const { today: todayShift, nextUpcoming } = pickTodayShift(shifts);

    if (!todayShift) {
        return (
            <div className="space-y-4">
                <h2 className="text-base-content/55 px-1 font-mono text-[11px] uppercase tracking-wide">
                    {t('greeting_today')}
                </h2>
                <NoShiftToday locale={locale} upcoming={nextUpcoming} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-base-content/55 px-1 font-mono text-[11px] uppercase tracking-wide">
                {t('greeting_today')}
            </h2>
            <ShiftCard row={todayShift} locale={locale} />
            {todayShift.status === 'assigned' && (
                <ConfirmTile assignmentId={todayShift.id} />
            )}
            {todayShift.status !== 'declined' && (
                <ArrivalTile
                    assignmentId={todayShift.id}
                    initialArrivedAt={todayShift.arrivedAt}
                />
            )}
        </div>
    );
}
