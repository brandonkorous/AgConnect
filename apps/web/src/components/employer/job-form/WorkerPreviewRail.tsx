'use client';

// Right-rail "what the worker sees" mockup. Re-renders from the live form
// state, EN/ES toggleable. Hidden < xl in the page layout.

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import type { CropLookupView, SkillLookupView } from '@/lib/api/employer';
import { CropGlyph } from '@/components/ui/CropGlyph';
import { fetchMatchPreview, type MatchPreviewResult } from './api';
import type { JobFormState } from './types';

type Props = {
  state: JobFormState;
  crop?: CropLookupView | null;
  skills?: SkillLookupView[];
  employerName: string;
  smsApplyKeyword: string | null;
  locale: string;
};

export function WorkerPreviewRail({
  state,
  crop,
  skills = [],
  employerName,
  smsApplyKeyword,
  locale,
}: Props) {
  const t = useTranslations('employer.jobs.form_v2.preview');
  const tForm = useTranslations('employer.jobs.form_v2');
  const [lang, setLang] = useState<'en' | 'es'>(locale === 'es' ? 'es' : 'en');
  const [match, setMatch] = useState<MatchPreviewResult | null>(null);

  // Refresh match preview when skills/county/min-experience/age change.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const r = await fetchMatchPreview(locale, {
        skills: state.skills,
        minExperience: state.minExperience,
        minAge: state.minAge,
        county: state.county,
        siteLat: state.siteLat,
        siteLng: state.siteLng,
        radiusMiles: 25,
      });
      if (!cancelled) setMatch(r);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [
    state.skills,
    state.minExperience,
    state.minAge,
    state.county,
    state.siteLat,
    state.siteLng,
    locale,
  ]);

  const title = lang === 'es' ? state.titleEs : state.titleEn;
  const description = lang === 'es' ? state.descriptionEs : state.descriptionEn;
  void description;
  const dailyTakeMin = state.wageMin * computeDailyHours(state);
  const dailyTakeMax =
    state.wageMax * computeDailyHours(state) + (state.pieceRate ?? 0) * 50;

  const skillLabels = state.skills.slice(0, 3).map((slug) => {
    if (slug.startsWith('custom:')) return slug.slice('custom:'.length);
    const found = skills.find((s) => s.slug === slug);
    if (!found) return slug;
    return lang === 'es' ? found.labelEs : found.labelEn;
  });

  const dayShortLabels: string[] = [
    tForm('weekday_short.mon'),
    tForm('weekday_short.tue'),
    tForm('weekday_short.wed'),
    tForm('weekday_short.thu'),
    tForm('weekday_short.fri'),
    tForm('weekday_short.sat'),
    tForm('weekday_short.sun'),
  ];
  const dayRangeSeparator = tForm('day_range_separator');
  const dailyLabel = tForm('weekday_daily');

  return (
    <aside aria-label={t('rail_label')} className="hidden xl:block">
      <div className="flex items-center justify-between px-1.5 pb-2.5">
        <span className="text-base-content/60 font-mono text-[10.5px] font-bold uppercase tracking-[0.1em]">
          {t('worker_preview')}
        </span>
        <div className="bg-base-200 border-base-300 join rounded-full border p-0.5">
          {(['en', 'es'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={[
                'join-item rounded-full px-2.5 py-0.5 font-mono text-[10.5px] font-bold transition-colors',
                lang === l
                  ? 'bg-base-100 text-base-content'
                  : 'text-base-content/40',
              ].join(' ')}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="mockup-phone mx-auto">
        <div className="mockup-phone-camera" />
        <div className="mockup-phone-display bg-base-100 overflow-y-auto">
          <div className="flex flex-col gap-3 px-4 pt-10 pb-5">
            <PhoneStatusBar lang={lang} />
            <JobPreviewCard
              lang={lang}
              title={title}
              employer={employerName}
              county={state.county}
              startDate={state.startDate}
              positionsTotal={state.positionsTotal}
              dailyTakeMin={dailyTakeMin}
              dailyTakeMax={dailyTakeMax}
              wageMin={state.wageMin}
              pieceRate={state.pieceRate}
              pieceUnit={state.pieceUnit}
              skills={skillLabels}
              dayShortLabels={dayShortLabels}
              dayRangeSeparator={dayRangeSeparator}
              dailyLabel={dailyLabel}
              glyphKey={crop?.glyphKey ?? 'almond'}
              dailyStartTime={state.dailyStartTime}
              dailyEndTime={state.dailyEndTime}
              workingDays={state.workingDays}
              transport={state.transport}
              pickupPoint={state.pickupPoint}
            />
            {state.smsApplyEnabled && smsApplyKeyword && (
              <SmsApplyCard keyword={smsApplyKeyword} />
            )}
          </div>
        </div>
      </div>

      {match && (
        <div className="bg-base-100 border-base-300 mt-3 rounded-xl border p-3 text-xs">
          <div className="mb-1.5 flex items-center gap-1.5">
            <FontAwesomeIcon icon={faWandMagicSparkles} className="text-primary h-3 w-3" />
            <strong className="font-mono text-[10px] font-bold uppercase tracking-[0.08em]">
              {t('match_preview')}
            </strong>
          </div>
          <p className="text-base-content/70 leading-relaxed">
            {t.rich('match_preview_body', {
              n: () => <strong className="text-primary">{match.qualifyingCount}</strong>,
              radius: match.radiusMiles,
              top: match.topMatchCount,
            })}
          </p>
        </div>
      )}
    </aside>
  );
}

function PhoneStatusBar({ lang }: { lang: 'en' | 'es' }) {
  const now = new Date();
  const time = now.toLocaleTimeString(lang === 'es' ? 'es-MX' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return (
    <div className="text-base-content/50 mb-3.5 flex items-center justify-between font-mono text-[10.5px]">
      <span>{time}</span>
      <span>● ● ●</span>
    </div>
  );
}

function JobPreviewCard(props: {
  lang: 'en' | 'es';
  title: string;
  employer: string;
  county: string;
  startDate: string;
  positionsTotal: number;
  dailyTakeMin: number;
  dailyTakeMax: number;
  wageMin: number;
  pieceRate: number | null;
  pieceUnit: string | null;
  skills: string[];
  glyphKey: string;
  dailyStartTime: string;
  dailyEndTime: string;
  workingDays: number;
  transport: boolean;
  pickupPoint: string;
  dayShortLabels: string[];
  dayRangeSeparator: string;
  dailyLabel: string;
}) {
  const t = useTranslations('employer.jobs.form_v2.preview');
  const startLabel = props.startDate ? formatLocalDate(props.startDate, props.lang) : '—';
  const wage = formatHourly(props.wageMin, props.lang);
  return (
    <div className="bg-base-100 border-base-300 overflow-hidden rounded-2xl border shadow-sm">
      <div className="bg-warning relative grid h-[86px] place-items-center">
        <CropGlyph glyph={props.glyphKey} size={44} className="text-base-100" />
        <div className="bg-base-content/40 text-base-100 absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider">
          {t('hero_meta', { spots: props.positionsTotal, start: startLabel })}
        </div>
        <div className="bg-base-content/70 text-base-100 absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider">
          {t('spots_open', { count: props.positionsTotal })}
        </div>
      </div>
      <div className="p-3.5">
        <div className="font-display text-[17px] font-medium leading-tight tracking-tight">
          {props.title || '—'}
        </div>
        <div className="text-base-content/55 mt-0.5 text-[11px]">
          {props.employer} · {t(`county_${props.county.toLowerCase()}`)}
        </div>
        <div className="bg-primary text-primary-content mt-2.5 rounded-lg px-2.5 py-2">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider opacity-80">
            {t('takehome_label')}
          </div>
          <div className="font-display mt-0.5 text-lg tracking-tight tabular-nums">
            ${Math.round(props.dailyTakeMin)} – ${Math.round(props.dailyTakeMax)}
          </div>
          <div className="text-[10px] opacity-85 tabular-nums">
            {wage}/hr
            {props.pieceRate ? ` + ${formatHourly(props.pieceRate, props.lang)}/${props.pieceUnit ?? 'lb'} piece` : ''}
          </div>
        </div>
        {props.skills.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {props.skills.map((s) => (
              <span
                key={s}
                className="bg-base-200 text-base-content/70 rounded px-1.5 py-0.5 text-[9.5px] font-semibold"
              >
                {s}
              </span>
            ))}
          </div>
        )}
        <div className="border-base-300 mt-3 grid grid-cols-2 gap-2 border-t border-dashed pt-2.5">
          <div>
            <div className="text-base-content/50 font-mono text-[9px] uppercase tracking-wider">
              {t('schedule_label')}
            </div>
            <div className="mt-0.5 text-[11px] font-semibold">
              {fmtTimeRange(props.dailyStartTime, props.dailyEndTime)}
            </div>
            <div className="text-base-content/55 text-[10px]">
              {fmtWorkingDays(props.workingDays, props.dayShortLabels, props.dayRangeSeparator, props.dailyLabel)}
            </div>
          </div>
          <div>
            <div className="text-base-content/50 font-mono text-[9px] uppercase tracking-wider">
              {t('transport_label')}
            </div>
            <div className="mt-0.5 text-[11px] font-semibold">
              {props.transport ? t('transport_provided') : t('transport_self')}
            </div>
            {props.transport && props.pickupPoint && (
              <div className="text-base-content/55 truncate text-[10px]">{props.pickupPoint}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SmsApplyCard({ keyword }: { keyword: string }) {
  const t = useTranslations('employer.jobs.form_v2.preview');
  return (
    <div className="bg-neutral text-neutral-content mt-3 rounded-xl p-3">
      <div className="text-accent font-mono text-[9.5px] font-bold uppercase tracking-wider">
        {t('apply_by_text')}
      </div>
      <div className="mt-1 font-mono text-[13px] font-semibold">{keyword}</div>
      <button
        type="button"
        className="bg-accent text-accent-content mt-2.5 w-full rounded-full py-2 text-xs font-bold"
      >
        {t('apply_one_tap')}
      </button>
    </div>
  );
}

function computeDailyHours(state: JobFormState): number {
  if (!state.dailyStartTime || !state.dailyEndTime) return 8;
  const [sh, sm] = state.dailyStartTime.split(':').map(Number);
  const [eh, em] = state.dailyEndTime.split(':').map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 8;
  const mins = (eh! * 60 + em!) - (sh! * 60 + sm!);
  return mins > 0 ? mins / 60 : 8;
}

function formatLocalDate(yyyymmdd: string, lang: 'en' | 'es'): string {
  // `new Date('2026-05-15')` parses as UTC midnight, then toLocaleDateString
  // shifts to the user's TZ — off by one day in PDT/PST. Build from local
  // components instead. Use the worker-preview language so AUG localizes to AGO.
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  if (!y || !m || !d) return yyyymmdd;
  return new Date(y, m - 1, d).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatHourly(value: number, lang: 'en' | 'es'): string {
  // Two-decimal currency for hourly + piece rates. $19.5 reads as a typo;
  // $19.50 is the polished form workers expect on a job posting.
  return new Intl.NumberFormat(lang === 'es' ? 'es-MX' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function fmtTimeRange(start: string, end: string): string {
  if (!start || !end) return '—';
  return `${fmt(start)} – ${fmt(end)}`;
}
function fmt(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (h == null || m == null) return hhmm;
  const am = h < 12;
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${am ? 'AM' : 'PM'}`;
}

function fmtWorkingDays(
  mask: number,
  shortLabels: string[],
  rangeSeparator: string,
  dailyLabel: string,
): string {
  const on = shortLabels.filter((_, i) => (mask & (1 << i)) !== 0);
  if (on.length === 0) return '—';
  if (on.length === 7) return dailyLabel;
  if (on.length >= 2) return `${on[0]}${rangeSeparator}${on[on.length - 1]}`;
  return on.join(', ');
}
