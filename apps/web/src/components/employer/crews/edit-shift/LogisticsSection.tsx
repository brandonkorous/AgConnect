'use client';

import { useTranslations } from 'next-intl';
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
      <div className="flex flex-col gap-2.5">
        <ToggleRow
          checked={Boolean(md.pickup?.enabled)}
          title={t('pickup.title')}
          help={md.pickup?.label || t('pickup.default_help')}
          editLabel={t('edit_button')}
          inputName="pickup"
          onToggle={(on) =>
            setMeta({
              pickup: {
                enabled: on,
                label: md.pickup?.label,
              },
            })
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
        <ToggleRow
          checked={Boolean(md.equipmentProvided)}
          title={t('equipment.title')}
          help={md.equipmentDetail || t('equipment.default_help')}
          editLabel={t('edit_button')}
          inputName="equipment"
          onToggle={(on) => setMeta({ equipmentProvided: on })}
          onEdit={() => {
            const next = window.prompt(t('equipment.edit_prompt'), md.equipmentDetail ?? '');
            if (next === null) return;
            setMeta({ equipmentDetail: next.trim() || undefined });
          }}
        />
        <ToggleRow
          checked={Boolean(md.lunchProvided)}
          title={t('lunch.title')}
          help={md.lunchDetail || t('lunch.default_help')}
          editLabel={t('edit_button')}
          inputName="lunch"
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

function ToggleRow({
  checked,
  title,
  help,
  editLabel,
  inputName,
  onToggle,
  onEdit,
}: {
  checked: boolean;
  title: string;
  help: string;
  editLabel: string;
  inputName: string;
  onToggle: (next: boolean) => void;
  onEdit: () => void;
}) {
  return (
    <label className="border-base-300 hover:border-base-content/30 flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition">
      <input
        type="checkbox"
        name={inputName}
        checked={checked}
        onChange={(e) => onToggle(e.target.checked)}
        className="checkbox checkbox-primary checkbox-sm"
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold leading-tight">{title}</div>
        <div className="text-base-content/60 mt-0.5 text-[11px]">{help}</div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onEdit();
        }}
        className="border-base-300 hover:bg-base-200 inline-flex shrink-0 items-center rounded-lg border bg-base-100 px-2.5 py-1 text-[11px] font-semibold"
      >
        {editLabel}
      </button>
    </label>
  );
}
