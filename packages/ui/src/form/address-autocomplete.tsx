'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Controller,
  useFormContext,
  type FieldValues,
  type Path,
  type PathValue,
} from 'react-hook-form';

export type AddressValue = {
  streetAddress: string;
  city: string;
  stateCode: string;
  postalCode: string;
  addressLat: number;
  addressLng: number;
  mapboxId?: string;
};

export type AddressLabels = {
  placeholder: string;
  searching: string;
  noMatches: string;
  suggestionsAria: string;
  selectedAria: string;
  pinFallback?: string;
  edit: string;
};

type Suggestion = {
  mapbox_id: string;
  name: string;
  full_address?: string;
  place_formatted?: string;
  feature_type: string;
};

type CommonProps = {
  label: string;
  labels: AddressLabels;
  hint?: string;
  required?: boolean;
  types?: 'address' | 'address,poi';
  proximity?: [number, number];
  country?: string;
  language?: 'en' | 'es';
  onPinDropRequested?: () => Promise<AddressValue | null>;
};

export type AddressAutocompleteProps<TValues extends FieldValues> = CommonProps & {
  name: Path<TValues>;
};

export type AddressAutocompleteControlledProps = CommonProps & {
  value: AddressValue | null;
  onChange: (value: AddressValue | null) => void;
  onBlur?: () => void;
  errorMessage?: string | null;
};

const SEARCH_HOST = 'https://api.mapbox.com/search/searchbox/v1';
const DEBOUNCE_MS = 200;
const MIN_QUERY = 3;
const TOKEN_HINT = 'NEXT_PUBLIC_MAPBOX_TOKEN is not set. Add a public Mapbox token to your environment.';

function getToken(): string {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) throw new Error(TOKEN_HINT);
  return token;
}

function newSessionToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type ContextEntry = { name?: string; region_code?: string };

type RetrieveProps = {
  name?: string;
  address?: string;
  full_address?: string;
  feature_type?: string;
  context?: {
    address?: ContextEntry;
    place?: ContextEntry;
    region?: ContextEntry;
    postcode?: ContextEntry;
  };
  coordinates?: { longitude: number; latitude: number };
};

function suggestionToAddress(props: RetrieveProps, mapboxId: string): AddressValue | null {
  const ctx = props.context ?? {};
  const coords = props.coordinates;
  if (!coords) return null;
  // For address features, props.address is "1234 W Shaw Ave". For POI features
  // it's usually missing, so fall back to the POI name + the contextual street.
  const street = props.address ?? ctx.address?.name ?? props.name ?? '';
  const city = ctx.place?.name ?? '';
  const stateCode = ctx.region?.region_code ?? '';
  const postalCode = ctx.postcode?.name ?? '';
  if (!street || !city || !stateCode || !postalCode) return null;
  return {
    streetAddress: street,
    city,
    stateCode,
    postalCode,
    addressLat: coords.latitude,
    addressLng: coords.longitude,
    mapboxId,
  };
}

export function AddressAutocompleteField<TValues extends FieldValues>({
  name,
  ...rest
}: AddressAutocompleteProps<TValues>) {
  const { control, formState } = useFormContext<TValues>();
  const fieldId = useId();
  const listboxId = `${fieldId}-listbox`;
  const errorMessage =
    (formState.errors[name as string] as { message?: string } | undefined)?.message ?? null;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <AddressAutocompleteInner
          {...rest}
          value={(field.value as AddressValue | null | undefined) ?? null}
          onChange={(next) => field.onChange(next as PathValue<TValues, Path<TValues>>)}
          onBlur={field.onBlur}
          errorMessage={errorMessage}
          inputId={fieldId}
          listboxId={listboxId}
        />
      )}
    />
  );
}

export function AddressAutocomplete({
  value,
  onChange,
  onBlur,
  errorMessage = null,
  ...rest
}: AddressAutocompleteControlledProps) {
  const fieldId = useId();
  return (
    <AddressAutocompleteInner
      {...rest}
      value={value}
      onChange={onChange}
      onBlur={onBlur ?? (() => undefined)}
      errorMessage={errorMessage}
      inputId={fieldId}
      listboxId={`${fieldId}-listbox`}
    />
  );
}

type InnerProps = CommonProps & {
  value: AddressValue | null;
  onChange: (value: AddressValue | null) => void;
  onBlur: () => void;
  errorMessage: string | null;
  inputId: string;
  listboxId: string;
};

function AddressAutocompleteInner({
  label,
  labels,
  hint,
  types,
  proximity,
  country,
  language,
  value,
  onChange,
  onBlur,
  errorMessage,
  inputId,
  listboxId,
  onPinDropRequested,
}: InnerProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const sessionTokenRef = useRef<string>(newSessionToken());
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedSummary = useMemo(() => {
    if (!value) return null;
    return `${value.streetAddress}, ${value.city}, ${value.stateCode} ${value.postalCode}`;
  }, [value]);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  useEffect(() => () => {
    abortRef.current?.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const runSearch = useCallback(
    (q: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      const params = new URLSearchParams({
        q,
        access_token: getToken(),
        session_token: sessionTokenRef.current,
        country: country ?? 'us',
        language: language ?? 'en',
        types: types ?? 'address',
        limit: '6',
      });
      if (proximity) params.set('proximity', `${proximity[0]},${proximity[1]}`);
      fetch(`${SEARCH_HOST}/suggest?${params.toString()}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`mapbox_${r.status}`))))
        .then((body: { suggestions?: Suggestion[] }) => {
          setSuggestions(body.suggestions ?? []);
          setOpen(true);
          setActiveIndex((body.suggestions ?? []).length > 0 ? 0 : -1);
        })
        .catch((e) => {
          if ((e as Error).name !== 'AbortError') setSuggestions([]);
        })
        .finally(() => setLoading(false));
    },
    [country, language, proximity, types],
  );

  const onQueryChange = useCallback(
    (q: string) => {
      setQuery(q);
      if (value) onChange(null);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (q.trim().length < MIN_QUERY) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      debounceRef.current = setTimeout(() => runSearch(q.trim()), DEBOUNCE_MS);
    },
    [onChange, runSearch, value],
  );

  const select = useCallback(
    async (s: Suggestion) => {
      const params = new URLSearchParams({
        access_token: getToken(),
        session_token: sessionTokenRef.current,
        language: language ?? 'en',
      });
      try {
        const res = await fetch(`${SEARCH_HOST}/retrieve/${s.mapbox_id}?${params.toString()}`);
        if (!res.ok) throw new Error(`mapbox_${res.status}`);
        const body = (await res.json()) as { features?: Array<{ properties?: RetrieveProps }> };
        const props = body.features?.[0]?.properties;
        if (!props) return;
        const addr = suggestionToAddress(props, s.mapbox_id);
        if (!addr) return;
        onChange(addr);
        setQuery('');
        close();
        sessionTokenRef.current = newSessionToken();
      } catch {
        // swallow — UI will show no-match copy if value stays null
      }
    },
    [close, language, onChange],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const s = suggestions[activeIndex];
      if (s) void select(s);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  const requestPinDrop = async () => {
    if (!onPinDropRequested) return;
    const result = await onPinDropRequested();
    if (result) {
      onChange(result);
      setQuery('');
      close();
    }
  };

  if (value) {
    return (
      <fieldset className="fieldset">
        <legend className="fieldset-legend">
          {label}
        </legend>
        <div
          className="border-base-300 bg-base-100 rounded-box flex items-start justify-between gap-3 border p-3"
          aria-label={`${labels.selectedAria}: ${selectedSummary ?? ''}`}
        >
          <div className="text-sm tabular-nums">
            <div className="font-medium">{value.streetAddress}</div>
            <div className="text-base-content/70">
              {value.city}, {value.stateCode} {value.postalCode}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              onChange(null);
              setQuery('');
            }}
          >
            {labels.edit}
          </button>
        </div>
        {hint && <p className="label text-xs">{hint}</p>}
      </fieldset>
    );
  }

  const showNoMatches = open && !loading && suggestions.length === 0 && query.trim().length >= MIN_QUERY;

  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend" id={`${inputId}-label`}>
        {label}
      </legend>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
          }
          aria-invalid={errorMessage ? true : undefined}
          placeholder={labels.placeholder}
          className={`input w-full ${errorMessage ? 'input-error' : ''}`}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            // delay so click on a suggestion registers first
            setTimeout(() => {
              close();
              onBlur();
            }, 120);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
        />
        {open && (suggestions.length > 0 || showNoMatches) && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label={labels.suggestionsAria}
            className="bg-base-100 border-base-300 rounded-box absolute z-20 mt-1 w-full overflow-hidden border shadow-md"
          >
            {suggestions.map((s, i) => (
              <li
                key={s.mapbox_id}
                id={`${listboxId}-opt-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                className={`cursor-pointer px-4 py-2 text-sm tabular-nums ${
                  i === activeIndex ? 'bg-base-200' : ''
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  void select(s);
                }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <div className="font-medium">{s.name}</div>
                {s.place_formatted && (
                  <div className="text-base-content/60 text-xs">{s.place_formatted}</div>
                )}
              </li>
            ))}
            {showNoMatches && (
              <li className="px-4 py-2 text-sm">
                <div>{labels.noMatches}</div>
                {onPinDropRequested && labels.pinFallback && (
                  <button
                    type="button"
                    className="link link-primary text-xs"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      void requestPinDrop();
                    }}
                  >
                    {labels.pinFallback}
                  </button>
                )}
              </li>
            )}
          </ul>
        )}
        {loading && (
          <div className="text-base-content/60 absolute right-3 top-1/2 -translate-y-1/2 text-xs">
            {labels.searching}
          </div>
        )}
      </div>
      {hint && !errorMessage && (
        <p className="label text-xs">{hint}</p>
      )}
      {errorMessage && (
        <p role="alert" className="label text-error text-xs">
          {errorMessage}
        </p>
      )}
      {onPinDropRequested && labels.pinFallback && !showNoMatches && (
        <button
          type="button"
          className="link link-primary mt-1 self-start text-xs"
          onClick={() => void requestPinDrop()}
        >
          {labels.pinFallback}
        </button>
      )}
    </fieldset>
  );
}
