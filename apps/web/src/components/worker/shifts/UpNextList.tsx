'use client';

import { useTranslations } from 'next-intl';
import { Pill } from '@/components/worker/primitives/Pill';
import { SectionHeading } from '@/components/worker/primitives/SectionHeading';
import { useConfirmShiftMutation } from '@/lib/api/hooks/mutations/me';
import type { ShiftRow } from '@/lib/api/hooks/shifts';

const STATUS_TONE: Record<
    ShiftRow['status'],
    'success' | 'warning' | 'accent' | 'ghost'
> = {
    confirmed: 'success',
    attended: 'success',
    assigned: 'warning',
    declined: 'ghost',
    no_show: 'ghost',
};

const STATUS_KEY: Record<ShiftRow['status'], string> = {
    confirmed: 'confirmed',
    attended: 'confirmed',
    assigned: 'awaiting',
    declined: 'pending',
    no_show: 'pending',
};

function statusTone(status: ShiftRow['status']): 'success' | 'warning' | 'accent' | 'ghost' {
    return STATUS_TONE[status] ?? 'ghost';
}

function statusKey(status: ShiftRow['status']): string {
    return STATUS_KEY[status] ?? 'pending';
}

type Props = { shifts: ShiftRow[]; locale: string };

export function UpNextList({ shifts, locale }: Props) {
    const t = useTranslations('worker.shifts.up_next');
    const tEmpty = useTranslations('worker.shifts');
    const confirmMut = useConfirmShiftMutation();
    const pending = confirmMut.isPending;

    function confirm(assignmentId: string) {
        confirmMut.mutate(assignmentId);
    }

    if (shifts.length === 0) {
        return (
            <div className="border-base-300 bg-base-100 rounded-2xl border p-[18px] text-center">
                <p className="text-base-content/70 text-[13px]">
                    {locale === 'es'
                        ? 'No tienes turnos próximos.'
                        : 'No upcoming shifts.'}
                </p>
            </div>
        );
    }

    return (
        <div className="border-base-300 bg-base-100 rounded-2xl border p-[18px]">
            <SectionHeading sub={t('sub')}>{t('title')}</SectionHeading>
            <div className="grid gap-2.5">
                {shifts.map((s, i) => {
                    const title =
                        (locale === 'es' ? s.shift.jobTitleEs : s.shift.jobTitleEn) ??
                        s.shift.crewName ??
                        (locale === 'es' ? 'Turno' : 'Shift');
                    return (
                        <div
                            key={s.id}
                            className={[
                                'rounded-xl p-3',
                                i === 0 ? 'bg-base-200 border-base-300 border' : '',
                            ].join(' ')}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="text-base-content/60 font-mono text-xs font-bold uppercase tracking-[0.06em]">
                                        {new Date(s.shift.date).toLocaleDateString(locale, {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </div>
                                    <div className="mt-0.5 text-[13.5px] font-semibold">{title}</div>
                                    <div className="text-base-content/60 mt-0.5 text-[11.5px]">
                                        {s.shift.employer} · {s.shift.locationLabel}
                                    </div>
                                </div>
                                <Pill tone={statusTone(s.status)}>
                                    {t(`status.${statusKey(s.status)}`)}
                                </Pill>
                            </div>
                            <div className="text-base-content/70 mt-2 flex items-center gap-3 font-mono text-[11.5px]">
                                <span>
                                    {s.shift.startTime}
                                    {s.shift.endTime ? `–${s.shift.endTime}` : ''}
                                </span>
                            </div>
                            {s.status === 'assigned' && (
                                <div className="mt-2.5 flex gap-2">
                                    <button
                                        type="button"
                                        disabled={pending}
                                        onClick={() => confirm(s.id)}
                                        className="btn btn-primary btn-xs rounded-full"
                                    >
                                        {locale === 'es' ? 'Confirmar' : 'Confirm'}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
