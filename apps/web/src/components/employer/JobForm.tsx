'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faLanguage } from '@fortawesome/free-solid-svg-icons';

const COUNTIES = ['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare'] as const;

type Props = {
  locale: string;
  mode: 'create' | 'edit';
  initial?: {
    id: string;
    titleEn: string;
    titleEs: string;
    descriptionEn: string;
    descriptionEs: string;
    county: string;
    wageMin: number;
    wageMax: number;
    startDate: string;
    endDate: string | null;
    skills: string[];
    positionsTotal: number;
  };
};

export function JobForm({ locale, mode, initial }: Props) {
  const t = useTranslations('employer.jobs.form');
  const router = useRouter();

  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? '');
  const [titleEs, setTitleEs] = useState(initial?.titleEs ?? '');
  const [descEn, setDescEn] = useState(initial?.descriptionEn ?? '');
  const [descEs, setDescEs] = useState(initial?.descriptionEs ?? '');
  const [skills, setSkills] = useState<string[]>(initial?.skills ?? []);
  const [skillDraft, setSkillDraft] = useState('');
  const [translating, setTranslating] = useState<'titleEs' | 'titleEn' | 'descEs' | 'descEn' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function translate(field: 'title' | 'description', from: 'en' | 'es', text: string) {
    if (!text.trim()) return;
    const flag = field === 'title' ? (from === 'en' ? 'titleEs' : 'titleEn') : from === 'en' ? 'descEs' : 'descEn';
    setTranslating(flag);
    try {
      const res = await fetch('/api/v1/employer/jobs/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field,
          fromLocale: from,
          toLocale: from === 'en' ? 'es' : 'en',
          text,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const translated = data?.data?.translation ?? '';
      if (field === 'title') {
        if (from === 'en') setTitleEs(translated);
        else setTitleEn(translated);
      } else {
        if (from === 'en') setDescEs(translated);
        else setDescEn(translated);
      }
    } catch {
      // translation_failed handled inline by leaving the field as-is
    } finally {
      setTranslating(null);
    }
  }

  function addSkill() {
    const v = skillDraft.trim();
    if (v && !skills.includes(v)) setSkills([...skills, v]);
    setSkillDraft('');
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>, action: 'draft' | 'publish') {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const body = {
      titleEn,
      titleEs,
      descriptionEn: descEn,
      descriptionEs: descEs,
      county: String(form.get('county') ?? ''),
      city: String(form.get('city') ?? '').trim() || undefined,
      wageMin: Number(form.get('wageMin') ?? 0),
      wageMax: Number(form.get('wageMax') ?? 0),
      wageUnit: 'hour',
      startDate: String(form.get('startDate') ?? ''),
      endDate: String(form.get('endDate') ?? '') || undefined,
      skills,
      positionsTotal: Number(form.get('positionsTotal') ?? 1),
    };
    try {
      const path = mode === 'create' ? '/api/v1/employer/jobs' : `/api/v1/employer/jobs/${initial?.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error?.message ?? 'Could not save.');
        setSubmitting(false);
        return;
      }
      const created = await res.json();
      const id = created?.data?.job?.id ?? initial?.id;
      if (action === 'publish' && id) {
        const pub = await fetch(`/api/v1/employer/jobs/${id}/publish`, { method: 'POST' });
        if (!pub.ok) {
          const data = await pub.json().catch(() => ({}));
          setError(data?.error?.message ?? 'Could not publish.');
          setSubmitting(false);
          return;
        }
      }
      router.push(`/${locale}/employer/jobs`);
    } catch {
      setError('Network error.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => onSubmit(e, 'draft')} className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/${locale}/employer/jobs`}
          className="text-base-content/60 hover:text-base-content inline-flex items-center gap-1 text-sm"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
          {t('back')}
        </Link>
      </div>

      {error && <div className="alert alert-error mb-4 text-sm">{error}</div>}

      <Section heading={t('section_title')}>
        <BilingualField
          label={t('english')}
          value={titleEn}
          onChange={setTitleEn}
          maxLength={120}
        />
        <BilingualField
          label={t('spanish')}
          value={titleEs}
          onChange={setTitleEs}
          maxLength={120}
          translateAction={titleEn ? () => translate('title', 'en', titleEn) : undefined}
          translateLabel={t('translate_from_en')}
          translating={translating === 'titleEs'}
        />
      </Section>

      <Section heading={t('section_description')}>
        <BilingualField
          label={t('english')}
          value={descEn}
          onChange={setDescEn}
          textarea
          minLength={20}
          maxLength={5000}
        />
        <BilingualField
          label={t('spanish')}
          value={descEs}
          onChange={setDescEs}
          textarea
          minLength={20}
          maxLength={5000}
          translateAction={descEn ? () => translate('description', 'en', descEn) : undefined}
          translateLabel={t('translate_from_en')}
          translating={translating === 'descEs'}
        />
      </Section>

      <Section heading={t('section_location')}>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">County</legend>
          <select name="county" required defaultValue={initial?.county ?? COUNTIES[0]} className="select w-full">
            {COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">City (optional)</legend>
          <input name="city" type="text" maxLength={60} className="input w-full" />
        </fieldset>
      </Section>

      <Section heading={t('section_pay_dates')}>
        <div className="grid grid-cols-2 gap-3">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">{t('wage_min')}</legend>
            <input
              name="wageMin"
              type="number"
              step="0.5"
              min="0"
              max="500"
              required
              defaultValue={initial?.wageMin}
              className="input w-full"
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">{t('wage_max')}</legend>
            <input
              name="wageMax"
              type="number"
              step="0.5"
              min="0"
              max="500"
              required
              defaultValue={initial?.wageMax}
              className="input w-full"
            />
          </fieldset>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">{t('start_date')}</legend>
            <input
              name="startDate"
              type="date"
              required
              defaultValue={initial?.startDate}
              className="input w-full"
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">{t('end_date')}</legend>
            <input
              name="endDate"
              type="date"
              defaultValue={initial?.endDate ?? ''}
              className="input w-full"
            />
          </fieldset>
        </div>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t('positions')}</legend>
          <input
            name="positionsTotal"
            type="number"
            min="1"
            max="500"
            required
            defaultValue={initial?.positionsTotal ?? 1}
            className="input w-full"
          />
        </fieldset>
      </Section>

      <Section heading={t('section_skills')}>
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span
              key={s}
              className="bg-base-200 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
            >
              {s}
              <button
                type="button"
                onClick={() => setSkills(skills.filter((x) => x !== s))}
                className="text-base-content/60 hover:text-error"
                aria-label={`Remove ${s}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={skillDraft}
            onChange={(e) => setSkillDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill();
              }
            }}
            placeholder={t('skills_placeholder')}
            className="input input-sm w-44"
          />
        </div>
      </Section>

      <div className="mt-8 flex justify-end gap-3">
        <button type="submit" disabled={submitting} className="btn btn-ghost border-base-300 border">
          {t('save_draft')}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={(e) => {
            const form = (e.currentTarget as HTMLButtonElement).form!;
            onSubmit(
              { preventDefault: () => {}, currentTarget: form } as unknown as FormEvent<HTMLFormElement>,
              'publish',
            );
          }}
          className="btn btn-primary"
        >
          {t('publish')}
        </button>
      </div>
    </form>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="border-base-300 mb-6 border-b pb-6 last:border-b-0">
      <h2 className="font-display mb-4 text-xl font-light">{heading}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function BilingualField({
  label,
  value,
  onChange,
  textarea = false,
  maxLength,
  minLength,
  translateAction,
  translateLabel,
  translating,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  maxLength?: number;
  minLength?: number;
  translateAction?: () => void;
  translateLabel?: string;
  translating?: boolean;
}) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend flex items-center gap-2">
        <span>{label}</span>
        {translateAction && (
          <button
            type="button"
            onClick={translateAction}
            disabled={translating}
            className="text-primary inline-flex items-center gap-1 text-xs font-medium disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faLanguage} className="h-3 w-3" />
            {translating ? '…' : translateLabel}
          </button>
        )}
      </legend>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          minLength={minLength}
          rows={4}
          className="textarea w-full"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          minLength={minLength}
          className="input w-full"
        />
      )}
    </fieldset>
  );
}
