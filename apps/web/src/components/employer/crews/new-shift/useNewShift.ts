'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';
import {
  countSeriesDates,
  daySpanDays,
  mondayIndexOf,
  seriesDates,
  type NewShiftDraft,
} from './types';

const SERIES_MAX_DAYS = 90;

export type FieldErrors = {
  rangeStart?: string;
  rangeEnd?: string;
  weekdayMask?: string;
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
  const initialMask = Array.from({ length: 7 }, (_, i) => i === mondayIndexOf(initialDate));
  const [draft, setDraft] = useState<NewShiftDraft>({
    crewId: defaultCrewId ?? null,
    shiftDate: initialDate,
    rangeStart: initialDate,
    rangeEnd: initialDate,
    weekdayMask: initialMask,
    startTime: '06:00',
    endTime: '14:00',
    status: 'scheduled',
    shiftType: 'work',
    locationLabel: '',
    locationLat: null,
    locationLng: null,
    notes: '',
    metadata: {},
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
    (patch: Partial<NewShiftDraft>) => {
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
    if (!draft.rangeStart) errs.rangeStart = t('error_field_required');
    if (!draft.rangeEnd) errs.rangeEnd = t('error_field_required');
    if (!draft.startTime) errs.startTime = t('error_field_required');
    if (!draft.endTime) errs.endTime = t('error_field_required');

    if (draft.rangeStart && draft.rangeEnd) {
      if (draft.rangeEnd < draft.rangeStart) {
        errs.rangeEnd = t('series.error_range_invalid');
      } else if (daySpanDays(draft.rangeStart, draft.rangeEnd) > SERIES_MAX_DAYS) {
        errs.rangeEnd = t('series.count_too_many');
      } else if (!draft.weekdayMask.some(Boolean)) {
        errs.weekdayMask = t('series.error_no_weekdays');
      } else if (
        countSeriesDates(draft.rangeStart, draft.rangeEnd, draft.weekdayMask) === 0
      ) {
        errs.weekdayMask = t('series.count_none');
      }
    }

    if (
      !draft.locationLabel ||
      draft.locationLat == null ||
      draft.locationLng == null
    ) {
      errs.locationLabel = t('error_no_location');
    }
    return errs;
  }, [draft, t]);

  const isComplete = useMemo(() => Object.keys(validate()).length === 0, [validate]);

  const shiftCount = useMemo(
    () => countSeriesDates(draft.rangeStart, draft.rangeEnd, draft.weekdayMask),
    [draft.rangeStart, draft.rangeEnd, draft.weekdayMask],
  );

  async function save() {
    setError(null);
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstField = Object.keys(errs)[0];
      const anchor = firstField === 'locationLabel' ? 'loc' : 'date';
      const el = document.getElementById(anchor);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setBusy(true);
    const dates = seriesDates(draft.rangeStart, draft.rangeEnd, draft.weekdayMask);
    const shared = {
      crewId: draft.crewId,
      startTime: draft.startTime,
      endTime: draft.endTime || undefined,
      shiftType: draft.shiftType,
      locationLabel: draft.locationLabel,
      locationLat: draft.locationLat,
      locationLng: draft.locationLng,
      notes: draft.notes.trim() || undefined,
      metadata: draft.metadata,
    };
    const single = dates.length === 1;
    const path = single ? '/v1/employer/shifts' : '/v1/employer/shifts/series';
    const body = single
      ? { ...shared, shiftDate: dates[0] }
      : {
          ...shared,
          rangeStart: draft.rangeStart,
          rangeEnd: draft.rangeEnd,
          weekdayMask: draft.weekdayMask,
        };
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.post(path, body, { handleErrorInline: true });
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
      router.push(`/${locale}/employer/crews?week=${draft.rangeStart}`);
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
    shiftCount,
    touched,
    save,
  };
}
