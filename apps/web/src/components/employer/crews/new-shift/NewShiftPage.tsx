'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight,
  faCheck,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';
import { SectionNav } from '../edit-shift/SectionNav';
import { ShiftTypeSection } from '../edit-shift/ShiftTypeSection';
import { CrewPickerSection } from '../edit-shift/CrewPickerSection';
import { DateTimeSection } from '../edit-shift/DateTimeSection';
import { LocationSection } from '../edit-shift/LocationSection';
import { LogisticsSection } from '../edit-shift/LogisticsSection';
import { SafetySection } from '../edit-shift/SafetySection';
import { NotificationsSection } from '../edit-shift/NotificationsSection';
import { PreviewRail } from '../edit-shift/PreviewRail';
import {
  dowOfDate,
  repeatDatesForDraft,
  SECTION_IDS,
  type ShiftDraft,
} from '../edit-shift/types';
import type { CrewView } from '@/lib/api/employer-ops';

type Props = {
  locale: string;
  crews: CrewView[];
  defaultCrewId?: string;
  defaultDate?: string;
};

type FieldErrors = {
  shiftDate?: string;
  startTime?: string;
  endTime?: string;
  locationLabel?: string;
};

const TODAY_ISO = (): string => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
};

export function NewShiftPage({ locale, crews, defaultCrewId, defaultDate }: Props) {
  const t = useTranslations('employer.crews.new_shift');
  const tNav = useTranslations('employer.crews.edit_shift.section');
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

  const activeCrew = useMemo(
    () => crews.find((c) => c.id === draft.crewId) ?? null,
    [crews, draft.crewId],
  );
  const crewName = activeCrew?.name ?? null;
  const crewSize = activeCrew?.memberCount ?? 0;

  function validate(): FieldErrors {
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
  }

  const isComplete = useMemo(
    () => Object.keys(validate()).length === 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft.shiftDate, draft.startTime, draft.endTime, draft.locationLabel, draft.locationLat, draft.locationLng],
  );

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

  const repeatDates = repeatDatesForDraft(draft.shiftDate, draft.repeatDow);

  return (
    <div className="container mx-auto px-5 pb-16 pt-8 md:px-8 lg:px-20">
      <nav
        aria-label={t('breadcrumbs_aria')}
        className="text-base-content/60 mb-3 flex flex-wrap items-center gap-1.5 text-xs"
      >
        <Link href={`/${locale}/employer/crews`} className="hover:text-base-content">
          {t('breadcrumb_crews')}
        </Link>
        <FontAwesomeIcon icon={faChevronRight} className="h-2 w-2 opacity-60" />
        <span className="text-base-content/80 font-semibold">{t('breadcrumb_current')}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
            {t('eyebrow')}
          </p>
          <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
            {t('title_a')}{' '}
            <em className="text-primary not-italic font-light">{t('title_b')}</em>
          </h1>
          <div className="text-base-content/70 mt-2 text-sm">
            {t('subtitle', { crew: crewName ?? t('breadcrumb_no_crew') })}
          </div>
        </div>
      </div>

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

      <div className="grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)] xl:grid-cols-[12rem_minmax(0,1fr)_22rem]">
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
          <DateTimeSection
            draft={draft}
            onChange={updateDraft}
            crewSize={crewSize}
            errors={{
              shiftDate: fieldErrors.shiftDate ?? null,
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
          <WorkersPlaceholder t={t} />

          <div className="bg-base-100 border-base-300 shadow-pop sticky bottom-4 z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
            <div className="flex items-center gap-3">
              <span
                className={[
                  'grid h-9 w-9 place-items-center rounded-full',
                  isComplete ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/50',
                ].join(' ')}
              >
                <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold">
                  {isComplete ? t('save_bar_complete') : t('save_bar_incomplete')}
                </div>
                <div className="text-base-content/55 text-xs">
                  {!isComplete
                    ? t('save_bar_help_incomplete')
                    : repeatDates.length > 0
                      ? t('save_bar_repeat', { count: repeatDates.length })
                      : t('save_bar_single')}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/${locale}/employer/crews?week=${draft.shiftDate}`}
                className="btn btn-ghost btn-sm border-base-300 rounded-full border"
              >
                {t('footer_cancel')}
              </Link>
              <button
                type="button"
                onClick={save}
                disabled={busy || !isComplete}
                className={[
                  'btn btn-primary btn-sm rounded-full',
                  !isComplete ? 'btn-disabled' : '',
                ].join(' ')}
              >
                {busy ? (
                  <span className="loading loading-spinner loading-sm" aria-hidden />
                ) : (
                  <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                )}
                {t('footer_create')}
              </button>
            </div>
          </div>
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

function WorkersPlaceholder({
  t,
}: {
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <section
      id="workers"
      className="bg-base-100 border-base-300 mb-5 scroll-mt-24 rounded-2xl border p-6"
    >
      <header className="border-base-300 mb-5 border-b pb-4">
        <h2 className="font-display text-2xl font-light tracking-tight">
          {t('workers_placeholder.title')}
        </h2>
        <p className="text-base-content/60 mt-1 text-sm">
          {t('workers_placeholder.sub')}
        </p>
      </header>
      <div className="border-base-300 bg-base-200/40 flex flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center">
        <span className="bg-primary/10 text-primary grid h-10 w-10 place-items-center rounded-full">
          <FontAwesomeIcon icon={faUsers} className="h-4 w-4" />
        </span>
        <div className="text-sm font-semibold">{t('workers_placeholder.heading')}</div>
        <div className="text-base-content/60 max-w-xs text-xs leading-relaxed">
          {t('workers_placeholder.body')}
        </div>
      </div>
    </section>
  );
}
