import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { fetchMyShifts, type ShiftRow } from '@/lib/api/me';
import { FieldShiftsList } from '@/components/field/shifts/FieldShiftsList';

type Props = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'worker.field.shifts' });
    return { title: t('meta_title') };
}

function todayIso(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Look 60 days back, 90 days forward. Field Mode is week-to-week, not archival;
// the worker dashboard is the place for longer history.
function rangeIso(): { from: string; to: string } {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 60);
    const to = new Date(now);
    to.setDate(to.getDate() + 90);
    const iso = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { from: iso(from), to: iso(to) };
}

function partition(shifts: ShiftRow[], today: string): {
    today: ShiftRow[];
    upcoming: ShiftRow[];
    past: ShiftRow[];
} {
    const byTime = (a: ShiftRow, b: ShiftRow) =>
        a.shift.date === b.shift.date
            ? a.shift.startTime.localeCompare(b.shift.startTime)
            : a.shift.date.localeCompare(b.shift.date);
    return {
        today: shifts.filter((s) => s.shift.date === today).sort(byTime),
        upcoming: shifts.filter((s) => s.shift.date > today).sort(byTime),
        past: shifts
            .filter((s) => s.shift.date < today)
            .sort((a, b) =>
                a.shift.date === b.shift.date
                    ? b.shift.startTime.localeCompare(a.shift.startTime)
                    : b.shift.date.localeCompare(a.shift.date),
            ),
    };
}

export default async function FieldShiftsPage({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'worker.field.shifts' });
    const range = rangeIso();
    const shifts = await fetchMyShifts(range);
    const today = todayIso();
    const buckets = partition(shifts, today);

    return (
        <div className="space-y-4">
            <div className="px-1">
                <h1 className="text-base-content text-2xl font-semibold leading-tight">
                    {t('title')}
                </h1>
                <p className="text-base-content/70 mt-1 text-sm">{t('subtitle')}</p>
            </div>
            <FieldShiftsList locale={locale} buckets={buckets} />
        </div>
    );
}
