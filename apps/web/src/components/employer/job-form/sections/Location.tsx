'use client';

import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { AddressAutocomplete, type AddressLabels, type AddressValue } from '@agconn/ui';
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
  if (!state.siteAddress || state.siteLat == null || state.siteLng == null) return null;
  return {
    streetAddress: state.siteAddress,
    city: state.city || '',
    stateCode: 'CA',
    postalCode: state.zipCode || '',
    addressLat: state.siteLat,
    addressLng: state.siteLng,
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

      <MapPreview state={state} />

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

function MapPreview({ state }: { state: JobFormState }) {
  const t = useTranslations('employer.jobs.form_v2');
  const hasGeo = state.siteLat != null && state.siteLng != null;
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!hasGeo || !token) {
    return (
      <div
        role="img"
        aria-label={t('map_alt')}
        className="bg-base-200 border-base-300 text-base-content/55 mt-4 flex h-44 items-center justify-center rounded-xl border text-sm"
      >
        {t('map_placeholder')}
      </div>
    );
  }

  // Mapbox Static Image API — single PNG, no JS, no bundle weight.
  // Olive-brand pin (#5b6e2e) matches the pin-drop modal marker.
  const url =
    `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
    `pin-l+5b6e2e(${state.siteLng},${state.siteLat})/` +
    `${state.siteLng},${state.siteLat},13,0/1200x352@2x?access_token=${token}`;

  return (
    <div className="border-base-300 relative mt-4 h-44 overflow-hidden rounded-xl border">
      <img
        src={url}
        alt={t('map_alt')}
        className="h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute bottom-2.5 left-2.5 rounded-md bg-base-100/90 px-2 py-1 font-mono text-[10.5px] tabular-nums shadow-sm">
        <FontAwesomeIcon icon={faLocationDot} className="text-primary mr-1 h-3 w-3" />
        {state.siteLat?.toFixed(4)}, {state.siteLng?.toFixed(4)}
      </div>
    </div>
  );
}
