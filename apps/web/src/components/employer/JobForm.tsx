'use client';

// Edit Job v2 shell. Three-column layout at xl+: section nav · main · worker
// preview. Stacks at lg / md / sm with the preview moved into a daisyUI
// drawer behind a "Preview" toggle.

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronLeft,
    faChevronRight,
    faCheck,
    faCopy,
    faEye,
    faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import type {
    EmployerJobView,
    EmployerProfileView,
    CropLookupView,
    LookupView,
    SkillLookupView,
    EmployerContactView,
} from '@/lib/api/employer';
import { fromView, toApiBody, type JobFormState } from './job-form/types';
import { SectionNav } from './job-form/SectionNav';
import { WorkerPreviewRail } from './job-form/WorkerPreviewRail';
import { useAutosave } from './job-form/useAutosave';
import { createJob, patchJob, publishJob, replaceScreeningQuestions } from './job-form/api';
import { ValidationSummary } from './job-form/ValidationSummary';
import {
    validateForm,
    fromServerFields,
    type FieldError,
} from './job-form/validation';
import { BasicsSection } from './job-form/sections/Basics';
import { ScheduleSection } from './job-form/sections/Schedule';
import { PaySection } from './job-form/sections/Pay';
import { RequirementsSection } from './job-form/sections/Requirements';
import { LocationSection } from './job-form/sections/Location';
import { ApplicationSection } from './job-form/sections/Application';
import { ComplianceSection } from './job-form/sections/Compliance';

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

const SECTIONS: Array<{ num: number; key: string; href: string }> = [
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
    const t = useTranslations('employer.jobs.form_v2');
    const router = useRouter();

    const [state, setState] = useState<JobFormState>(() => fromView(initial));
    const [jobId, setJobId] = useState<string | null>(initial?.id ?? null);
    const [smsKeyword, setSmsKeyword] = useState<string | null>(initial?.smsApplyKeyword ?? null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
    const [renotifyMsg, setRenotifyMsg] = useState<string | null>(null);

    const isDraft = (initial?.status ?? 'draft') === 'draft';
    const isActive = mode === 'edit' && initial?.status === 'active';
    const employerName = profile?.dbaName || profile?.legalName || 'Your business';
    const crop = useMemo(() => crops.find((c) => c.id === state.cropId) ?? null, [crops, state.cropId]);

    const liveStrict = !isDraft;
    const liveErrors = useMemo(
        () => validateForm(state, liveStrict ? 'create' : 'edit'),
        [state, liveStrict],
    );
    const errorByPath = useMemo(() => {
        const map: Record<string, FieldError> = {};
        for (const e of liveErrors) map[e.path] = e;
        for (const e of fieldErrors) map[e.path] = e;
        return map;
    }, [liveErrors, fieldErrors]);

    function focusFirstError(errors: FieldError[]) {
        const first = errors[0];
        if (!first || typeof window === 'undefined') return;
        const id = first.sectionHref.replace(/^#/, '');
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const { status: autosaveStatus, savedAt } = useAutosave({
        enabled: mode === 'edit' && isDraft,
        jobId,
        locale,
        state,
    });

    const update = (patch: Partial<JobFormState>) => setState((s) => ({ ...s, ...patch }));

    type SaveAction = 'draft' | 'publish' | 'save_no_notify' | 'save_notify';

    async function save(action: SaveAction) {
        setError(null);
        setFieldErrors([]);
        setRenotifyMsg(null);

        const strict = action === 'publish' || isActive;
        const preflight = validateForm(state, strict ? 'create' : 'edit');
        if (preflight.length > 0) {
            setFieldErrors(preflight);
            focusFirstError(preflight);
            return;
        }

        setSubmitting(true);
        try {
            let id = jobId;
            const baseBody = toApiBody(state);
            const body =
                action === 'save_no_notify'
                    ? { ...baseBody, notifyApplicants: false }
                    : action === 'save_notify'
                        ? { ...baseBody, notifyApplicants: true }
                        : baseBody;
            const res =
                mode === 'create' && !id
                    ? await createJob(locale, body)
                    : await patchJob(locale, id!, body);
            if (res.kind === 'error') {
                const fromServer = fromServerFields(res.fields);
                if (fromServer.length > 0) {
                    setFieldErrors(fromServer);
                    focusFirstError(fromServer);
                } else {
                    setError(publishErrorMessage(res.code, res.message));
                }
                return;
            }
            id = res.job.id;
            setJobId(id);
            if (res.job.smsApplyKeyword) setSmsKeyword(res.job.smsApplyKeyword);
            if (res.edit && res.edit.renotificationsQueued > 0) {
                setRenotifyMsg(
                    t('renotify_dispatched', { count: res.edit.renotificationsQueued }),
                );
            } else if (
                res.edit &&
                res.edit.renotificationsSuppressed &&
                (res.edit.suppressedRecipientCount ?? 0) > 0
            ) {
                setRenotifyMsg(
                    t('renotify_suppressed', { count: res.edit.suppressedRecipientCount ?? 0 }),
                );
            }

            // Sync screening questions whenever we have an ID.
            if (id) {
                await replaceScreeningQuestions(
                    locale,
                    id,
                    state.screeningQuestions.map((q) => ({
                        id: q.id.startsWith('tmp-') ? undefined : q.id,
                        sortOrder: q.sortOrder,
                        questionEn: q.questionEn,
                        questionEs: q.questionEs,
                        answerType: q.answerType,
                        required: q.required,
                    })),
                );
            }

            if (action === 'publish' && id) {
                const pub = await publishJob(locale, id);
                if (!pub.ok) {
                    setError(publishErrorMessage(pub.code, pub.message));
                    return;
                }
            }
            router.push(`/${locale}/employer/jobs`);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={(e) => e.preventDefault()} className="px-5 pb-16 pt-8">
            <Header
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
            />

            {fieldErrors.length > 0 && (
                <ValidationSummary errors={fieldErrors} />
            )}
            {error && (
                <div role="alert" className="alert alert-error alert-soft mb-5 text-sm">
                    {error}
                </div>
            )}
            {renotifyMsg && (
                <div role="status" className="alert alert-info alert-soft mb-5 text-sm">
                    {renotifyMsg}
                </div>
            )}

            {/* Mobile section jump */}
            <div className="mb-4 xl:hidden">
                <select
                    aria-label={t('jump_to_section')}
                    onChange={(e) => {
                        if (e.target.value) location.hash = e.target.value;
                    }}
                    className="select select-bordered w-full"
                >
                    <option value="">{t('jump_to_section')}</option>
                    {SECTIONS.map((s) => (
                        <option key={s.key} value={s.href}>
                            {String(s.num).padStart(2, '0')} · {t(`section_${s.key}_title`)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid gap-6 xl:grid-cols-[12rem_minmax(0,1fr)_22rem]">
                <div className="hidden xl:block">
                    <div className="sticky top-20">
                        <SectionNav sections={SECTIONS} />
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
                    <RequirementsSection state={state} update={update} skills={skills} locale={locale} errors={errorByPath} />
                    <LocationSection state={state} update={update} locale={locale} errors={errorByPath} />
                    <ApplicationSection
                        state={state}
                        update={update}
                        contacts={contacts}
                        smsApplyKeyword={smsKeyword}
                        errors={errorByPath}
                    />
                    <ComplianceSection state={state} profile={profile} locale={locale} />

                    <div className="bg-base-100 border-base-300 shadow-pop sticky bottom-4 z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
                        <div className="flex items-center gap-3">
                            {liveErrors.length > 0 ? (
                                <span className="bg-error/10 text-error grid h-9 w-9 place-items-center rounded-full">
                                    <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4" />
                                </span>
                            ) : (
                                <span className="bg-primary/10 text-primary grid h-9 w-9 place-items-center rounded-full">
                                    <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
                                </span>
                            )}
                            <div className="min-w-0">
                                <div className="text-sm font-semibold">
                                    {liveErrors.length > 0
                                        ? t('save_bar_blocked', { count: liveErrors.length })
                                        : t('save_bar_complete')}
                                </div>
                                <div className="text-base-content/55 text-xs">
                                    {savedAt
                                        ? t('save_bar_autosaved', { time: relativeTime(savedAt, locale) })
                                        : t('save_bar_unsaved')}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href={`/${locale}/employer/jobs`}
                                className="btn btn-ghost btn-sm border-base-300 rounded-full border"
                            >
                                {t('cancel')}
                            </Link>
                            {isActive ? (
                                <>
                                    <button
                                        type="button"
                                        disabled={submitting}
                                        onClick={() => save('save_no_notify')}
                                        className="btn btn-sm border-base-300 rounded-full border bg-transparent"
                                    >
                                        {t('save_no_notify')}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={submitting}
                                        onClick={() => save('save_notify')}
                                        className="btn btn-primary btn-sm rounded-full"
                                    >
                                        <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                                        {t('save_notify_crew')}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        disabled={submitting}
                                        onClick={() => save('draft')}
                                        className="btn btn-sm border-base-300 rounded-full border bg-transparent"
                                    >
                                        {t('save_draft')}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={submitting || !canPublish}
                                        title={!canPublish ? t('publish_blocked_pending_verification') : undefined}
                                        onClick={() => save('publish')}
                                        className="btn btn-primary btn-sm rounded-full"
                                    >
                                        <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                                        {t('publish')}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
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
        </form>
    );
}

function Header({
    mode,
    title,
    jobId,
    humanId,
    status,
    publishedAt,
    startDate,
    applicantsCount,
    spotsOpen,
    autosaveStatus,
    savedAt,
    locale,
}: {
    mode: Mode;
    title: string;
    jobId: string | null;
    humanId: string | null;
    status: 'draft' | 'active' | 'closed' | 'filled';
    publishedAt: string | null;
    startDate: string;
    applicantsCount: number;
    spotsOpen: number;
    autosaveStatus: 'idle' | 'pending' | 'saving' | 'saved' | 'error';
    savedAt: string | null;
    locale: string;
}) {
    const t = useTranslations('employer.jobs.form_v2');
    const tList = useTranslations('employer.jobs.list');
    const router = useRouter();
    const closeDialogRef = useRef<HTMLDialogElement>(null);
    const [closing, setClosing] = useState(false);

    const isLive = status === 'active' && !!publishedAt;
    const isClosed = status === 'closed' || status === 'filled';
    const startsInFuture = (() => {
        if (!startDate) return false;
        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        return startDate > todayKey;
    })();

    function eyebrow(): string {
        if (mode === 'create') return t('header_meta_new');
        if (status === 'draft') return t('header_meta_draft');
        if (isClosed) return t('header_meta_closed');
        if (status === 'active') {
            if (startsInFuture) return t('header_meta_starts', { date: formatStartDate(startDate, locale) });
            return t('header_meta_live', { applicants: applicantsCount });
        }
        return t('header_meta_new');
    }

    async function handleClose() {
        if (!jobId) return;
        setClosing(true);
        try {
            const r = await patchJob(locale, jobId, { status: 'closed' });
            if (r.kind === 'ok') {
                router.push(`/${locale}/employer/jobs`);
            }
        } finally {
            setClosing(false);
            closeDialogRef.current?.close();
        }
    }

    const showDuplicate = mode === 'edit' && status !== 'draft' && !!jobId;
    const showClose = mode === 'edit' && status === 'active' && !!jobId;

    return (
        <div className="mb-5 pt-2">
            <nav aria-label="Breadcrumb" className="text-base-content/55 mb-2 flex items-center gap-1.5 text-xs">
                <Link href={`/${locale}/employer/jobs`} className="hover:text-base-content no-underline">
                    {tList('title')}
                </Link>
                <FontAwesomeIcon icon={faChevronRight} className="h-2.5 w-2.5" />
                <span className="text-base-content font-semibold">
                    {mode === 'edit' ? t('breadcrumb_edit') : t('breadcrumb_new')}
                </span>
            </nav>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
                        {humanId && mode === 'edit'
                            ? `#${humanId} · ${eyebrow()}`
                            : eyebrow()}
                    </div>
                    <h1 className="font-display mt-1.5 text-3xl font-light leading-tight tracking-tight md:text-4xl">
                        {mode === 'edit' ? t('h1_edit') : t('h1_new')}{' '}
                        {title && <em className="text-primary font-light italic">{title}</em>}
                    </h1>
                    {mode === 'edit' && isLive && (
                        <div className="text-base-content/65 mt-2 flex flex-wrap items-center gap-2 text-sm">
                            <span className="bg-error/10 text-error inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider">
                                <span className="bg-error h-1.5 w-1.5 rounded-full" aria-hidden />
                                {t('spots_open', { n: spotsOpen })}
                            </span>
                            <AutosaveBadge status={autosaveStatus} savedAt={savedAt} locale={locale} />
                        </div>
                    )}
                </div>
                {mode === 'edit' && (
                    <div className="flex items-center gap-2">
                        {showDuplicate && (
                            <button
                                type="button"
                                onClick={() => router.push(`/${locale}/employer/jobs/new?from=${jobId}`)}
                                className="btn btn-sm btn-ghost border-base-300 rounded-full border"
                            >
                                <FontAwesomeIcon icon={faCopy} className="h-3 w-3" />
                                {tList('duplicate')}
                            </button>
                        )}
                        {showClose && (
                            <button
                                type="button"
                                onClick={() => closeDialogRef.current?.showModal()}
                                className="btn btn-sm btn-ghost border-base-300 text-error rounded-full border"
                            >
                                {tList('close')}
                            </button>
                        )}
                        <label
                            htmlFor="preview-drawer"
                            className="btn btn-sm btn-primary rounded-full xl:hidden"
                            aria-label={t('open_preview')}
                        >
                            <FontAwesomeIcon icon={faEye} className="h-3 w-3" />
                            {t('preview_button')}
                        </label>
                    </div>
                )}
            </div>

            <dialog ref={closeDialogRef} className="modal">
                <div className="modal-box">
                    <h3 className="font-display text-xl font-normal">{t('close_modal_title')}</h3>
                    <p className="text-base-content/70 mt-2 text-sm">{t('close_modal_body')}</p>
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn btn-sm border-base-300 rounded-full border bg-transparent">
                                {t('close_modal_keep')}
                            </button>
                        </form>
                        <button
                            type="button"
                            disabled={closing}
                            onClick={handleClose}
                            className="btn btn-sm btn-error rounded-full"
                        >
                            {t('close_modal_confirm')}
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </div>
    );
}

function formatStartDate(yyyymmdd: string, locale: string): string {
    const [y, m, d] = yyyymmdd.split('-').map(Number);
    if (!y || !m || !d) return yyyymmdd;
    return new Date(y, m - 1, d).toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
    });
}

function AutosaveBadge({
    status,
    savedAt,
    locale,
}: {
    status: 'idle' | 'pending' | 'saving' | 'saved' | 'error';
    savedAt: string | null;
    locale: string;
}) {
    const t = useTranslations('employer.jobs.form_v2');
    if (status === 'saving') return <span className="text-base-content/55 text-xs">{t('autosaving')}</span>;
    if (status === 'pending') return <span className="text-base-content/55 text-xs">{t('autosave_pending')}</span>;
    if (status === 'error') return <span className="text-error text-xs">{t('autosave_error')}</span>;
    if (savedAt)
        return (
            <span className="text-base-content/55 text-xs">
                {t('autosave_saved', { time: relativeTime(savedAt, locale) })}
            </span>
        );
    return null;
}

function relativeTime(iso: string, locale: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const sec = Math.round(ms / 1000);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    if (sec < 60) return rtf.format(-sec, 'second');
    const min = Math.round(sec / 60);
    if (min < 60) return rtf.format(-min, 'minute');
    const hr = Math.round(min / 60);
    return rtf.format(-hr, 'hour');
}

function publishErrorMessage(code: string, message?: string): string {
    switch (code) {
        case 'wage_required':
            return 'Set a base hourly rate above $0 before publishing.';
        case 'employer_not_verified':
            return "Your business is still being verified. You can publish postings once it's approved.";
        case 'plan_posting_limit':
            return 'You have hit your plan posting limit. Upgrade or close an active posting to publish another.';
        case 'validation_failed':
            return message === 'not_draft'
                ? 'This posting is no longer a draft.'
                : 'Posting is missing required information.';
        case 'cannot_change_county_active':
            return 'County is locked while a posting is live.';
        case 'positions_below_hire_count':
            return "You can't reduce crew size below the number already hired.";
        case 'end_date_shorten_forbidden':
            return "End date can be extended but not shortened on a live posting.";
        case 'not_found':
            return 'Posting not found.';
        default:
            return message || 'Could not save.';
    }
}
