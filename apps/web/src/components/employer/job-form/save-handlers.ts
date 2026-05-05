'use client';

// Pure save-handler logic. JobForm wires these up; nothing here owns state
// outside of what callers pass through.

import type { JobFormState } from './types';
import { toApiBody } from './types';
import {
    createJob,
    patchJob,
    publishJob,
    replaceScreeningQuestions,
    type SaveResult,
} from './api';
import { fromServerFields, type FieldError } from './validation';

export type SaveAction = 'draft' | 'publish' | 'save_no_notify' | 'save_notify';

export type SaveOutcome =
    | {
          kind: 'ok';
          jobId: string;
          smsApplyKeyword: string | null;
          renotifyMsgKey?: 'renotify_dispatched' | 'renotify_suppressed';
          renotifyCount?: number;
          wasNew: boolean;
      }
    | { kind: 'fields'; errors: FieldError[] }
    | { kind: 'error'; message: string };

type Args = {
    locale: string;
    mode: 'create' | 'edit';
    state: JobFormState;
    jobId: string | null;
    action: SaveAction;
};

export async function runSave({ locale, mode, state, jobId, action }: Args): Promise<SaveOutcome> {
    const baseBody = toApiBody(state);
    const body =
        action === 'save_no_notify'
            ? { ...baseBody, notifyApplicants: false }
            : action === 'save_notify'
              ? { ...baseBody, notifyApplicants: true }
              : baseBody;

    const wasNew = mode === 'create' && !jobId;
    const res: SaveResult = wasNew
        ? await createJob(locale, body)
        : await patchJob(locale, jobId!, body);

    if (res.kind === 'error') {
        const fromServer = fromServerFields(res.fields);
        if (fromServer.length > 0) return { kind: 'fields', errors: fromServer };
        return { kind: 'error', message: publishErrorMessage(res.code, res.message) };
    }

    const newId = res.job.id;
    const smsApplyKeyword = res.job.smsApplyKeyword ?? null;

    if (state.screeningQuestions.length > 0 || !wasNew) {
        await replaceScreeningQuestions(
            locale,
            newId,
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

    if (action === 'publish') {
        const pub = await publishJob(locale, newId);
        if (!pub.ok) {
            return { kind: 'error', message: publishErrorMessage(pub.code, pub.message) };
        }
    }

    let renotifyMsgKey: 'renotify_dispatched' | 'renotify_suppressed' | undefined;
    let renotifyCount: number | undefined;
    if (res.edit && res.edit.renotificationsQueued > 0) {
        renotifyMsgKey = 'renotify_dispatched';
        renotifyCount = res.edit.renotificationsQueued;
    } else if (
        res.edit &&
        res.edit.renotificationsSuppressed &&
        (res.edit.suppressedRecipientCount ?? 0) > 0
    ) {
        renotifyMsgKey = 'renotify_suppressed';
        renotifyCount = res.edit.suppressedRecipientCount;
    }

    return {
        kind: 'ok',
        jobId: newId,
        smsApplyKeyword,
        renotifyMsgKey,
        renotifyCount,
        wasNew,
    };
}

export function publishErrorMessage(code: string, message?: string): string {
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
            return 'End date can be extended but not shortened on a live posting.';
        case 'not_found':
            return 'Posting not found.';
        default:
            return message || 'Could not save.';
    }
}
