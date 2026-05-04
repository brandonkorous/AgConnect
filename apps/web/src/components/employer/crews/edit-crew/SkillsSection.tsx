'use client';

import { useTranslations } from 'next-intl';
import { SectionCard } from './SectionCard';
import { CREW_SKILLS, type CrewDraft } from './types';
import type { CrewSkill, CrewSkillCoverageView } from '@/lib/api/employer-ops';

type Props = {
  draft: CrewDraft;
  onChange: (patch: Partial<CrewDraft>) => void;
  coverage: CrewSkillCoverageView[];
};

export function SkillsSection({ draft, onChange, coverage }: Props) {
  const t = useTranslations('employer.crews.edit_crew.skills');
  const coverageBySkill = new Map(coverage.map((c) => [c.skill, c]));

  function toggle(s: CrewSkill) {
    const next = new Set(draft.requiredSkills);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    onChange({ requiredSkills: next });
  }

  return (
    <SectionCard id="skills" title={t('title')} sub={t('sub')}>
      <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
        {CREW_SKILLS.map((s) => {
          const on = draft.requiredSkills.has(s);
          const cov = coverageBySkill.get(s);
          return (
            <label
              key={s}
              className={[
                'cursor-pointer rounded-2xl p-3.5 transition',
                on
                  ? 'border-primary bg-primary/10 border-2'
                  : 'border-base-300 hover:border-base-content/30 hover:bg-base-200/40 border bg-base-100',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(s)}
                  className="checkbox checkbox-primary checkbox-sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold leading-tight">{t(`name.${s}`)}</div>
                  <div className="text-base-content/60 mt-0.5 text-[11px]">
                    {cov && cov.totalCount > 0
                      ? t('coverage', { have: cov.haveCount, total: cov.totalCount })
                      : t('coverage_empty')}
                  </div>
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </SectionCard>
  );
}
