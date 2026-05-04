'use client';

import { useEffect, useState } from 'react';

export type MapStyle = 'streets' | 'satellite';

export type MapPreviewLabels = {
  // Style toggle
  styleStreets: string;
  styleSatellite: string;
  // Open in external maps button
  openInMaps: string;
  // Empty state copy (no coordinates yet)
  emptyTitle: string;
  emptyHelp: string;
  // Image alt text. Use {label} placeholder for the location label.
  alt: string;
  // Fullscreen toggle
  fullscreenOpen: string;
  fullscreenClose: string;
};

export type MapPreviewProps = {
  lat: number | null | undefined;
  lng: number | null | undefined;
  /** Optional location label used for alt text and Google Maps query string. */
  label?: string | null;
  /** Mapbox public token. Read from `process.env.NEXT_PUBLIC_MAPBOX_TOKEN` at the call site. */
  token: string | undefined;
  /** i18n labels — match the AddressAutocomplete `labels` pattern. */
  labels: MapPreviewLabels;
  /** Default map style. Satellite reads better for fields/orchards. */
  defaultStyle?: MapStyle;
  /** Tailwind height class. Defaults to `h-56`. */
  heightClass?: string;
  /** Initial zoom level. Defaults to 14. */
  zoom?: number;
  /** Hide the Open in Google Maps affordance. */
  hideOpenInMaps?: boolean;
};

/**
 * Mapbox static-tile preview with a Map/Satellite toggle and an
 * Open-in-Google-Maps deep link. Renders an empty-state card when no
 * coordinates are supplied (or no Mapbox token is available).
 *
 * Hairline border + rounded-2xl chrome to match the rest of the Tierra
 * surface system. No shadows; the map provides its own visual weight.
 */
export function MapPreview({
  lat,
  lng,
  label,
  token,
  labels,
  defaultStyle = 'satellite',
  heightClass = 'h-56',
  zoom = 14,
  hideOpenInMaps = false,
}: MapPreviewProps) {
  const [style, setStyle] = useState<MapStyle>(defaultStyle);
  const [fullscreen, setFullscreen] = useState(false);
  const hasCoords =
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [fullscreen]);

  if (!hasCoords || !token) {
    return (
      <div
        className={`border-base-300 bg-base-200/40 grid place-items-center overflow-hidden rounded-2xl border px-4 text-center ${heightClass}`}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="bg-base-100 text-base-content/40 grid h-10 w-10 place-items-center rounded-full">
            <PinIcon />
          </span>
          <div className="text-sm font-semibold">{labels.emptyTitle}</div>
          <div className="text-base-content/60 max-w-xs text-xs leading-relaxed">
            {labels.emptyHelp}
          </div>
        </div>
      </div>
    );
  }

  const altText = labels.alt.replace('{label}', label ?? '');
  const externalUrl =
    `https://www.google.com/maps/search/?api=1&query=${(lat as number).toFixed(6)},${(lng as number).toFixed(6)}`;

  return (
    <>
      <div
        className={`border-base-300 relative overflow-hidden rounded-2xl border ${heightClass}`}
      >
        <img
          src={mapboxStaticUrl({ lat: lat as number, lng: lng as number, style, zoom, token })}
          alt={altText}
          className="block h-full w-full object-cover"
        />
        <Overlays
          style={style}
          onStyleChange={setStyle}
          onFullscreenOpen={() => setFullscreen(true)}
          externalUrl={externalUrl}
          hideOpenInMaps={hideOpenInMaps}
          labels={labels}
        />
      </div>

      {fullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={altText}
          className="bg-base-content/80 fixed inset-0 z-50 flex flex-col p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFullscreen(false);
          }}
        >
          <div className="border-base-300 bg-base-100 relative flex-1 overflow-hidden rounded-2xl border">
            <img
              src={mapboxStaticUrl({
                lat: lat as number,
                lng: lng as number,
                style,
                zoom: zoom + 1,
                token,
                size: '1280x720',
              })}
              alt={altText}
              className="block h-full w-full object-cover"
            />
            <Overlays
              style={style}
              onStyleChange={setStyle}
              onFullscreenClose={() => setFullscreen(false)}
              externalUrl={externalUrl}
              hideOpenInMaps={hideOpenInMaps}
              labels={labels}
              isFullscreen
            />
          </div>
        </div>
      )}
    </>
  );
}

type OverlaysProps = {
  style: MapStyle;
  onStyleChange: (s: MapStyle) => void;
  onFullscreenOpen?: () => void;
  onFullscreenClose?: () => void;
  externalUrl: string;
  hideOpenInMaps: boolean;
  labels: MapPreviewLabels;
  isFullscreen?: boolean;
};

function Overlays({
  style,
  onStyleChange,
  onFullscreenOpen,
  onFullscreenClose,
  externalUrl,
  hideOpenInMaps,
  labels,
  isFullscreen = false,
}: OverlaysProps) {
  return (
    <>
      <div className="absolute right-2 top-2 flex items-center gap-1.5">
        <div className="bg-base-100/95 border-base-300 join rounded-full border p-0.5 shadow-sm">
          {(['streets', 'satellite'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onStyleChange(s)}
              aria-pressed={style === s}
              className={[
                'join-item cursor-pointer rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors',
                style === s
                  ? 'bg-base-content text-base-100'
                  : 'text-base-content/60 hover:text-base-content',
              ].join(' ')}
            >
              {s === 'streets' ? labels.styleStreets : labels.styleSatellite}
            </button>
          ))}
        </div>
        {isFullscreen ? (
          <button
            type="button"
            onClick={onFullscreenClose}
            aria-label={labels.fullscreenClose}
            className="bg-base-100/95 border-base-300 hover:bg-base-100 grid h-7 w-7 cursor-pointer place-items-center rounded-full border shadow-sm"
          >
            <CloseIcon />
          </button>
        ) : (
          <button
            type="button"
            onClick={onFullscreenOpen}
            aria-label={labels.fullscreenOpen}
            className="bg-base-100/95 border-base-300 hover:bg-base-100 grid h-7 w-7 cursor-pointer place-items-center rounded-full border shadow-sm"
          >
            <ExpandIcon />
          </button>
        )}
      </div>

      {!hideOpenInMaps && (
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-base-100/95 border-base-300 hover:bg-base-100 absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold shadow-sm"
        >
          <ExternalLinkIcon />
          {labels.openInMaps}
        </a>
      )}
    </>
  );
}

function mapboxStaticUrl(opts: {
  lat: number;
  lng: number;
  style: MapStyle;
  zoom: number;
  token: string;
  size?: string;
}): string {
  const styleId = opts.style === 'satellite' ? 'satellite-streets-v12' : 'streets-v12';
  const marker = `pin-l+5B6E2E(${opts.lng.toFixed(5)},${opts.lat.toFixed(5)})`;
  const center = `${opts.lng.toFixed(5)},${opts.lat.toFixed(5)},${opts.zoom},0`;
  const size = opts.size ?? '640x320';
  return (
    `https://api.mapbox.com/styles/v1/mapbox/${styleId}/static/` +
    `${marker}/${center}/${size}@2x?access_token=${opts.token}`
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M8 14s5-4.5 5-9a5 5 0 1 0-10 0c0 4.5 5 9 5 9z" strokeLinejoin="round" />
      <circle cx="8" cy="5" r="1.75" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 3h4v4M13 3l-7 7M11 9v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 6V3h3M10 3h3v3M13 10v3h-3M6 13H3v-3" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  );
}
