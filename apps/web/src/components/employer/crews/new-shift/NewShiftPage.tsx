'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { SectionNav } from '../edit-shift/SectionNav';
import { ShiftTypeSection } from '../edit-shift/ShiftTypeSection';
import { CrewPickerSection } from '../edit-shift/CrewPickerSection';
import { LocationSection } from '../edit-shift/LocationSection';
import { LogisticsSection } from '../edit-shift/LogisticsSection';
import { SafetySection } from '../edit-shift/SafetySection';
import { NotificationsSection } from '../edit-shift/NotificationsSection';
import { PreviewRail } from '../edit-shift/PreviewRail';
import { SECTION_IDS } from '../edit-shift/types';
import type { CrewView } from '@/lib/api/hooks/employer-ops';
import { NewShiftHeader } from './NewShiftHeader';
import { NewShiftFooter } from './NewShiftFooter';
import { SeriesDateSection } from './SeriesDateSection';
import { WorkersPlaceholder } from './WorkersPlaceholder';
import { useNewShift } from './useNewShift';

type Props = {
    locale: string;
    crews: CrewView[];
    defaultCrewId?: string;
    defaultDate?: string;
};

export function NewShiftPage({ locale, crews, defaultCrewId, defaultDate }: Props) {
    const t = useTranslations('employer.crews.new_shift');
    const tNav = useTranslations('employer.crews.edit_shift.section');
    const {
        draft,
        updateDraft,
        busy,
        error,
        fieldErrors,
        isComplete,
        shiftCount,
        touched,
        save,
    } = useNewShift({ locale, defaultCrewId, defaultDate });

    const activeCrew = useMemo(
        () => crews.find((c) => c.id === draft.crewId) ?? null,
        [crews, draft.crewId],
    );
    const crewName = activeCrew?.name ?? null;

    return (
        <div className=" px-5 pb-16 pt-8">
            <NewShiftHeader locale={locale} crewName={crewName} />

            {error && (
                <div className="bg-warning/10 border-warning/30 text-base-content mb-4 rounded-xl border px-3 py-2 text-sm">
                    {error}
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
                    <SeriesDateSection
                        draft={draft}
                        onChange={updateDraft}
                        errors={{
                            rangeStart: fieldErrors.rangeStart ?? null,
                            rangeEnd: fieldErrors.rangeEnd ?? null,
                            weekdayMask: fieldErrors.weekdayMask ?? null,
                            startTime: fieldErrors.startTime ?? null,
                            endTime: fieldErrors.endTime ?? null,
                        }}
                    />
                    <LocationSection
                        draft={draft}
                        onChange={updateDraft}
                        error={fieldErrors.locationLabel ?? null}
                    />
                    <LogisticsSection draft={draft} onChange={updateDraft} />
                    <SafetySection draft={draft} onChange={updateDraft} locale={locale} />
                    <NotificationsSection draft={draft} onChange={updateDraft} />
                    <WorkersPlaceholder />

                    <NewShiftFooter
                        locale={locale}
                        shiftDate={draft.rangeStart}
                        isComplete={isComplete}
                        shiftCount={shiftCount}
                        busy={busy}
                        onCreate={save}
                    />
                </div>

                <div className="hidden xl:block">
                    <div className="sticky top-22">
                        <PreviewRail
                            draft={draft}
                            crewName={crewName}
                            assignedCount={0}
                            confirmedCount={0}
                            locale={locale}
                            touched={touched}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
