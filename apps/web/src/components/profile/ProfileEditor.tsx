'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import {
  savePatchAction,
  addResumeItemAction,
  removeResumeItemAction,
  type ProfilePatchInput,
  type ResumeSection,
} from '@/lib/api/profile-actions';

type SectionItem = {
  primary: string;
  secondary?: string;
  meta?: string;
};

type AvailabilityFlags = {
  weekdays: boolean;
  weekends: boolean;
};

type ProfileSnapshot = {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  zipCode: string | null;
  county: string | null;
  skills: string[];
  experience: SectionItem[];
  education: SectionItem[];
  certifications: SectionItem[];
  availability: AvailabilityFlags;
  updatedAt: string;
};

type Props = {
  locale: string;
  initial: ProfileSnapshot;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'offline' | 'conflict';

const AUTOSAVE_MS = 600;

export function ProfileEditor({ locale, initial }: Props) {
  const t = useTranslations('worker.profile');
  const [snapshot, setSnapshot] = useState(initial);
  const [save, setSave] = useState<SaveState>('idle');
  const pendingPatch = useRef<ProfilePatchInput>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();

  function flush() {
    const fields = pendingPatch.current;
    if (Object.keys(fields).length === 0) return;
    pendingPatch.current = {};
    setSave('saving');
    startTransition(async () => {
      const res = await savePatchAction({
        ...fields,
        expectedUpdatedAt: snapshot.updatedAt,
      });
      if (res.ok) setSave('saved');
      else if (res.conflict) setSave('conflict');
      else setSave(res.code === 'offline' ? 'offline' : 'error');
    });
  }

  function patch<K extends keyof ProfileSnapshot>(field: K, value: ProfileSnapshot[K]) {
    setSnapshot((s) => ({ ...s, [field]: value }));
    if (field in EDITABLE_KEYS) {
      pendingPatch.current = {
        ...pendingPatch.current,
        [field]: value,
      } as ProfilePatchInput;
      setSave('saving');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, AUTOSAVE_MS);
    }
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <div className="grid gap-6">
      <div className="border-base-300 bg-base-100 grid gap-4 rounded-2xl border p-5">
        <h2 className="text-base-content/70 text-xs font-semibold uppercase tracking-wide">
          {t('section.contact')}
        </h2>
        <FieldRow label={t('contact.first_name')}>
          <input
            type="text"
            value={snapshot.firstName}
            onChange={(e) => patch('firstName', e.target.value)}
            className="input input-bordered w-full"
          />
        </FieldRow>
        <FieldRow label={t('contact.last_name')}>
          <input
            type="text"
            value={snapshot.lastName}
            onChange={(e) => patch('lastName', e.target.value)}
            className="input input-bordered w-full"
          />
        </FieldRow>
        <FieldRow label={t('field.email.label')}>
          <input
            type="email"
            value={snapshot.email ?? ''}
            onChange={(e) => patch('email', e.target.value)}
            className="input input-bordered w-full"
          />
        </FieldRow>
        {snapshot.phone && (
          <FieldRow label={t('field.phone.label')}>
            <input
              type="tel"
              value={snapshot.phone}
              readOnly
              className="input input-bordered w-full opacity-70"
            />
            <p className="label">{t('field.phone.hint')}</p>
          </FieldRow>
        )}
        <FieldRow label={t('field.zip.label')}>
          <input
            type="text"
            inputMode="numeric"
            maxLength={5}
            value={snapshot.zipCode ?? ''}
            onChange={(e) => patch('zipCode', e.target.value)}
            className="input input-bordered w-full"
          />
        </FieldRow>
      </div>

      <AvailabilitySection
        availability={snapshot.availability}
        onChange={(next) => patch('availability', next)}
      />

      <SkillsSection
        skills={snapshot.skills}
        onChange={(next) => patch('skills', next)}
        addLabel={t('skills.add')}
        title={t('section.skills')}
      />

      <ResumeSection2
        title={t('section.experience')}
        addLabel={t('add.experience')}
        emptyLabel={t('empty.experience')}
        items={snapshot.experience}
        section="experience"
        onLocalChange={(next) => setSnapshot((s) => ({ ...s, experience: next }))}
        setSave={setSave}
      />

      <ResumeSection2
        title={t('section.education')}
        addLabel={t('add.education')}
        emptyLabel={t('empty.education')}
        items={snapshot.education}
        section="education"
        onLocalChange={(next) => setSnapshot((s) => ({ ...s, education: next }))}
        setSave={setSave}
      />

      <ResumeSection2
        title={t('section.certifications')}
        addLabel={t('add.cert')}
        emptyLabel={t('empty.cert')}
        items={snapshot.certifications}
        section="certifications"
        onLocalChange={(next) => setSnapshot((s) => ({ ...s, certifications: next }))}
        setSave={setSave}
      />

      <div className="flex items-center justify-between">
        <Link href={`/${locale}/worker/profile/reupload`} className="btn btn-outline btn-sm">
          {t('reupload.cta')}
        </Link>
        {save !== 'idle' && <SaveStatus state={save} />}
      </div>
    </div>
  );
}

const EDITABLE_KEYS = {
  firstName: true,
  lastName: true,
  email: true,
  zipCode: true,
  county: true,
  skills: true,
  availability: true,
} as const;

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">{label}</legend>
      {children}
    </fieldset>
  );
}

function AvailabilitySection({
  availability,
  onChange,
}: {
  availability: AvailabilityFlags;
  onChange: (next: AvailabilityFlags) => void;
}) {
  const t = useTranslations('worker.profile.availability');
  return (
    <div
      id="availability"
      className="border-base-300 bg-base-100 grid gap-3 rounded-2xl border p-5 scroll-mt-24"
    >
      <h2 className="text-base-content/70 text-xs font-semibold uppercase tracking-wide">
        {t('title')}
      </h2>
      <p className="text-base-content/70 text-sm">{t('hint')}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={availability.weekdays}
          onClick={() => onChange({ ...availability, weekdays: !availability.weekdays })}
          className={[
            'rounded-full px-4 py-2 text-[13px] font-semibold transition-colors',
            availability.weekdays
              ? 'bg-primary text-primary-content'
              : 'border-base-300 border bg-transparent text-base-content/80',
          ].join(' ')}
        >
          {t('weekdays')}
        </button>
        <button
          type="button"
          aria-pressed={availability.weekends}
          onClick={() => onChange({ ...availability, weekends: !availability.weekends })}
          className={[
            'rounded-full px-4 py-2 text-[13px] font-semibold transition-colors',
            availability.weekends
              ? 'bg-primary text-primary-content'
              : 'border-base-300 border bg-transparent text-base-content/80',
          ].join(' ')}
        >
          {t('weekends')}
        </button>
      </div>
    </div>
  );
}

function SkillsSection({
  skills,
  onChange,
  addLabel,
  title,
}: {
  skills: string[];
  onChange: (next: string[]) => void;
  addLabel: string;
  title: string;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  function commit() {
    const v = draft.trim();
    if (!v || skills.includes(v)) {
      setAdding(false);
      setDraft('');
      return;
    }
    onChange([...skills, v]);
    setDraft('');
    setAdding(false);
  }
  return (
    <div className="border-base-300 bg-base-100 grid gap-3 rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base-content/70 text-xs font-semibold uppercase tracking-wide">
          {title}
        </h2>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-primary inline-flex items-center gap-1 text-sm font-medium"
        >
          <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
          <span>{addLabel}</span>
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <span
            key={s}
            className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm"
          >
            {s}
            <button
              type="button"
              aria-label="remove"
              onClick={() => onChange(skills.filter((x) => x !== s))}
              className="text-primary/70 hover:text-primary"
            >
              ✕
            </button>
          </span>
        ))}
        {adding && (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setDraft('');
                setAdding(false);
              }
            }}
            className="input input-sm input-bordered"
          />
        )}
      </div>
    </div>
  );
}

function ResumeSection2({
  title,
  addLabel,
  emptyLabel,
  items,
  section,
  onLocalChange,
  setSave,
}: {
  title: string;
  addLabel: string;
  emptyLabel: string;
  items: SectionItem[];
  section: ResumeSection;
  onLocalChange: (next: SectionItem[]) => void;
  setSave: (s: SaveState) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [, startTransition] = useTransition();

  function add(item: SectionItem) {
    const next = [...items, item];
    onLocalChange(next);
    setAdding(false);
    setSave('saving');
    startTransition(async () => {
      const res = await addResumeItemAction(section, item);
      setSave(res.ok ? 'saved' : 'error');
      if (!res.ok) onLocalChange(items);
    });
  }

  function remove(index: number) {
    const previous = items;
    const next = items.filter((_, i) => i !== index);
    onLocalChange(next);
    setSave('saving');
    startTransition(async () => {
      const res = await removeResumeItemAction(section, index);
      setSave(res.ok ? 'saved' : 'error');
      if (!res.ok) onLocalChange(previous);
    });
  }

  return (
    <div className="border-base-300 bg-base-100 grid gap-3 rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base-content/70 text-xs font-semibold uppercase tracking-wide">
          {title}
        </h2>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="text-primary inline-flex items-center gap-1 text-sm font-medium"
        >
          <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
          <span>{addLabel}</span>
        </button>
      </div>
      {adding && <InlineAddForm onSubmit={add} onCancel={() => setAdding(false)} />}
      {items.length === 0 ? (
        <p className="text-base-content/60 text-sm">{emptyLabel}</p>
      ) : (
        <ul className="grid gap-2">
          {items.map((item, i) => (
            <ItemRow key={i} item={item} onRemove={() => remove(i)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function InlineAddForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (item: SectionItem) => void;
  onCancel: () => void;
}) {
  const [primary, setPrimary] = useState('');
  const [secondary, setSecondary] = useState('');
  const [meta, setMeta] = useState('');
  return (
    <div className="border-base-300 grid gap-2 rounded-xl border p-3">
      <input
        autoFocus
        placeholder="Title"
        value={primary}
        onChange={(e) => setPrimary(e.target.value)}
        className="input input-sm input-bordered"
      />
      <input
        placeholder="Where / detail"
        value={secondary}
        onChange={(e) => setSecondary(e.target.value)}
        className="input input-sm input-bordered"
      />
      <input
        placeholder="When"
        value={meta}
        onChange={(e) => setMeta(e.target.value)}
        className="input input-sm input-bordered"
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn btn-ghost btn-xs">
          Cancel
        </button>
        <button
          type="button"
          disabled={!primary.trim()}
          onClick={() =>
            onSubmit({
              primary: primary.trim(),
              secondary: secondary.trim() || undefined,
              meta: meta.trim() || undefined,
            })
          }
          className="btn btn-primary btn-xs"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function ItemRow({ item, onRemove }: { item: SectionItem; onRemove?: () => void }) {
  return (
    <li className="border-base-300 flex items-start gap-3 rounded-xl border p-3">
      <div className="min-w-0 flex-1">
        <div className="font-medium">{item.primary}</div>
        {item.secondary && (
          <div className="text-base-content/70 text-sm">{item.secondary}</div>
        )}
        {item.meta && (
          <div className="text-base-content/60 text-xs">{item.meta}</div>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-base-content/50 hover:text-error"
        aria-label="remove"
      >
        <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
      </button>
    </li>
  );
}

function SaveStatus({ state }: { state: SaveState }) {
  const t = useTranslations('worker.profile.save');
  const map: Record<SaveState, { label: string; cls: string }> = {
    idle: { label: t('idle'), cls: 'text-base-content/50' },
    saving: { label: t('saving'), cls: 'text-base-content/70' },
    saved: { label: t('saved'), cls: 'text-success' },
    error: { label: t('error'), cls: 'text-error' },
    offline: { label: t('offline'), cls: 'text-warning' },
    conflict: { label: t('error'), cls: 'text-error' },
  };
  const { label, cls } = map[state];
  return (
    <span className={`text-xs font-medium ${cls}`} aria-live="polite">
      {label}
    </span>
  );
}
