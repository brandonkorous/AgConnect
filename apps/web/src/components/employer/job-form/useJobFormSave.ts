'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { JobFormState } from './types';
import {
    runSave,
    type SaveAction,
    type SaveOutcome,
} from './save-handlers';
import { validateForm, type FieldError } from './validation';

type Args = {
    locale: string;
    mode: 'create' | 'edit';
    isActive: boolean;
    state: JobFormState;
    jobId: string | null;
    setJobId: (id: string) => void;
    setSmsKeyword: (k: string) => void;
    setSavedSnapshot: (s: JobFormState) => void;
};

export function useJobFormSave({
    locale,
    mode,
    isActive,
    state,
    jobId,
    setJobId,
    setSmsKeyword,
    setSavedSnapshot,
}: Args) {
    const t = useTranslations('employer.jobs.form_v2');
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
    const [renotifyMsg, setRenotifyMsg] = useState<string | null>(null);

    function focusFirstError(errors: FieldError[]) {
        const first = errors[0];
        if (!first || typeof window === 'undefined') return;
        const id = first.sectionHref.replace(/^#/, '');
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function applyOutcome(outcome: SaveOutcome) {
        if (outcome.kind === 'fields') {
            setFieldErrors(outcome.errors);
            focusFirstError(outcome.errors);
            return;
        }
        if (outcome.kind === 'error') {
            setError(outcome.message);
            return;
        }
        setJobId(outcome.jobId);
        if (outcome.smsApplyKeyword) setSmsKeyword(outcome.smsApplyKeyword);
        setSavedSnapshot(state);
        if (outcome.renotifyMsgKey && outcome.renotifyCount != null) {
            setRenotifyMsg(t(outcome.renotifyMsgKey, { count: outcome.renotifyCount }));
        }
        if (outcome.wasNew) {
            router.replace(`/${locale}/employer/jobs/${outcome.jobId}`);
        } else {
            router.push(`/${locale}/employer/jobs`);
        }
    }

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
            applyOutcome(await runSave({ locale, mode, state, jobId, action }));
        } finally {
            setSubmitting(false);
        }
    }

    return {
        submitting,
        error,
        fieldErrors,
        renotifyMsg,
        save,
    } as const;
}
