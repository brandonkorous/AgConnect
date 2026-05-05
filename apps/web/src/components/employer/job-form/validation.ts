// Field-level validation summary for the JobForm. Combines client-side Zod
// pre-flight with server-returned `fields` so users see exactly what is
// missing or invalid, grouped by section, with anchor links.

import { CreateJobBody, PatchJobBody } from '@agconn/schemas';
import type { JobFormState } from './types';
import { toApiBody } from './types';

export type FieldErrorReason =
    | 'required'
    | 'too_short'
    | 'too_long'
    | 'invalid_format'
    | 'wage_order'
    | 'date_order'
    | 'time_order'
    | 'piece_consistency'
    | 'other';

export type FieldError = {
    path: string;
    sectionKey: string;
    sectionHref: string;
    labelKey: string;
    reason: FieldErrorReason;
    rawMessage: string;
};

const SECTION_BY_KEY: Record<string, string> = {
    basics: '#s-basics',
    schedule: '#s-schedule',
    pay: '#s-pay',
    requirements: '#s-requirements',
    location: '#s-location',
    application: '#s-application',
    compliance: '#s-compliance',
};

// Path → section + reusable existing translation key for the field label.
// Order here is the order errors will display.
const FIELD_META: Record<string, { sectionKey: string; labelKey: string }> = {
    titleEn:               { sectionKey: 'basics',       labelKey: 'field_title' },
    titleEs:               { sectionKey: 'basics',       labelKey: 'field_title_es' },
    cropId:                { sectionKey: 'basics',       labelKey: 'field_crop' },
    roleTypeId:            { sectionKey: 'basics',       labelKey: 'field_role' },
    positionsTotal:        { sectionKey: 'basics',       labelKey: 'field_crew_size' },
    descriptionEn:         { sectionKey: 'basics',       labelKey: 'field_desc_en' },
    descriptionEs:         { sectionKey: 'basics',       labelKey: 'field_desc_es' },

    startDate:             { sectionKey: 'schedule',     labelKey: 'field_start_date' },
    endDate:               { sectionKey: 'schedule',     labelKey: 'field_end_date' },
    dailyStartTime:        { sectionKey: 'schedule',     labelKey: 'field_daily_start' },
    dailyEndTime:          { sectionKey: 'schedule',     labelKey: 'field_daily_end' },
    workingDays:           { sectionKey: 'schedule',     labelKey: 'field_working_days' },

    wageStructure:         { sectionKey: 'pay',          labelKey: 'field_wage_structure' },
    wageMin:               { sectionKey: 'pay',          labelKey: 'field_base_rate_min' },
    wageMax:               { sectionKey: 'pay',          labelKey: 'field_base_rate_max' },
    pieceRate:             { sectionKey: 'pay',          labelKey: 'field_piece_rate' },
    pieceUnit:             { sectionKey: 'pay',          labelKey: 'field_piece_unit' },
    payFrequency:          { sectionKey: 'pay',          labelKey: 'field_pay_frequency' },
    endOfSeasonBonusCents: { sectionKey: 'pay',          labelKey: 'benefit_bonus' },

    skills:                { sectionKey: 'requirements', labelKey: 'field_skills' },
    minExperience:         { sectionKey: 'requirements', labelKey: 'field_min_experience' },
    minAge:                { sectionKey: 'requirements', labelKey: 'field_min_age' },

    county:                { sectionKey: 'location',     labelKey: 'field_county' },
    siteAddress:           { sectionKey: 'location',     labelKey: 'field_site_address' },
    pickupPoint:           { sectionKey: 'location',     labelKey: 'field_pickup' },

    foremanContactId:      { sectionKey: 'application',  labelKey: 'field_foreman' },
    applicationDeadlineAt: { sectionKey: 'application',  labelKey: 'field_app_deadline' },
};

export function fieldMeta(path: string): { sectionKey: string; labelKey: string } | null {
    return FIELD_META[path] ?? FIELD_META[path.split('.')[0]!] ?? null;
}

function classifyZodIssue(issue: { code?: string; message: string; minimum?: unknown }): FieldErrorReason {
    const m = issue.message.toLowerCase();
    if (issue.code === 'invalid_type' || m.includes('required')) return 'required';
    if (issue.code === 'too_small') {
        if (typeof issue.minimum === 'number' && issue.minimum > 1) return 'too_short';
        return 'required';
    }
    if (issue.code === 'too_big') return 'too_long';
    if (issue.code === 'invalid_string' || issue.code === 'invalid_date' || m.includes('invalid')) {
        return 'invalid_format';
    }
    if (m.includes('wage_order')) return 'wage_order';
    if (m.includes('date_order')) return 'date_order';
    if (m.includes('time_order')) return 'time_order';
    if (m.includes('piece_consistency')) return 'piece_consistency';
    return 'other';
}

function classifyServerMessage(message: string): FieldErrorReason {
    const m = message.toLowerCase();
    if (m.includes('required') || m === 'required' || m === 'wage_required') return 'required';
    if (m.includes('too small') || m.includes('at least')) return 'too_short';
    if (m.includes('too big') || m.includes('at most')) return 'too_long';
    if (m.includes('wage_order')) return 'wage_order';
    if (m.includes('date_order')) return 'date_order';
    if (m.includes('time_order')) return 'time_order';
    if (m.includes('piece_consistency')) return 'piece_consistency';
    if (m.includes('invalid')) return 'invalid_format';
    return 'other';
}

function buildEntry(path: string, reason: FieldErrorReason, rawMessage: string): FieldError | null {
    const meta = fieldMeta(path);
    if (!meta) return null;
    return {
        path,
        sectionKey: meta.sectionKey,
        sectionHref: SECTION_BY_KEY[meta.sectionKey] ?? '',
        labelKey: meta.labelKey,
        reason,
        rawMessage,
    };
}

// Run the same Zod schema the server uses, against the body the form would
// send. Returns one entry per offending field path (de-duped).
export function validateForm(state: JobFormState, mode: 'create' | 'edit'): FieldError[] {
    const body = toApiBody(state);
    const schema = mode === 'create' ? CreateJobBody : PatchJobBody;
    const result = schema.safeParse(body);

    const seen = new Set<string>();
    const out: FieldError[] = [];
    if (!result.success) {
        for (const issue of result.error.issues) {
            const path = issue.path.length > 0 ? issue.path.join('.') : '_root';
            if (seen.has(path)) continue;
            seen.add(path);
            const entry = buildEntry(path, classifyZodIssue(issue), issue.message);
            if (entry) out.push(entry);
        }
    }

    // Publish/active-edit semantic checks the schema can't express:
    // server rejects wageMin === 0 with `wage_required`; mirror that here.
    if (mode === 'create' && !seen.has('wageMin') && !(state.wageMin > 0)) {
        seen.add('wageMin');
        const entry = buildEntry('wageMin', 'required', 'wage_required');
        if (entry) out.push(entry);
    }

    return out;
}

// Translate an API `error.fields` map (Zod-shaped) into the same shape we use
// for the summary banner.
export function fromServerFields(fields: Record<string, string> | undefined): FieldError[] {
    if (!fields) return [];
    const out: FieldError[] = [];
    for (const [path, message] of Object.entries(fields)) {
        const entry = buildEntry(path, classifyServerMessage(message), message);
        if (entry) out.push(entry);
    }
    return out;
}

export type ErrorMap = Record<string, FieldError>;

export function groupBySection(errors: FieldError[]): Map<string, FieldError[]> {
    const map = new Map<string, FieldError[]>();
    for (const e of errors) {
        const list = map.get(e.sectionKey) ?? [];
        list.push(e);
        map.set(e.sectionKey, list);
    }
    return map;
}
