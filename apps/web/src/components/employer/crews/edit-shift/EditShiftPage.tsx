'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
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
    SECTION_IDS,
    type EditShiftPageProps,
} from './types';
import { useEditShift } from './useEditShift';

export function EditShiftPage({
    locale,
    shift,
    assignments: initialAssignments,
    crews,
}: EditShiftPageProps) {
    const t = useTranslations('employer.crews.edit_shift');
    const tNav = useTranslations('employer.crews.edit_shift.section');
    const editor = useEditShift({ locale, shift });

    const {
        draft,
        updateDraft,
        busy,
        error,
        cancelOpen,
        setCancelOpen,
        counts,
        onCountsChanged,
        save,
        duplicate,
        cancelShift,
    } = editor;

    const activeCrew = useMemo(
        () => crews.find((c) => c.id === draft.crewId) ?? null,
        [crews, draft.crewId],
    );
    const crewName = activeCrew?.name ?? null;
    const isCancelled = draft.status === 'cancelled';
    const openCount = Math.max(0, counts.assignedCount - counts.confirmedCount);

    return (
        <div className=" px-5 pb-16 pt-8">
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
                    <DateTimeSection draft={draft} onChange={updateDraft} />
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
