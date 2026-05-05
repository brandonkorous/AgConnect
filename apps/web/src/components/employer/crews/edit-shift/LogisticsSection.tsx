'use client';

import { useTranslations } from 'next-intl';
import {
  faVanShuttle,
  faToolbox,
  faUtensils,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { CheckboxCard } from '@/components/employer/primitives';
import { SectionCard } from './SectionCard';
import type { ShiftDraft } from './types';

type Props = {
  draft: ShiftDraft;
  onChange: (patch: Partial<ShiftDraft>) => void;
};

export function LogisticsSection({ draft, onChange }: Props) {
  const t = useTranslations('employer.crews.edit_shift.logistics');
  const md = draft.metadata;

  function setMeta(patch: Partial<typeof md>) {
    onChange({ metadata: { ...md, ...patch } });
  }

  return (
    <SectionCard id="logistics" title={t('title')} sub={t('sub')}>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
        <ToggleWithEdit
          icon={faVanShuttle}
          checked={Boolean(md.pickup?.enabled)}
          title={t('pickup.title')}
          description={md.pickup?.label || t('pickup.default_help')}
          editLabel={t('edit_button')}
          onToggle={(on) =>
            setMeta({ pickup: { enabled: on, label: md.pickup?.label } })
          }
          onEdit={() => {
            const next = window.prompt(t('pickup.edit_prompt'), md.pickup?.label ?? '');
            if (next === null) return;
            setMeta({
              pickup: {
                enabled: Boolean(md.pickup?.enabled),
                label: next.trim() || undefined,
              },
            });
          }}
        />
        <ToggleWithEdit
          icon={faToolbox}
          checked={Boolean(md.equipmentProvided)}
          title={t('equipment.title')}
          description={md.equipmentDetail || t('equipment.default_help')}
          editLabel={t('edit_button')}
          onToggle={(on) => setMeta({ equipmentProvided: on })}
          onEdit={() => {
            const next = window.prompt(t('equipment.edit_prompt'), md.equipmentDetail ?? '');
            if (next === null) return;
            setMeta({ equipmentDetail: next.trim() || undefined });
          }}
        />
        <ToggleWithEdit
          icon={faUtensils}
          checked={Boolean(md.lunchProvided)}
          title={t('lunch.title')}
          description={md.lunchDetail || t('lunch.default_help')}
          editLabel={t('edit_button')}
          onToggle={(on) => setMeta({ lunchProvided: on })}
          onEdit={() => {
            const next = window.prompt(t('lunch.edit_prompt'), md.lunchDetail ?? '');
            if (next === null) return;
            setMeta({ lunchDetail: next.trim() || undefined });
          }}
        />
      </div>
    </SectionCard>
  );
}

function ToggleWithEdit({
  icon,
  checked,
  title,
  description,
  editLabel,
  onToggle,
  onEdit,
}: {
  icon: IconDefinition;
  checked: boolean;
  title: string;
  description: string;
  editLabel: string;
  onToggle: (next: boolean) => void;
  onEdit: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <CheckboxCard
        variant="toggle"
        icon={icon}
        checked={checked}
        onChange={onToggle}
        title={title}
        description={description}
      />
      <button
        type="button"
        onClick={onEdit}
        className="link link-hover text-base-content/60 self-end text-[11px] font-semibold"
      >
        {editLabel}
      </button>
    </div>
  );
}
