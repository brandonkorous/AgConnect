'use client';

import { useState } from 'react';
import { useConsent } from './consent-provider';

export type ConsentBannerCopy = {
  title: string;
  body: string;
  acceptAll: string;
  rejectNonEssential: string;
  customize: string;
  save: string;
  category: {
    essential: { label: string; description: string };
    functional: { label: string; description: string };
    analytics: { label: string; description: string };
    marketing: { label: string; description: string };
  };
  privacyLinkLabel: string;
  privacyLinkHref: string;
};

export function ConsentBanner({ copy }: { copy: ConsentBannerCopy }) {
  const { choices, hasDecided, setChoices, acceptAll, rejectNonEssential } = useConsent();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(choices);

  if (hasDecided && !open) return null;

  const onCustomize = () => {
    setPending(choices);
    setOpen(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-banner-title"
      className="bg-base-100 border-base-300 fixed inset-x-0 bottom-0 z-50 border-t shadow-lg"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 p-4 sm:p-6">
        <h2 id="consent-banner-title" className="text-base-content font-serif text-lg font-medium">
          {copy.title}
        </h2>
        <p className="text-base-content/80 text-sm">{copy.body}</p>
        <a
          href={copy.privacyLinkHref}
          className="text-primary text-sm underline-offset-2 hover:underline"
        >
          {copy.privacyLinkLabel}
        </a>

        {open && (
          <fieldset className="border-base-300 mt-2 grid gap-3 rounded-2xl border p-4">
            <CategoryRow
              label={copy.category.essential.label}
              description={copy.category.essential.description}
              checked
              disabled
            />
            <CategoryRow
              label={copy.category.functional.label}
              description={copy.category.functional.description}
              checked={pending.functional}
              onChange={(v) => setPending((p) => ({ ...p, functional: v }))}
            />
            <CategoryRow
              label={copy.category.analytics.label}
              description={copy.category.analytics.description}
              checked={pending.analytics}
              onChange={(v) => setPending((p) => ({ ...p, analytics: v }))}
            />
            <CategoryRow
              label={copy.category.marketing.label}
              description={copy.category.marketing.description}
              checked={pending.marketing}
              onChange={(v) => setPending((p) => ({ ...p, marketing: v }))}
            />
          </fieldset>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          {!open ? (
            <>
              <button type="button" className="btn btn-ghost btn-sm" onClick={onCustomize}>
                {copy.customize}
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => rejectNonEssential()}
              >
                {copy.rejectNonEssential}
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => acceptAll()}>
                {copy.acceptAll}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setOpen(false)}
              >
                {copy.customize}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setChoices(pending);
                  setOpen(false);
                }}
              >
                {copy.save}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        className="checkbox checkbox-primary mt-1"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span>
        <span className="text-base-content block text-sm font-medium">{label}</span>
        <span className="text-base-content/70 block text-xs">{description}</span>
      </span>
    </label>
  );
}
