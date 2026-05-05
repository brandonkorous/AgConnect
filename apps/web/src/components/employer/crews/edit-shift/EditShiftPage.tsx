'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';
import { SectionNav } from './SectionNav';
import { ShiftTypeSection } from './ShiftTypeSection';
import { CrewPickerSection } from './CrewPickerSection';
import { DateTimeSection } from './DateTimeSection';
import { LocationSection } from './LocationSection';
import { LogisticsSection } from './LogisticsSection';
import { SafetySection } from './SafetySection';
import { NotificationsSection } from './NotificationsSection';
import { WorkersSection } from './WorkersSection';
import { PreviewRail } from './PreviewRail';
import { EditShiftHeader } from './EditShiftHeader';
import { EditShiftFooter } from './EditShiftFooter';
import {
    dowOfDate,
    repeatDatesForDraft,
    SECTION_IDS,
    type EditShiftPageProps,
    type ShiftDraft,
} from './types';

export function EditShiftPage({
    locale,
    shift,
    assignments: initialAssignments,
    crews,
    hires: _hires,
}: EditShiftPageProps) {
    const t = useTranslations('employer.crews.edit_shift');
    const tNav = useTranslations('employer.crews.edit_shift.section');
    useLocale();
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [counts, setCounts] = useState({
        assignedCount: shift.assignedCount,
        confirmedCount: shift.confirmedCount,
    });

    const baseDow = dowOfDate(shift.shiftDate);
    const [draft, setDraft] = useState<ShiftDraft>({
        crewId: shift.crewId,
        shiftDate: shift.shiftDate,
        startTime: shift.startTime,
        endTime: shift.endTime ?? '14:00',
        status: shift.status,
        shiftType: shift.shiftType,
        locationLabel: shift.locationLabel,
        locationLat: shift.locationLat,
        locationLng: shift.locationLng,
        notes: shift.notes ?? '',
        metadata: { ...shift.metadata },
        repeatDow: {
            Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false,
            [baseDow]: true,
        },
    });

    const updateDraft = useCallback((patch: Partial<ShiftDraft>) => {
        setDraft((d) => ({ ...d, ...patch }));
    }, []);

    const onCountsChanged = useCallback(
        (next: { assignedCount: number; confirmedCount: number }) => setCounts(next),
        [],
    );

    const activeCrew = useMemo(
        () => crews.find((c) => c.id === draft.crewId) ?? null,
        [crews, draft.crewId],
    );
    const crewName = activeCrew?.name ?? null;
    const crewSize = activeCrew?.memberCount ?? counts.assignedCount;

    async function save(notifyCrew: boolean) {
        setError(null);
        setBusy(true);
        const repeatDates = repeatDatesForDraft(draft.shiftDate, draft.repeatDow);
        const body = {
            crewId: draft.crewId,
            shiftDate: draft.shiftDate,
            startTime: draft.startTime,
            endTime: draft.endTime || null,
            status: draft.status,
            shiftType: draft.shiftType,
            locationLabel: draft.locationLabel,
            locationLat: draft.locationLat,
            locationLng: draft.locationLng,
            notes: draft.notes.trim() || null,
            metadata: draft.metadata,
            notifyCrew,
            ...(repeatDates.length > 0 ? { repeatDates } : {}),
        };
        try {
            const client = getApiClient(locale === 'es' ? 'es' : 'en');
            const res = await client.patch(`/v1/employer/shifts/${shift.id}`, body, {
                handleErrorInline: true,
            });
            if (!isOk(res)) {
                setError(res.error.message || t('error_save'));
                return;
            }
            router.push(`/${locale}/employer/crews?week=${draft.shiftDate}`);
        } finally {
            setBusy(false);
        }
    }

    async function duplicate() {
        setBusy(true);
        setError(null);
        try {
            const client = getApiClient(locale === 'es' ? 'es' : 'en');
            const tomorrow = nextDay(draft.shiftDate);
            const res = await client.post(
                `/v1/employer/shifts/${shift.id}/duplicate`,
                { shiftDate: tomorrow, crewId: draft.crewId },
                { handleErrorInline: true },
            );
            if (!isOk(res)) {
                setError(res.error.message || t('error_duplicate'));
                return;
            }
            const created = (res.data as { shift: { id: string } }).shift;
            router.push(`/${locale}/employer/crews/shifts/${created.id}/edit` as Route);
        } finally {
            setBusy(false);
        }
    }

    async function cancelShift() {
        setBusy(true);
        setError(null);
        try {
            const client = getApiClient(locale === 'es' ? 'es' : 'en');
            const res = await client.del(`/v1/employer/shifts/${shift.id}`, { handleErrorInline: true });
            if (!isOk(res)) {
                setError(res.error.message || t('error_cancel'));
                return;
            }
            router.push(`/${locale}/employer/crews?week=${draft.shiftDate}`);
        } finally {
            setBusy(false);
        }
    }

    const repeatDates = repeatDatesForDraft(draft.shiftDate, draft.repeatDow);
    const isCancelled = draft.status === 'cancelled';
    const openCount = Math.max(0, counts.assignedCount - counts.confirmedCount);

    return (
        <div className="container mx-auto px-5 pb-16 pt-8 md:px-8 lg:px-20">
            <EditShiftHeader
                locale={locale}
                crewName={crewName}
                shiftDate={draft.shiftDate}
                isCancelled={isCancelled}
                confirmedCount={counts.confirmedCount}
                openCount={openCount}
                busy={busy}
                onDuplicate={duplicate}
                onCancelClick={() => setCancelOpen(!cancelOpen)}
            />

            {error && (
                <div className="bg-warning/10 border-warning/30 text-base-content mb-4 rounded-xl border px-3 py-2 text-sm">
                    {error}
                </div>
            )}

            {cancelOpen && !isCancelled && (
                <div className="bg-base-200/60 border-base-300 mb-5 rounded-2xl border p-4">
                    <p className="text-sm leading-relaxed">{t('cancel_confirm_message')}</p>
                    <div className="mt-3 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setCancelOpen(false)}
                            disabled={busy}
                            className="btn btn-ghost btn-sm rounded-full"
                        >
                            {t('cancel_keep')}
                        </button>
                        <button
                            type="button"
                            onClick={cancelShift}
                            disabled={busy}
                            className="btn btn-sm btn-neutral rounded-full"
                        >
                            {busy ? '…' : t('cancel_confirm_button')}
                        </button>
                    </div>
                </div>
            )}

            <div className="mb-4 lg:hidden">
                <select
                    aria-label={t('jump_to_section')}
                    onChange={(e) => {
                        if (e.target.value) location.hash = e.target.value;
                    }}
                    className="select select-bordered w-full"
                    defaultValue=""
                >
                    <option value="">{t('jump_to_section')}</option>
                    {SECTION_IDS.map((id, i) => (
                        <option key={id} value={id}>
                            {String(i + 1).padStart(2, '0')} · {tNav(`item.${id}`)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[12rem_minmax(0,1fr)] xl:grid-cols-[12rem_minmax(0,1fr)_22rem]">
                <div className="hidden lg:block">
                    <div className="sticky top-22">
                        <SectionNav />
                    </div>
                </div>

                <div className="min-w-0">
                    <ShiftTypeSection
                        value={draft.shiftType}
                        onChange={(v) => updateDraft({ shiftType: v })}
                    />
                    <CrewPickerSection
                        crews={crews}
                        value={draft.crewId}
                        onChange={(v) => updateDraft({ crewId: v })}
                        locale={locale}
                    />
                    <DateTimeSection draft={draft} onChange={updateDraft} crewSize={crewSize} />
                    <LocationSection draft={draft} onChange={updateDraft} />
                    <LogisticsSection draft={draft} onChange={updateDraft} />
                    <SafetySection draft={draft} onChange={updateDraft} locale={locale} />
                    <NotificationsSection draft={draft} onChange={updateDraft} />
                    <WorkersSection
                        shiftId={shift.id}
                        crewId={draft.crewId}
                        initial={initialAssignments}
                        onCountsChanged={onCountsChanged}
                    />

                    <EditShiftFooter
                        locale={locale}
                        shiftDate={draft.shiftDate}
                        repeatCount={repeatDates.length}
                        busy={busy}
                        onSaveQuiet={() => save(false)}
                        onSaveNotify={() => save(true)}
                    />
                </div>

                <div className="hidden xl:block">
                    <div className="sticky top-22">
                        <PreviewRail
                            draft={draft}
                            crewName={crewName}
                            assignedCount={counts.assignedCount}
                            confirmedCount={counts.confirmedCount}
                            locale={locale}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function nextDay(iso: string): string {
    const d = new Date(`${iso}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
}
