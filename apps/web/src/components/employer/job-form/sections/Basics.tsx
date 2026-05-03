'use client';

import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import type { CropLookupView, LookupView, JobPhotoView } from '@/lib/api/employer';
import { CropGlyph } from '@/components/ui/CropGlyph';
import { SectionShell } from '../SectionShell';
import { PhotoGrid } from '../PhotoGrid';
import type { JobFormState, JobFormUpdate } from '../types';

type Props = {
  state: JobFormState;
  update: JobFormUpdate;
  crops: CropLookupView[];
  roleTypes: LookupView[];
  jobId: string | null;
  locale: string;
  onPhotosChange: (photos: JobPhotoView[]) => void;
};

export function BasicsSection({
  state,
  update,
  crops,
  roleTypes,
  jobId,
  locale,
  onPhotosChange,
}: Props) {
  const t = useTranslations('employer.jobs.form_v2');
  const filled = state.positionsTotal > 0 ? Math.max(0, state.positionsTotal - 0) : 0;
  void filled;

  return (
    <SectionShell num={1} id="s-basics" title={t('basics_title')} subtitle={t('basics_sub')}>
      <div className="grid gap-4">
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-base-content/80 flex w-full items-baseline justify-between text-sm font-semibold">
            <span>{t('field_title')}</span>
            <span className="text-base-content/55 text-[11px] font-normal">{t('hint_title')}</span>
          </legend>
          <input
            type="text"
            required
            value={state.titleEn}
            onChange={(e) => update({ titleEn: e.target.value })}
            maxLength={120}
            className="input input-bordered w-full text-base font-medium"
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend text-base-content/80 text-sm font-semibold">
            {t('field_title_es')}
            <FontAwesomeIcon icon={faGlobe} className="text-base-content/40 ml-1.5 h-3 w-3" />
            <span className="text-base-content/55 ml-1.5 font-normal">{t('optional')}</span>
          </legend>
          <input
            type="text"
            value={state.titleEs}
            onChange={(e) => update({ titleEs: e.target.value })}
            maxLength={120}
            className="input input-bordered bg-base-200 w-full"
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend text-base-content/80 text-sm font-semibold">
            {t('field_crop')}
          </legend>
          <div className="flex flex-wrap gap-2">
            {crops.map((c) => {
              const on = state.cropId === c.id;
              const label = locale === 'es' ? c.labelEs : c.labelEn;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => update({ cropId: c.id })}
                  aria-pressed={on}
                  className={[
                    'flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors',
                    on
                      ? 'bg-base-200 border-base-content text-base-content'
                      : 'bg-base-100 border-base-300 text-base-content/70 hover:border-base-content/40',
                  ].join(' ')}
                >
                  <CropGlyph glyph={c.glyphKey} size={16} />
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-base-content/80 text-sm font-semibold">
              {t('field_role')}
            </legend>
            <select
              value={state.roleTypeId ?? ''}
              onChange={(e) => update({ roleTypeId: e.target.value || null })}
              className="select select-bordered w-full"
            >
              <option value="">{t('role_pick')}</option>
              {roleTypes.map((r) => (
                <option key={r.id} value={r.id}>
                  {locale === 'es' ? r.labelEs : r.labelEn}
                </option>
              ))}
            </select>
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-base-content/80 text-sm font-semibold">
              {t('field_crew_size')}
            </legend>
            <div className="join">
              <button
                type="button"
                onClick={() => update({ positionsTotal: Math.max(1, state.positionsTotal - 1) })}
                className="btn btn-square btn-sm join-item"
                aria-label={t('crew_decrease')}
              >
                <FontAwesomeIcon icon={faMinus} className="h-3 w-3" />
              </button>
              <input
                type="number"
                min={1}
                max={500}
                value={state.positionsTotal}
                onChange={(e) =>
                  update({ positionsTotal: Math.max(1, Number(e.target.value) || 1) })
                }
                className="input input-bordered input-sm join-item w-16 text-center font-mono font-bold"
              />
              <button
                type="button"
                onClick={() => update({ positionsTotal: Math.min(500, state.positionsTotal + 1) })}
                className="btn btn-square btn-sm join-item"
                aria-label={t('crew_increase')}
              >
                <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
              </button>
            </div>
          </fieldset>
        </div>

        <fieldset className="fieldset">
          <legend className="fieldset-legend text-base-content/80 flex w-full items-baseline justify-between text-sm font-semibold">
            <span>
              {t('field_desc_en')}
              <span className="text-base-content/55 ml-1.5 font-normal">{t('optional')}</span>
            </span>
            <span className="text-base-content/55 text-[11px] font-normal">{t('hint_desc')}</span>
          </legend>
          <textarea
            rows={4}
            value={state.descriptionEn}
            onChange={(e) => update({ descriptionEn: e.target.value })}
            minLength={20}
            maxLength={5000}
            className="textarea textarea-bordered w-full"
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend text-base-content/80 text-sm font-semibold">
            {t('field_desc_es')}
            <FontAwesomeIcon icon={faGlobe} className="text-base-content/40 ml-1.5 h-3 w-3" />
            <span className="text-base-content/55 ml-1.5 font-normal">{t('optional')}</span>
          </legend>
          <textarea
            rows={4}
            value={state.descriptionEs}
            onChange={(e) => update({ descriptionEs: e.target.value })}
            minLength={20}
            maxLength={5000}
            className="textarea textarea-bordered bg-base-200 w-full"
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend text-base-content/80 flex w-full items-baseline justify-between text-sm font-semibold">
            <span>
              {t('field_photos')}
              <span className="text-base-content/55 ml-1.5 font-normal">{t('optional')}</span>
            </span>
            <span className="text-base-content/55 text-[11px] font-normal">{t('hint_photos')}</span>
          </legend>
          <PhotoGrid
            jobId={jobId}
            locale={locale}
            photos={state.photos}
            onChange={onPhotosChange}
          />
        </fieldset>
      </div>
    </SectionShell>
  );
}
