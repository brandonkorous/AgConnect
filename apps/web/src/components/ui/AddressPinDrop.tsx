'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { AddressValue } from '@agconn/ui';

const REVERSE_HOST = 'https://api.mapbox.com/search/geocode/v6/reverse';

type ReverseFeature = {
  properties?: {
    context?: {
      address?: { name?: string };
      place?: { name?: string };
      region?: { region_code?: string };
      postcode?: { name?: string };
    };
  };
};

async function reverseGeocode(
  lng: number,
  lat: number,
  token: string,
): Promise<AddressValue | null> {
  const params = new URLSearchParams({
    longitude: lng.toString(),
    latitude: lat.toString(),
    access_token: token,
    types: 'address',
    country: 'us',
  });
  const res = await fetch(`${REVERSE_HOST}?${params.toString()}`);
  if (!res.ok) return null;
  const body = (await res.json()) as { features?: ReverseFeature[] };
  const ctx = body.features?.[0]?.properties?.context;
  if (!ctx) return null;
  const street = ctx.address?.name ?? '';
  const city = ctx.place?.name ?? '';
  const stateCode = ctx.region?.region_code ?? '';
  const postalCode = ctx.postcode?.name ?? '';
  if (!street || !city || !stateCode || !postalCode) return null;
  return {
    streetAddress: street,
    city,
    stateCode,
    postalCode,
    addressLat: lat,
    addressLng: lng,
  };
}

export type AddressPinDropProps = {
  open: boolean;
  initialCenter?: [number, number];
  onConfirm: (address: AddressValue) => void;
  onCancel: () => void;
};

export function AddressPinDrop({
  open,
  initialCenter = [-119.78, 36.74],
  onConfirm,
  onCancel,
}: AddressPinDropProps) {
  const t = useTranslations('shell.address.dropPin');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);
  const [coords, setCoords] = useState<[number, number]>(initialCenter);
  const [resolved, setResolved] = useState<AddressValue | null>(null);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !containerRef.current) return;
    let cancelled = false;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setError('NEXT_PUBLIC_MAPBOX_TOKEN missing');
      return;
    }

    void Promise.all([
      import('mapbox-gl'),
      import('mapbox-gl/dist/mapbox-gl.css'),
    ]).then(([mapboxModule]) => {
      if (cancelled || !containerRef.current) return;
      const mapboxgl = mapboxModule.default;
      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initialCenter,
        zoom: 11,
      });
      const marker = new mapboxgl.Marker({ draggable: true, color: '#5B6E2E' })
        .setLngLat(initialCenter)
        .addTo(map);
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        setCoords([lngLat.lng, lngLat.lat]);
      });
      map.on('click', (e) => {
        marker.setLngLat(e.lngLat);
        setCoords([e.lngLat.lng, e.lngLat.lat]);
      });
      mapRef.current = map;
      markerRef.current = marker;
    });

    return () => {
      cancelled = true;
      const map = mapRef.current as { remove?: () => void } | null;
      map?.remove?.();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [open, initialCenter]);

  useEffect(() => {
    if (!open) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;
    setResolving(true);
    setError(null);
    let cancelled = false;
    void reverseGeocode(coords[0], coords[1], token).then((addr) => {
      if (cancelled) return;
      setResolved(addr);
      setResolving(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, coords]);

  if (!open) return null;

  return (
    <dialog open className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="text-lg font-semibold">{t('title')}</h3>
        <p className="text-base-content/70 mt-1 text-sm">{t('dragHint')}</p>
        <div ref={containerRef} className="rounded-box mt-4 h-80 w-full overflow-hidden" />
        {error && (
          <p className="text-error mt-3 text-sm" role="alert">
            {error}
          </p>
        )}
        <div className="bg-base-200 rounded-box mt-3 p-3 text-sm tabular-nums">
          {resolving && <span className="text-base-content/60">…</span>}
          {!resolving && resolved && (
            <>
              <div className="font-medium">{resolved.streetAddress}</div>
              <div className="text-base-content/70">
                {resolved.city}, {resolved.stateCode} {resolved.postalCode}
              </div>
            </>
          )}
          {!resolving && !resolved && (
            <span className="text-base-content/60">
              {coords[1].toFixed(5)}, {coords[0].toFixed(5)}
            </span>
          )}
        </div>
        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {t('cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!resolved}
            onClick={() => resolved && onConfirm(resolved)}
          >
            {t('confirm')}
          </button>
        </div>
      </div>
      <button
        type="button"
        className="modal-backdrop"
        onClick={onCancel}
        aria-label={t('cancel')}
      />
    </dialog>
  );
}
