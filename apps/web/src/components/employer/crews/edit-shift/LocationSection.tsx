'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  AddressAutocomplete,
  MapPreview,
  type AddressLabels,
  type AddressValue,
  type MapPreviewLabels,
} from '@agconn/ui';
import { useAddressPinDropFallback } from '@/components/ui/useAddressPinDropFallback';
import { SectionCard } from './SectionCard';
import type { ShiftDraft } from './types';

const CV_PROXIMITY: [number, number] = [-119.78, 36.74];

type Props = {
  draft: ShiftDraft;
  onChange: (patch: Partial<ShiftDraft>) => void;
  error?: string | null;
};

export function LocationSection({ draft, onChange, error }: Props) {
  const t = useTranslations('employer.crews.edit_shift.location_section');
  const tShared = useTranslations('shell.address');
  const locale = useLocale();
  const [changing, setChanging] = useState(false);
  const [value, setValue] = useState<AddressValue | null>(null);
  const pinDrop = useAddressPinDropFallback(CV_PROXIMITY);

  const mapLabels: MapPreviewLabels = {
    styleStreets: t('map_style.streets'),
    styleSatellite: t('map_style.satellite'),
    openInMaps: t('open_in_maps'),
    emptyTitle: t('map_empty_title'),
    emptyHelp: t('map_empty_help'),
    alt: t('map_alt', { label: '{label}' }),
    fullscreenOpen: t('map_fullscreen_open'),
    fullscreenClose: t('map_fullscreen_close'),
  };

  const labels: AddressLabels = {
    placeholder: tShared('placeholder'),
    searching: tShared('searching'),
    noMatches: tShared('noMatches'),
    suggestionsAria: tShared('suggestions.aria'),
    selectedAria: tShared('selected.aria'),
    pinFallback: tShared('dropPin.fallbackLink'),
    edit: tShared('edit'),
  };

  function applyAddress(addr: AddressValue | null) {
    setValue(addr);
    if (!addr) return;
    onChange({
      locationLabel: `${addr.streetAddress}, ${addr.city}`,
      locationLat: addr.addressLat,
      locationLng: addr.addressLng,
    });
  }

  return (
    <SectionCard id="loc" title={t('title')} sub={t('sub')}>
      <div className="grid gap-3.5 md:grid-cols-2">
        <fieldset className="fieldset w-full min-w-0">
          <legend className="text-base-content/60 mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider">
            {t('block_label')}
          </legend>
          <input
            type="text"
            value={draft.locationLabel}
            maxLength={120}
            onChange={(e) => onChange({ locationLabel: e.target.value })}
            aria-invalid={error ? true : undefined}
            className={['input w-full', error ? 'input-error' : ''].join(' ')}
          />
          {error && <p className="label text-error">{error}</p>}
        </fieldset>
        <fieldset className="fieldset">
          <legend className="text-base-content/60 mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider">
            {t('coords_label')}
          </legend>
          <input
            type="text"
            readOnly
            value={
              draft.locationLat != null && draft.locationLng != null
                ? `${draft.locationLat.toFixed(3)}°, ${draft.locationLng.toFixed(3)}°`
                : t('coords_empty')
            }
            className="input bg-base-200/60 w-full"
          />
        </fieldset>
      </div>

      <div className="mt-4">
        <MapPreview
          lat={draft.locationLat}
          lng={draft.locationLng}
          label={draft.locationLabel}
          token={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          labels={mapLabels}
        />
      </div>

      <div className="mt-3.5">
        {!changing ? (
          <button
            type="button"
            onClick={() => setChanging(true)}
            className="link link-hover text-primary text-xs font-semibold"
          >
            {t('change_address')}
          </button>
        ) : (
          <div className="bg-base-200/40 border-base-300 rounded-xl border p-3">
            <AddressAutocomplete
              label={t('new_address_label')}
              labels={labels}
              required
              types="address,poi"
              proximity={CV_PROXIMITY}
              language={locale === 'es' ? 'es' : 'en'}
              value={value}
              onChange={applyAddress}
              onPinDropRequested={pinDrop.request}
            />
            <button
              type="button"
              onClick={() => {
                setChanging(false);
                setValue(null);
              }}
              className="link link-hover text-base-content/60 mt-2 text-xs"
            >
              {t('keep_current')}
            </button>
            {pinDrop.modal}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
