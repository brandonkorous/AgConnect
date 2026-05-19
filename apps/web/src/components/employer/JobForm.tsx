'use client';

import { useMemo, useState } from 'react';
import type {
    EmployerJobView,
    EmployerProfileView,
    CropLookupView,
    LookupView,
    SkillLookupView,
    EmployerContactView,
} from '@/lib/api/employer';
import { fromView, type JobFormState } from './job-form/types';
import { useAutosave } from './job-form/useAutosave';
import { useJobFormSave } from './job-form/useJobFormSave';
import { FormAlerts } from './job-form/FormAlerts';
import { JobFormHeader } from './job-form/JobFormHeader';
import { JobFormFooter } from './job-form/JobFormFooter';
import { JobFormBody } from './job-form/JobFormBody';
import { DiffPreviewModal } from './job-form/DiffPreviewModal';
import type { SaveAction } from './job-form/save-handlers';
import { validateForm, type FieldError } from './job-form/validation';

type Mode = 'create' | 'edit';

type Props = {
    locale: string;
    mode: Mode;
    canPublish?: boolean;
    initial?: EmployerJobView;
    profile: EmployerProfileView | null;
    crops: CropLookupView[];
    roleTypes: LookupView[];
    skills: SkillLookupView[];
    contacts: EmployerContactView[];
};

const SECTIONS = [
    { num: 1, key: 'basics', href: '#s-basics' },
    { num: 2, key: 'schedule', href: '#s-schedule' },
    { num: 3, key: 'pay', href: '#s-pay' },
    { num: 4, key: 'requirements', href: '#s-requirements' },
    { num: 5, key: 'location', href: '#s-location' },
    { num: 6, key: 'application', href: '#s-application' },
    { num: 7, key: 'compliance', href: '#s-compliance' },
];

export function JobForm({
    locale,
    mode,
    canPublish = true,
    initial,
    profile,
    crops,
    roleTypes,
    skills,
    contacts,
}: Props) {
    const [state, setState] = useState<JobFormState>(() => fromView(initial));
    const [savedSnapshot, setSavedSnapshot] = useState<JobFormState>(() => fromView(initial));
    const [jobId, setJobId] = useState<string | null>(initial?.id ?? null);
    const [smsKeyword, setSmsKeyword] = useState<string | null>(initial?.smsApplyKeyword ?? null);
    const [diffOpen, setDiffOpen] = useState(false);
    // Don't surface inline field errors on a pristine form. A field's error
    // shows only once the user has edited it, or once a save/publish was
    // attempted. Server-returned field errors always show (post-submit).
    const [touched, setTouched] = useState<Set<string>>(() => new Set());
    const [attempted, setAttempted] = useState(false);

    const isDraft = (initial?.status ?? 'draft') === 'draft';
    const isActive = mode === 'edit' && initial?.status === 'active';
    const employerName = profile?.dbaName || profile?.legalName || 'Your business';
    const crop = useMemo(() => crops.find((c) => c.id === state.cropId) ?? null, [crops, state.cropId]);

    const liveErrors = useMemo(
        () => validateForm(state, !isDraft ? 'create' : 'edit'),
        [state, isDraft],
    );

    const { status: autosaveStatus, savedAt } = useAutosave({
        enabled: mode === 'edit' && isDraft,
        jobId,
        locale,
        state,
    });

    const { submitting, error, fieldErrors, renotifyMsg, save } = useJobFormSave({
        locale,
        mode,
        isActive: !!isActive,
        state,
        jobId,
        setJobId,
        setSmsKeyword,
        setSavedSnapshot,
    });

    const errorByPath = useMemo(() => {
        const map: Record<string, FieldError> = {};
        for (const e of liveErrors) {
            const root = e.path.split('.')[0]!;
            if (attempted || touched.has(e.path) || touched.has(root)) {
                map[e.path] = e;
            }
        }
        // Server-returned errors come from an actual save attempt — always show.
        for (const e of fieldErrors) map[e.path] = e;
        return map;
    }, [liveErrors, fieldErrors, attempted, touched]);

    const update = (patch: Partial<JobFormState>) => {
        setState((s) => ({ ...s, ...patch }));
        setTouched((prev) => {
            const next = new Set(prev);
            for (const k of Object.keys(patch)) next.add(k);
            return next;
        });
    };

    function handleFooterSave(action: SaveAction) {
        setAttempted(true);
        if (action === 'save_notify') {
            setDiffOpen(true);
            return;
        }
        void save(action);
    }

    return (
        <form onSubmit={(e) => e.preventDefault()}>
            <JobFormHeader
                mode={mode}
                title={state.titleEn || state.titleEs}
                jobId={jobId}
                humanId={initial?.humanId ?? null}
                status={initial?.status ?? 'draft'}
                publishedAt={initial?.publishedAt ?? null}
                startDate={state.startDate}
                applicantsCount={
                    (initial?.applicationCounts?.applied ?? 0) +
                    (initial?.applicationCounts?.reviewed ?? 0) +
                    (initial?.applicationCounts?.hired ?? 0)
                }
                spotsOpen={Math.max(0, state.positionsTotal - (initial?.hireCount ?? 0))}
                autosaveStatus={autosaveStatus}
                savedAt={savedAt}
                locale={locale}
                renotifyPaused={initial?.renotifyPaused ?? false}
            />

            <FormAlerts fieldErrors={fieldErrors} error={error} renotifyMsg={renotifyMsg} />

            <JobFormBody
                sections={SECTIONS}
                locale={locale}
                state={state}
                update={update}
                errorByPath={errorByPath}
                crops={crops}
                roleTypes={roleTypes}
                skills={skills}
                contacts={contacts}
                profile={profile}
                crop={crop}
                employerName={employerName}
                smsKeyword={smsKeyword}
                jobId={jobId}
                footer={
                    <JobFormFooter
                        locale={locale}
                        isActive={!!isActive}
                        isDraft={isDraft}
                        canPublish={canPublish}
                        submitting={submitting}
                        errorCount={liveErrors.length}
                        savedAt={savedAt}
                        onSave={handleFooterSave}
                    />
                }
            />

            <DiffPreviewModal
                open={diffOpen}
                before={savedSnapshot}
                after={state}
                submitting={submitting}
                onCancel={() => setDiffOpen(false)}
                onConfirm={() => {
                    setDiffOpen(false);
                    void save('save_notify');
                }}
            />
        </form>
    );
}
