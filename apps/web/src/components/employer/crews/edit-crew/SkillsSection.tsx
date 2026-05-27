'use client';

import { useTranslations } from 'next-intl';
import { CheckboxCard } from '@/components/employer/primitives';
import { SectionCard } from './SectionCard';
import { CREW_SKILLS, type CrewDraft } from './types';
import type { CrewSkill, CrewSkillCoverageView } from '@/lib/api/hooks/employer-ops';

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
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
        {CREW_SKILLS.map((s) => {
          const cov = coverageBySkill.get(s);
          const description =
            cov && cov.totalCount > 0
              ? t('coverage', { have: cov.haveCount, total: cov.totalCount })
              : t('coverage_empty');
          return (
            <CheckboxCard
              key={s}
              variant="check"
              checked={draft.requiredSkills.has(s)}
              onChange={() => toggle(s)}
              title={t(`name.${s}`)}
              description={description}
            />
          );
        })}
      </div>
    </SectionCard>
  );
}
