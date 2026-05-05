'use client';

import { useCallback, useState } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';
import {
    dowOfDate,
    repeatDatesForDraft,
    type EditShiftPageProps,
    type ShiftDraft,
} from './types';

type Args = {
    locale: string;
    shift: EditShiftPageProps['shift'];
};

export function useEditShift({ locale, shift }: Args) {
    const t = useTranslations('employer.crews.edit_shift');
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

    return {
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
    };
}

function nextDay(iso: string): string {
    const d = new Date(`${iso}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
}
