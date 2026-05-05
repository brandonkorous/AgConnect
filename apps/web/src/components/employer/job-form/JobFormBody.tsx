'use client';

import { useTranslations } from 'next-intl';
import type {
    CropLookupView,
    EmployerContactView,
    EmployerProfileView,
    LookupView,
    SkillLookupView,
} from '@/lib/api/employer';
import { SectionNav } from './SectionNav';
import { WorkerPreviewRail } from './WorkerPreviewRail';
import { BasicsSection } from './sections/Basics';
import { ScheduleSection } from './sections/Schedule';
import { PaySection } from './sections/Pay';
import { RequirementsSection } from './sections/Requirements';
import { LocationSection } from './sections/Location';
import { ApplicationSection } from './sections/Application';
import { ComplianceSection } from './sections/Compliance';
import type { JobFormState, JobFormUpdate } from './types';
import type { ErrorMap } from './validation';

type SectionEntry = { num: number; key: string; href: string };

type Props = {
    sections: SectionEntry[];
    locale: string;
    state: JobFormState;
    update: JobFormUpdate;
    errorByPath: ErrorMap;
    crops: CropLookupView[];
    roleTypes: LookupView[];
    skills: SkillLookupView[];
    contacts: EmployerContactView[];
    profile: EmployerProfileView | null;
    crop: CropLookupView | null;
    employerName: string;
    smsKeyword: string | null;
    jobId: string | null;
    footer: React.ReactNode;
};

export function JobFormBody({
    sections,
    locale,
    state,
    update,
    errorByPath,
    crops,
    roleTypes,
    skills,
    contacts,
    profile,
    crop,
    employerName,
    smsKeyword,
    jobId,
    footer,
}: Props) {
    const t = useTranslations('employer.jobs.form_v2');
    return (
        <>
            <div className="mb-4 xl:hidden">
                <select
                    aria-label={t('jump_to_section')}
                    onChange={(e) => {
                        if (e.target.value) location.hash = e.target.value;
                    }}
                    className="select select-bordered w-full"
                >
                    <option value="">{t('jump_to_section')}</option>
                    {sections.map((s) => (
                        <option key={s.key} value={s.href}>
                            {String(s.num).padStart(2, '0')} · {t(`section_${s.key}_title`)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid gap-6 xl:grid-cols-[12rem_minmax(0,1fr)_22rem]">
                <div className="hidden xl:block">
                    <div className="sticky top-20">
                        <SectionNav sections={sections} />
                    </div>
                </div>

                <div className="min-w-0">
                    <BasicsSection
                        state={state}
                        update={update}
                        crops={crops}
                        roleTypes={roleTypes}
                        jobId={jobId}
                        locale={locale}
                        onPhotosChange={(photos) => update({ photos })}
                        errors={errorByPath}
                    />
                    <ScheduleSection state={state} update={update} errors={errorByPath} />
                    <PaySection state={state} update={update} errors={errorByPath} />
                    <RequirementsSection
                        state={state}
                        update={update}
                        skills={skills}
                        locale={locale}
                        errors={errorByPath}
                    />
                    <LocationSection state={state} update={update} locale={locale} errors={errorByPath} />
                    <ApplicationSection
                        state={state}
                        update={update}
                        contacts={contacts}
                        smsApplyKeyword={smsKeyword}
                        errors={errorByPath}
                    />
                    <ComplianceSection state={state} profile={profile} locale={locale} />
                    {footer}
                </div>

                <div className="hidden xl:block">
                    <div className="sticky top-20">
                        <WorkerPreviewRail
                            state={state}
                            crop={crop}
                            skills={skills}
                            employerName={employerName}
                            smsApplyKeyword={smsKeyword}
                            locale={locale}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
