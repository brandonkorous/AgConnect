'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { isOk } from '@agconn/api-client';
import { AddressAutocomplete, type AddressLabels, type AddressValue } from '@agconn/ui';
import { useAddressPinDropFallback } from '@/components/ui/useAddressPinDropFallback';
import { getApiClient } from '@/lib/api/client';

const CV_PROXIMITY: [number, number] = [-119.78, 36.74];

type CrewOption = { id: string; name: string };

type Props = {
  locale: string;
  crews: CrewOption[];
};

export function NewShiftForm({ locale, crews }: Props) {
  const t = useTranslations('employer.crews.new_shift_form');
  const tShared = useTranslations('shell.address');
  const _locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<AddressValue | null>(null);
  const pinDrop = useAddressPinDropFallback(CV_PROXIMITY);

  const labels: AddressLabels = {
    placeholder: tShared('placeholder'),
    searching: tShared('searching'),
    noMatches: tShared('noMatches'),
    suggestionsAria: tShared('suggestions.aria'),
    selectedAria: tShared('selected.aria'),
    pinFallback: tShared('dropPin.fallbackLink'),
    edit: tShared('edit'),
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!address) {
      setError(t('error'));
      return;
    }
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const crewId = String(f.get('crewId') ?? '').trim();
    const locationLabel = `${address.streetAddress}, ${address.city}`;
    const body = {
      crewId: crewId || undefined,
      shiftDate: String(f.get('shiftDate') ?? ''),
      startTime: String(f.get('startTime') ?? ''),
      endTime: String(f.get('endTime') ?? '').trim() || undefined,
      locationLabel,
      locationLat: address.addressLat,
      locationLng: address.addressLng,
      notes: String(f.get('notes') ?? '').trim() || undefined,
    };
    try {
      const client = getApiClient(_locale === 'es' ? 'es' : 'en');
      const res = await client.post('/v1/employer/shifts', body, { handleErrorInline: true });
      if (!isOk(res)) {
        setError(res.error.message || t('error'));
        setBusy(false);
        return;
      }
      router.push(`/${locale}/employer/crews`);
    } catch {
      setError(t('error'));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="mb-6">
        <Link
          href={`/${locale}/employer/crews`}
          className="text-base-content/60 hover:text-base-content inline-flex items-center gap-1 text-sm"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
          {t('back')}
        </Link>
      </div>

      <h1 className="font-display mb-2 text-3xl font-light tracking-tight">{t('title')}</h1>
      <p className="text-base-content/70 mb-6 text-sm">{t('subtitle')}</p>

      {error && <div className="alert alert-error mb-4 text-sm">{error}</div>}

      <div className="bg-base-100 border-base-300 flex flex-col gap-3 rounded-2xl border p-6">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t('crew_label')}</legend>
          <select name="crewId" className="select w-full">
            <option value="">{t('crew_none')}</option>
            {crews.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="label">{t('crew_help')}</p>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t('date_label')}</legend>
          <input
            name="shiftDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="input w-full"
          />
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">{t('start_time_label')}</legend>
            <input
              name="startTime"
              type="time"
              required
              defaultValue="06:00"
              className="input w-full"
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">{t('end_time_label')}</legend>
            <input name="endTime" type="time" defaultValue="14:00" className="input w-full" />
          </fieldset>
        </div>

        <AddressAutocomplete
          label={t('location_label')}
          labels={labels}
          required
          types="address,poi"
          proximity={CV_PROXIMITY}
          language={_locale === 'es' ? 'es' : 'en'}
          value={address}
          onChange={setAddress}
          onPinDropRequested={pinDrop.request}
        />

        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t('notes_label')}</legend>
          <textarea name="notes" rows={3} maxLength={500} className="textarea w-full" />
        </fieldset>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Link
          href={`/${locale}/employer/crews`}
          className="btn btn-ghost border-base-300 border"
        >
          {t('cancel')}
        </Link>
        <button type="submit" disabled={busy} className="btn btn-primary">
          {busy ? '…' : t('confirm')}
        </button>
      </div>
      {pinDrop.modal}
    </form>
  );
}
