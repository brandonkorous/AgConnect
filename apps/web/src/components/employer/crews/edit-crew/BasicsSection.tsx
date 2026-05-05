'use client';

import { useTranslations } from 'next-intl';
import { ColorSwatchPicker } from '@/components/employer/primitives';
import { SectionCard } from './SectionCard';
import {
  CREW_COLORS,
  CREW_CROPS,
  CREW_TYPES,
  type CrewDraft,
} from './types';
import type { CrewColor, CrewCrop, CrewType } from '@/lib/api/employer-ops';

type Props = {
  draft: CrewDraft;
  onChange: (patch: Partial<CrewDraft>) => void;
  nameError?: string | null;
};

export function BasicsSection({ draft, onChange, nameError }: Props) {
  const t = useTranslations('employer.crews.edit_crew.basics');

  const swatches = CREW_COLORS.map((c) => ({
    value: c.key,
    label: t(`schedule_color.${c.key}`),
    hex: c.hex,
  }));

  return (
    <SectionCard id="basics" title={t('title')} sub={t('sub')}>
      <div className="grid gap-3.5 md:grid-cols-2">
        <fieldset className="fieldset w-full min-w-0">
          <legend className="fieldset-legend">{t('name_label')}</legend>
          <input
            type="text"
            value={draft.name}
            maxLength={80}
            placeholder={t('name_placeholder')}
            onChange={(e) => onChange({ name: e.target.value })}
            aria-invalid={nameError ? true : undefined}
            className={['input w-full', nameError ? 'input-error' : ''].join(' ')}
          />
          {nameError ? (
            <p className="label text-error">{nameError}</p>
          ) : (
            <p className="label">{t('name_help')}</p>
          )}
        </fieldset>

        <fieldset className="fieldset w-full min-w-0">
          <legend className="fieldset-legend">{t('short_code_label')}</legend>
          <input
            type="text"
            value={draft.shortCode}
            maxLength={4}
            onChange={(e) => onChange({ shortCode: e.target.value.toUpperCase() })}
            className="input w-full font-mono font-bold"
          />
          <p className="label">{t('short_code_help')}</p>
        </fieldset>

        <fieldset className="fieldset w-full min-w-0">
          <legend className="fieldset-legend">{t('crew_type_label')}</legend>
          <select
            value={draft.crewType}
            onChange={(e) => onChange({ crewType: e.target.value as CrewType | '' })}
            className="select w-full"
          >
            <option value="">{t('crew_type_unset')}</option>
            {CREW_TYPES.map((k) => (
              <option key={k} value={k}>
                {t(`crew_type.${k}`)}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset className="fieldset w-full min-w-0">
          <legend className="fieldset-legend">{t('primary_crop_label')}</legend>
          <select
            value={draft.primaryCrop}
            onChange={(e) => onChange({ primaryCrop: e.target.value as CrewCrop | '' })}
            className="select w-full"
          >
            <option value="">{t('primary_crop_unset')}</option>
            {CREW_CROPS.map((k) => (
              <option key={k} value={k}>
                {t(`primary_crop.${k}`)}
              </option>
            ))}
          </select>
        </fieldset>
      </div>

      <fieldset className="fieldset mt-5 w-full min-w-0">
        <legend className="fieldset-legend">{t('schedule_color_label')}</legend>
        <ColorSwatchPicker
          swatches={swatches}
          value={draft.color}
          onChange={(v) => onChange({ color: v as CrewColor })}
          ariaLabel={t('schedule_color_label')}
        />
      </fieldset>

      <fieldset className="fieldset mt-5 w-full min-w-0">
        <legend className="fieldset-legend">{t('notes_label')}</legend>
        <textarea
          rows={2}
          maxLength={500}
          value={draft.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          className="textarea w-full"
        />
      </fieldset>
    </SectionCard>
  );
}
