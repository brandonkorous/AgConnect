'use client';

import { useTranslations } from 'next-intl';
import {
  AddressAutocomplete,
  MapPreview,
  type AddressLabels,
  type AddressValue,
  type MapPreviewLabels,
} from '@agconn/ui';
import { useAddressPinDropFallback } from '@/components/ui/useAddressPinDropFallback';
import { SectionShell } from '../SectionShell';
import type { JobFormState, JobFormUpdate } from '../types';

const COUNTIES = ['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare'] as const;
const CV_PROXIMITY: [number, number] = [-119.78, 36.74];

type Props = {
  state: JobFormState;
  update: JobFormUpdate;
  locale: string;
};

function deriveAddress(state: JobFormState): AddressValue | null {
  if (!state.siteAddress) return null;
  // Lat/lng may be missing on legacy or pre-geocoded rows. Pass 0/0 so the
  // selected-summary view still renders the street address; the map preview
  // separately gates on real coordinates.
  return {
    streetAddress: state.siteAddress,
    city: state.city || '',
    stateCode: 'CA',
    postalCode: state.zipCode || '',
    addressLat: state.siteLat ?? 0,
    addressLng: state.siteLng ?? 0,
  };
}

export function LocationSection({ state, update, locale }: Props) {
  const t = useTranslations('employer.jobs.form_v2');
  const tShared = useTranslations('shell.address');
  const sitePinDrop = useAddressPinDropFallback(CV_PROXIMITY);
  const pickupPinDrop = useAddressPinDropFallback(CV_PROXIMITY);

  const labels: AddressLabels = {
    placeholder: tShared('placeholder'),
    searching: tShared('searching'),
    noMatches: tShared('noMatches'),
    suggestionsAria: tShared('suggestions.aria'),
    selectedAria: tShared('selected.aria'),
    pinFallback: tShared('dropPin.fallbackLink'),
    edit: tShared('edit'),
  };

  const siteAddress = deriveAddress(state);

  return (
    <SectionShell num={5} id="s-location" title={t('location_title')} subtitle={t('location_sub')}>
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <AddressAutocomplete
          label={t('field_site_address')}
          labels={labels}
          hint={t('hint_site_privacy')}
          proximity={CV_PROXIMITY}
          language={locale === 'es' ? 'es' : 'en'}
          value={siteAddress}
          onChange={(addr) => {
            if (!addr) {
              update({ siteAddress: '', siteLat: null, siteLng: null, zipCode: '' });
              return;
            }
            update({
              siteAddress: addr.streetAddress,
              city: addr.city,
              zipCode: addr.postalCode,
              siteLat: addr.addressLat,
              siteLng: addr.addressLng,
            });
          }}
          onPinDropRequested={sitePinDrop.request}
        />
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-base-content/80 text-sm font-semibold">
            {t('field_county')}
          </legend>
          <select
            value={state.county}
            onChange={(e) => update({ county: e.target.value })}
            className="select select-bordered w-full"
          >
            {COUNTIES.map((c) => (
              <option key={c} value={c}>
                {t(`county_${c.toLowerCase()}`)}
              </option>
            ))}
          </select>
        </fieldset>
      </div>

      <div className="mt-4">
        <MapPreview
          lat={state.siteLat}
          lng={state.siteLng}
          label={state.siteAddress}
          token={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          labels={mapLabels(t)}
          heightClass="h-44"
        />
      </div>

      <div className="mt-4">
        <AddressAutocomplete
          label={t('field_pickup')}
          labels={labels}
          types="address,poi"
          proximity={CV_PROXIMITY}
          language={locale === 'es' ? 'es' : 'en'}
          value={
            state.pickupPoint
              ? {
                  streetAddress: state.pickupPoint,
                  city: '',
                  stateCode: 'CA',
                  postalCode: '',
                  addressLat: 0,
                  addressLng: 0,
                }
              : null
          }
          onChange={(addr) => {
            if (!addr) {
              update({ pickupPoint: '' });
              return;
            }
            update({ pickupPoint: `${addr.streetAddress}, ${addr.city}` });
          }}
          onPinDropRequested={pickupPinDrop.request}
        />
      </div>
      {sitePinDrop.modal}
      {pickupPinDrop.modal}
    </SectionShell>
  );
}

function mapLabels(
  t: ReturnType<typeof useTranslations<'employer.jobs.form_v2'>>,
): MapPreviewLabels {
  return {
    styleStreets: t('map_style_streets'),
    styleSatellite: t('map_style_satellite'),
    openInMaps: t('map_open_in_maps'),
    emptyTitle: t('map_empty_title'),
    emptyHelp: t('map_empty_help'),
    alt: t('map_alt_template'),
    fullscreenOpen: t('map_fullscreen_open'),
    fullscreenClose: t('map_fullscreen_close'),
  };
}
