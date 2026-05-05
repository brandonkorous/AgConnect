'use client';

import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';
import { RadioCard, CheckboxCard } from '@/components/employer/primitives';
import { SectionShell } from '../SectionShell';
import type { JobFormState, JobFormUpdate } from '../types';
import type { ErrorMap } from '../validation';

const STRUCTURES = ['hourly', 'hourly_piece', 'piece'] as const;
const FREQUENCIES = ['weekly', 'biweekly', 'daily'] as const;

type Props = {
  state: JobFormState;
  update: JobFormUpdate;
  errors?: ErrorMap;
};

export function PaySection({ state, update, errors = {} }: Props) {
  const t = useTranslations('employer.jobs.form_v2');
  const err = (path: string) => errors[path];

  const dailyHours = computeDailyHours(state.dailyStartTime, state.dailyEndTime);
  const dailyTakeMin = state.wageMin * dailyHours;
  const dailyTakeMax = state.wageMax * dailyHours + (state.pieceRate ?? 0) * 50;
  const showEstimate = dailyHours > 0 && state.wageMin > 0;

  return (
    <SectionShell num={3} id="s-pay" title={t('pay_title')} subtitle={t('pay_sub')}>
      <fieldset className="fieldset w-full min-w-0">
        <legend className="fieldset-legend text-base-content/80 text-sm font-semibold">
          {t('field_wage_structure')}
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {STRUCTURES.map((k) => (
            <RadioCard
              key={k}
              name="wageStructure"
              value={k}
              checked={state.wageStructure === k}
              onChange={(v) =>
                update({
                  wageStructure: v,
                  pieceRate: v === 'hourly' ? null : state.pieceRate,
                  pieceUnit: v === 'hourly' ? null : state.pieceUnit ?? 'lb',
                })
              }
              title={t(`wage_${k}`)}
              description={t(`wage_${k}_sub`)}
            />
          ))}
        </div>
      </fieldset>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <fieldset className="fieldset w-full min-w-0">
          <legend className="fieldset-legend text-base-content/80 flex w-full items-baseline justify-between text-sm font-semibold">
            <span>{t('field_base_rate')}</span>
            <span className="text-base-content/55 text-[11px] font-normal">{t('hint_ca_min')}</span>
          </legend>
          <div className="flex items-center gap-1.5">
            <label className={`input input-bordered flex flex-1 items-center gap-1.5${err('wageMin') ? ' input-error' : ''}`}>
              <span className="text-base-content/45 font-mono text-sm">$</span>
              <input
                type="number"
                min={0}
                max={500}
                step={0.5}
                required
                aria-label={t('field_base_rate_min')}
                value={state.wageMin || ''}
                onChange={(e) => {
                  const v = Number(e.target.value) || 0;
                  update({ wageMin: v, wageMax: Math.max(state.wageMax, v) });
                }}
                className="grow bg-transparent font-mono font-semibold outline-none"
              />
              <span className="text-base-content/55 text-xs">/hr</span>
            </label>
            <span className="text-base-content/45 px-1 text-sm" aria-hidden>
              –
            </span>
            <label className={`input input-bordered flex flex-1 items-center gap-1.5${err('wageMax') ? ' input-error' : ''}`}>
              <span className="text-base-content/45 font-mono text-sm">$</span>
              <input
                type="number"
                min={state.wageMin || 0}
                max={500}
                step={0.5}
                aria-label={t('field_base_rate_max')}
                value={state.wageMax || ''}
                onChange={(e) => {
                  const v = Number(e.target.value) || 0;
                  update({ wageMax: Math.max(v, state.wageMin) });
                }}
                className="grow bg-transparent font-mono font-semibold outline-none"
              />
              <span className="text-base-content/55 text-xs">/hr</span>
            </label>
          </div>
          {(err('wageMin') || err('wageMax')) && (
            <p className="label text-error">
              {t(`validation_reason_${(err('wageMin') ?? err('wageMax'))!.reason}`)}
            </p>
          )}
        </fieldset>

        {state.wageStructure !== 'hourly' && (
          <fieldset className="fieldset w-full min-w-0">
            <legend className="fieldset-legend text-base-content/80 text-sm font-semibold">
              {t('field_piece_rate')}
            </legend>
            <label className="input input-bordered flex items-center gap-1.5">
              <span className="text-base-content/45 font-mono text-sm">$</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={state.pieceRate ?? ''}
                onChange={(e) =>
                  update({ pieceRate: e.target.value === '' ? null : Number(e.target.value) })
                }
                className="grow bg-transparent font-mono font-semibold outline-none"
              />
              <select
                value={state.pieceUnit ?? 'lb'}
                onChange={(e) => update({ pieceUnit: e.target.value })}
                className="select select-ghost select-sm w-16 text-xs"
                aria-label={t('field_piece_unit')}
              >
                <option value="lb">/lb</option>
                <option value="box">/box</option>
                <option value="bin">/bin</option>
                <option value="tray">/tray</option>
              </select>
            </label>
          </fieldset>
        )}

        <fieldset className="fieldset w-full min-w-0">
          <legend className="fieldset-legend text-base-content/80 text-sm font-semibold">
            {t('field_pay_frequency')}
          </legend>
          <select
            value={state.payFrequency}
            onChange={(e) =>
              update({ payFrequency: e.target.value as JobFormState['payFrequency'] })
            }
            className="select select-bordered w-full"
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {t(`pay_freq_${f}`)}
              </option>
            ))}
          </select>
        </fieldset>
      </div>

      {showEstimate && (
        <div className="bg-neutral text-neutral-content mt-4 flex items-center gap-3.5 rounded-xl p-3.5">
          <FontAwesomeIcon icon={faMoneyBillWave} className="text-accent h-5 w-5" />
          <div className="flex-1">
            <div className="text-accent font-mono text-[10px] font-bold uppercase tracking-[0.08em]">
              {t('estimate_label')}
            </div>
            <div className="font-display mt-0.5 text-2xl tracking-tight">
              ${Math.round(dailyTakeMin)} – ${Math.round(dailyTakeMax)}{' '}
              <span className="text-neutral-content/70 ml-2 text-xs font-normal">
                {t('estimate_caption')}
              </span>
            </div>
          </div>
        </div>
      )}

      <fieldset className="fieldset mt-5 w-full min-w-0">
        <legend className="fieldset-legend text-base-content/80 text-sm font-semibold">
          {t('field_benefits')}
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <CheckboxCard
            variant="toggle"
            checked={state.transport}
            onChange={(v) => update({ transport: v })}
            title={t('benefit_transport')}
            description={state.pickupPoint || undefined}
          />
          <CheckboxCard
            variant="toggle"
            checked={state.housing}
            onChange={(v) => update({ housing: v })}
            title={t('benefit_housing')}
            description={t('benefit_housing_sub')}
          />
          <CheckboxCard
            variant="toggle"
            checked={state.mealsProvided}
            onChange={(v) => update({ mealsProvided: v })}
            title={t('benefit_meals')}
          />
          <CheckboxCard
            variant="toggle"
            checked={(state.endOfSeasonBonusCents ?? 0) > 0}
            onChange={(v) =>
              update({ endOfSeasonBonusCents: v ? state.endOfSeasonBonusCents ?? 40000 : null })
            }
            title={t('benefit_bonus')}
            description={t('benefit_bonus_sub')}
          />
        </div>
      </fieldset>
    </SectionShell>
  );
}

function computeDailyHours(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  const mins = (eh! * 60 + em!) - (sh! * 60 + sm!);
  return mins > 0 ? mins / 60 : 0;
}
