'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { SectionNav } from './SectionNav';
import { BasicsSection } from './BasicsSection';
import { ForemanSection } from './ForemanSection';
import { RosterSection } from './RosterSection';
import { SkillsSection } from './SkillsSection';
import { PaySection } from './PaySection';
import { CommsSection } from './CommsSection';
import { RightRail } from './RightRail';
import { CrewEditorHeader } from './CrewEditorHeader';
import { CrewEditorFooter } from './CrewEditorFooter';
import { useCrewEditor } from './useCrewEditor';
import { SECTION_IDS, type CrewEditorPageProps } from './types';

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
  const editor = useCrewEditor({ locale, mode, crew, hires });

  useEffect(() => {
    editor.setMemberCount(members.length);
    // Initialize once on mount; updates flow through onCountChanged.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    draft,
    updateDraft,
    busy,
    error,
    nameError,
    attemptedSave,
    archiveOpen,
    setArchiveOpen,
    memberCount,
    setMemberCount,
    lastSavedAt,
    isNameValid,
    isDirty,
    canSubmit,
    foremanName,
    save,
    duplicate,
    archive,
  } = editor;

  return (
    <div className="container mx-auto px-5 pb-16 pt-8 md:px-8 lg:px-20">
      <CrewEditorHeader
        locale={locale}
        mode={mode}
        crew={crew}
        draftName={draft.name}
        memberCount={memberCount}
        foremanName={foremanName}
        busy={busy}
        onDuplicate={duplicate}
        onArchiveClick={() => setArchiveOpen(!archiveOpen)}
      />

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[12rem_minmax(0,1fr)] xl:grid-cols-[12rem_minmax(0,1fr)_22rem]">
        <div className="hidden lg:block">
          <div className="sticky top-22">
            <SectionNav memberCount={memberCount} />
          </div>
        </div>

        <div className="min-w-0">
          <BasicsSection
            draft={draft}
            onChange={updateDraft}
            nameError={attemptedSave && !isNameValid ? (nameError ?? t('error_name_required')) : null}
          />
          <ForemanSection draft={draft} onChange={updateDraft} hires={hires} locale={locale} />
          <RosterSection
            crewId={crew?.id ?? null}
            initial={members}
            onCountChanged={setMemberCount}
          />
          <SkillsSection draft={draft} onChange={updateDraft} coverage={insights.skillCoverage} />
          <PaySection draft={draft} onChange={updateDraft} />
          <CommsSection draft={draft} onChange={updateDraft} />

          <CrewEditorFooter
            locale={locale}
            mode={mode}
            busy={busy}
            canSubmit={canSubmit}
            isNameValid={isNameValid}
            isDirty={isDirty}
            lastSavedAt={lastSavedAt}
            onSave={save}
          />
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
