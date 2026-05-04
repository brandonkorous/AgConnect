'use client';

import { useTranslations } from 'next-intl';
import { SectionCard } from './SectionCard';
import type { CrewDraft } from './types';

type Props = {
  draft: CrewDraft;
  onChange: (patch: Partial<CrewDraft>) => void;
};

export function PaySection({ draft, onChange }: Props) {
  const t = useTranslations('employer.crews.edit_crew.pay');

  return (
    <SectionCard id="pay" title={t('title')} sub={t('sub')}>
      <div className="grid gap-3.5 md:grid-cols-3">
        <MoneyField
          label={t('base_wage_label')}
          value={draft.baseWageCents}
          onChange={(v) => onChange({ baseWageCents: v })}
          suffix={t('per_hour')}
        />

        <fieldset className="fieldset">
          <legend className="text-base-content/60 mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider">
            {t('piece_rate_label')}
          </legend>
          <div className="join w-full">
            <label className="join-item border-base-300 bg-base-200 text-base-content/60 grid place-items-center border px-3 text-xs">
              $
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={draft.pieceRateCents != null ? (draft.pieceRateCents / 100).toFixed(2) : ''}
              onChange={(e) =>
                onChange({
                  pieceRateCents: e.target.value === '' ? null : Math.round(Number(e.target.value) * 100),
                })
              }
              className="input join-item w-full font-mono"
            />
            <input
              type="text"
              value={draft.pieceRateUnit}
              maxLength={8}
              placeholder="lb"
              onChange={(e) => onChange({ pieceRateUnit: e.target.value })}
              className="input join-item border-base-300 w-16 border font-mono text-xs"
              aria-label={t('piece_rate_unit_label')}
            />
          </div>
        </fieldset>

        <MoneyField
          label={t('foreman_premium_label')}
          value={draft.foremanPremiumCents}
          onChange={(v) => onChange({ foremanPremiumCents: v })}
          prefix="+$"
          suffix={t('per_hour')}
        />
      </div>
    </SectionCard>
  );
}

function MoneyField({
  label,
  value,
  onChange,
  prefix = '$',
  suffix,
}: {
  label: string;
  value: number | null;
  onChange: (cents: number | null) => void;
  prefix?: string;
  suffix?: string;
}) {
  const display = value != null ? (value / 100).toFixed(2) : '';
  return (
    <fieldset className="fieldset">
      <legend className="text-base-content/60 mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider">
        {label}
      </legend>
      <div className="join w-full">
        <label className="join-item border-base-300 bg-base-200 text-base-content/60 grid place-items-center border px-3 text-xs">
          {prefix}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={display}
          onChange={(e) => onChange(e.target.value === '' ? null : Math.round(Number(e.target.value) * 100))}
          className="input join-item w-full font-mono"
        />
        {suffix && (
          <span className="join-item border-base-300 text-base-content/60 grid place-items-center border px-3 text-[11px]">
            {suffix}
          </span>
        )}
      </div>
    </fieldset>
  );
}
