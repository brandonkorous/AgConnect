'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';
import {
  dowOfDate,
  repeatDatesForDraft,
  type ShiftDraft,
} from '../edit-shift/types';

export type FieldErrors = {
  shiftDate?: string;
  startTime?: string;
  endTime?: string;
  locationLabel?: string;
};

type Args = {
  locale: string;
  defaultCrewId?: string;
  defaultDate?: string;
};

const TODAY_ISO = (): string => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
};

export function useNewShift({ locale, defaultCrewId, defaultDate }: Args) {
  const t = useTranslations('employer.crews.new_shift');
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const initialDate = defaultDate || TODAY_ISO();
  const baseDow = dowOfDate(initialDate);
  const [draft, setDraft] = useState<ShiftDraft>({
    crewId: defaultCrewId ?? null,
    shiftDate: initialDate,
    startTime: '06:00',
    endTime: '14:00',
    status: 'scheduled',
    shiftType: 'work',
    locationLabel: '',
    locationLat: null,
    locationLng: null,
    notes: '',
    metadata: {},
    repeatDow: {
      Mon: false,
      Tue: false,
      Wed: false,
      Thu: false,
      Fri: false,
      Sat: false,
      Sun: false,
      [baseDow]: true,
    },
  });

  const [touched, setTouched] = useState<Set<string>>(() => new Set());

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => {
      if (prev.has(field)) return prev;
      const next = new Set(prev);
      next.add(field);
      return next;
    });
  }, []);

  const updateDraft = useCallback(
    (patch: Partial<ShiftDraft>) => {
      setDraft((d) => ({ ...d, ...patch }));
      for (const k of Object.keys(patch)) markTouched(k);
      setFieldErrors((prev) => {
        if (Object.keys(prev).length === 0) return prev;
        const next = { ...prev };
        for (const k of Object.keys(patch)) {
          delete next[k as keyof FieldErrors];
        }
        return next;
      });
    },
    [markTouched],
  );

  const validate = useCallback((): FieldErrors => {
    const errs: FieldErrors = {};
    if (!draft.shiftDate) errs.shiftDate = t('error_field_required');
    if (!draft.startTime) errs.startTime = t('error_field_required');
    if (!draft.endTime) errs.endTime = t('error_field_required');
    if (
      !draft.locationLabel ||
      draft.locationLat == null ||
      draft.locationLng == null
    ) {
      errs.locationLabel = t('error_no_location');
    }
    return errs;
  }, [draft.shiftDate, draft.startTime, draft.endTime, draft.locationLabel, draft.locationLat, draft.locationLng, t]);

  const isComplete = useMemo(() => Object.keys(validate()).length === 0, [validate]);

  async function save() {
    setError(null);
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstField = Object.keys(errs)[0];
      const anchor =
        firstField === 'locationLabel'
          ? 'loc'
          : firstField === 'shiftDate' || firstField === 'startTime' || firstField === 'endTime'
            ? 'date'
            : null;
      if (anchor) {
        const el = document.getElementById(anchor);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    setBusy(true);
    const repeatDates = repeatDatesForDraft(draft.shiftDate, draft.repeatDow);
    const body = {
      crewId: draft.crewId,
      shiftDate: draft.shiftDate,
      startTime: draft.startTime,
      endTime: draft.endTime || undefined,
      shiftType: draft.shiftType,
      locationLabel: draft.locationLabel,
      locationLat: draft.locationLat,
      locationLng: draft.locationLng,
      notes: draft.notes.trim() || undefined,
      metadata: draft.metadata,
      ...(repeatDates.length > 0 ? { repeatDates } : {}),
    };
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.post<{ shift: { id: string } }>(
        '/v1/employer/shifts',
        body,
        { handleErrorInline: true },
      );
      if (!isOk(res)) {
        if (res.error.fields) {
          const next: FieldErrors = {};
          for (const [k, msg] of Object.entries(res.error.fields)) {
            if (typeof msg === 'string') (next as Record<string, string>)[k] = msg;
          }
          setFieldErrors(next);
          return;
        }
        setError(res.error.message || t('error_save'));
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
    fieldErrors,
    isComplete,
    touched,
    save,
  };
}
