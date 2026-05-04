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
  faCopy,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';
import { SectionNav } from './SectionNav';
import { BasicsSection } from './BasicsSection';
import { ForemanSection } from './ForemanSection';
import { RosterSection } from './RosterSection';
import { SkillsSection } from './SkillsSection';
import { PaySection } from './PaySection';
import { CommsSection } from './CommsSection';
import { RightRail } from './RightRail';
import {
  SECTION_IDS,
  draftFromCrew,
  emptyDraft,
  type CrewDraft,
  type CrewEditorPageProps,
} from './types';

export function CrewEditorPage({
  locale,
  mode,
  crew,
  members,
  insights,
  hires,
}: CrewEditorPageProps) {
  const t = useTranslations('employer.crews.edit_crew');
  const tNav = useTranslations('employer.crews.edit_crew.section');
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [memberCount, setMemberCount] = useState(members.length);

  const [draft, setDraft] = useState<CrewDraft>(() => (crew ? draftFromCrew(crew) : emptyDraft()));

  const updateDraft = useCallback((patch: Partial<CrewDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  const foremanName = useMemo(() => {
    if (!draft.foremanUserId) return null;
    const h = hires.find((x) => x.workerUserId === draft.foremanUserId);
    if (!h) return crew?.foremanName ?? null;
    return `${h.firstName} ${h.lastInitial ? `${h.lastInitial}.` : ''}`.trim();
  }, [draft.foremanUserId, hires, crew?.foremanName]);

  function buildBody() {
    return {
      name: draft.name.trim(),
      shortCode: draft.shortCode.trim() || null,
      crewType: draft.crewType || null,
      primaryCrop: draft.primaryCrop || null,
      color: draft.color,
      requiredSkills: Array.from(draft.requiredSkills),
      baseWageCents: draft.baseWageCents,
      pieceRateCents: draft.pieceRateCents,
      pieceRateUnit: draft.pieceRateUnit.trim() || null,
      foremanPremiumCents: draft.foremanPremiumCents,
      commsChannels: draft.commsChannels,
      foremanUserId: draft.foremanUserId,
      notes: draft.notes.trim() || null,
    };
  }

  async function save() {
    if (!draft.name.trim() || draft.name.trim().length < 2) {
      setError(t('error_name_required'));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      if (mode === 'new') {
        const body = buildBody();
        const res = await client.post<{ crew: { id: string } }>(
          '/v1/employer/crews',
          // POST requires non-null fields; strip nulls.
          Object.fromEntries(
            Object.entries(body).filter(([, v]) => v !== null && v !== undefined),
          ),
          { handleErrorInline: true },
        );
        if (!isOk(res)) {
          setError(res.error.message || t('error_save'));
          return;
        }
        router.push(`/${locale}/employer/crews/${res.data.crew.id}/edit` as Route);
      } else if (crew) {
        const res = await client.patch(`/v1/employer/crews/${crew.id}`, buildBody(), {
          handleErrorInline: true,
        });
        if (!isOk(res)) {
          setError(res.error.message || t('error_save'));
          return;
        }
        router.push(`/${locale}/employer/crews`);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function duplicate() {
    if (!crew) return;
    setBusy(true);
    setError(null);
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const body = buildBody();
      const res = await client.post<{ crew: { id: string } }>(
        '/v1/employer/crews',
        {
          ...Object.fromEntries(
            Object.entries(body).filter(([, v]) => v !== null && v !== undefined),
          ),
          name: t('duplicate_name', { name: draft.name }),
          // Don't carry the foreman over — duplicates should pick a fresh one.
          foremanUserId: undefined,
        },
        { handleErrorInline: true },
      );
      if (!isOk(res)) {
        setError(res.error.message || t('error_duplicate'));
        return;
      }
      router.push(`/${locale}/employer/crews/${res.data.crew.id}/edit` as Route);
    } finally {
      setBusy(false);
    }
  }

  async function archive() {
    if (!crew) return;
    setBusy(true);
    setError(null);
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.del(`/v1/employer/crews/${crew.id}`, { handleErrorInline: true });
      if (!isOk(res)) {
        setError(res.error.message || t('error_archive'));
        return;
      }
      router.push(`/${locale}/employer/crews`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-5 pb-16 pt-8">
      {/* Breadcrumbs */}
      <nav
        aria-label={t('breadcrumbs_aria')}
        className="text-base-content/60 mb-3 flex flex-wrap items-center gap-1.5 text-xs"
      >
        <Link href={`/${locale}/employer/crews`} className="hover:text-base-content">
          {t('breadcrumb_crews')}
        </Link>
        <FontAwesomeIcon icon={faChevronRight} className="h-2 w-2 opacity-60" />
        <span className="text-base-content/80 font-semibold">
          {mode === 'new' ? t('breadcrumb_new') : draft.name || crew?.name || t('breadcrumb_edit')}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
            {t(mode === 'new' ? 'eyebrow_new' : 'eyebrow_edit', { count: memberCount })}
          </p>
          <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
            {mode === 'new' ? (
              <>
                {t('title_new_a')}{' '}
                <em className="text-primary not-italic font-light">{t('title_new_b')}</em>
              </>
            ) : (
              <>
                {draft.name.split('·')[0]?.trim() || t('breadcrumb_edit')}
                {draft.name.includes('·') && (
                  <>
                    {' · '}
                    <em className="text-primary not-italic font-light">
                      {draft.name.split('·').slice(1).join('·').trim()}
                    </em>
                  </>
                )}
              </>
            )}
          </h1>
          {mode === 'edit' && (
            <div className="text-base-content/70 mt-2 text-sm">
              {t('subtitle_edit', {
                foreman: foremanName ?? t('no_foreman'),
                count: memberCount,
              })}
            </div>
          )}
        </div>
        {mode === 'edit' && crew && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={duplicate}
              disabled={busy}
              className="btn btn-sm bg-base-100 border-base-300 rounded-full border font-medium"
            >
              <FontAwesomeIcon icon={faCopy} className="h-3 w-3" />
              {t('action_duplicate')}
            </button>
            <button
              type="button"
              onClick={() => setArchiveOpen((v) => !v)}
              disabled={busy}
              className="btn btn-sm border-error/40 text-error hover:bg-error/10 rounded-full border bg-base-100 font-medium"
            >
              <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
              {t('action_archive')}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-warning/10 border-warning/30 mb-4 rounded-xl border px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {archiveOpen && crew && (
        <div className="bg-base-200/60 border-base-300 mb-5 rounded-2xl border p-4">
          <p className="text-sm leading-relaxed">{t('archive_confirm', { name: crew.name })}</p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setArchiveOpen(false)}
              disabled={busy}
              className="btn btn-ghost btn-sm rounded-full"
            >
              {t('archive_keep')}
            </button>
            <button
              type="button"
              onClick={archive}
              disabled={busy}
              className="btn btn-sm btn-neutral rounded-full"
            >
              {busy ? '…' : t('archive_confirm_button')}
            </button>
          </div>
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
              {String(i + 1).padStart(2, '0')} ·{' '}
              {id === 'roster' ? tNav('item.roster_count', { count: memberCount }) : tNav(`item.${id}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)] xl:grid-cols-[12rem_minmax(0,1fr)_22rem]">
        <div className="hidden lg:block">
          <div className="sticky top-22">
            <SectionNav memberCount={memberCount} />
          </div>
        </div>

        <div className="min-w-0">
          <BasicsSection draft={draft} onChange={updateDraft} />
          <ForemanSection draft={draft} onChange={updateDraft} hires={hires} locale={locale} />
          <RosterSection
            crewId={crew?.id ?? null}
            initial={members}
            onCountChanged={setMemberCount}
          />
          <SkillsSection draft={draft} onChange={updateDraft} coverage={insights.skillCoverage} />
          <PaySection draft={draft} onChange={updateDraft} />
          <CommsSection draft={draft} onChange={updateDraft} />

          {/* Sticky save bar */}
          <div className="bg-base-100 border-base-300 shadow-pop sticky bottom-4 z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
            <div className="flex items-center gap-3">
              <span className="bg-primary/10 text-primary grid h-9 w-9 place-items-center rounded-full">
                <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold">
                  {mode === 'new' ? t('save_bar_new') : t('save_bar_edit')}
                </div>
                <div className="text-base-content/55 text-xs">
                  {mode === 'new' ? t('save_bar_help_new') : t('save_bar_help_edit')}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/${locale}/employer/crews`}
                className="btn btn-ghost btn-sm border-base-300 rounded-full border"
              >
                {t('footer_cancel')}
              </Link>
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="btn btn-primary btn-sm rounded-full"
              >
                <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                {busy ? '…' : mode === 'new' ? t('footer_create') : t('footer_save')}
              </button>
            </div>
          </div>
        </div>

        <div className="hidden xl:block">
          <div className="sticky top-22">
            <RightRail
              draft={draft}
              foremanName={foremanName}
              memberCount={memberCount}
              insights={insights}
              locale={locale}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
