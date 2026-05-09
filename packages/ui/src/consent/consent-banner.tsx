'use client';

import { useState } from 'react';
import { useConsent } from './consent-provider';

export type ConsentBannerCopy = {
  title: string;
  body: string;
  acceptAll: string;
  rejectNonEssential: string;
  customize: string;
  back: string;
  save: string;
  category: {
    essential: { label: string; description: string };
    functional: { label: string; description: string };
    analytics: { label: string; description: string };
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
      className="bg-base-100 border-base-content/10 fixed inset-x-0 bottom-0 z-[60] border-t print:hidden"
    >
      <div className="container mx-auto px-5 py-5 md:px-8 sm:py-6 lg:px-20">
        {!open ? (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-10">
            <div className="flex-1">
              <p className="label text-base-content/60 mb-2">{copy.privacyLinkLabel}</p>
              <h2
                id="consent-banner-title"
                className="text-base-content font-serif text-xl leading-snug font-medium"
              >
                {copy.title}
              </h2>
              <p className="text-base-content/75 mt-2 max-w-2xl text-sm leading-relaxed">
                {copy.body}{' '}
                <a
                  href={copy.privacyLinkHref}
                  className="text-primary underline-offset-2 hover:underline"
                >
                  {copy.privacyLinkLabel}
                </a>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:flex-nowrap lg:justify-end">
              <button type="button" className="btn btn-ghost btn-sm" onClick={onCustomize}>
                {copy.customize}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => rejectNonEssential()}
              >
                {copy.rejectNonEssential}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => acceptAll()}
              >
                {copy.acceptAll}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              <p className="label text-base-content/60 mb-2">{copy.privacyLinkLabel}</p>
              <h2
                id="consent-banner-title"
                className="text-base-content font-serif text-xl leading-snug font-medium"
              >
                {copy.title}
              </h2>
            </div>
            <div className="border-base-content/10 grid gap-4 border-t border-b py-5 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-4">
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
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <a
                href={copy.privacyLinkHref}
                className="text-primary text-sm underline-offset-2 hover:underline"
              >
                {copy.privacyLinkLabel}
              </a>
              <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:justify-end">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setOpen(false)}
                >
                  {copy.back}
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
              </div>
            </div>
          </div>
        )}
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
        className="checkbox checkbox-primary checkbox-sm mt-0.5"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-base-content text-sm font-medium leading-tight">{label}</span>
        <span className="text-base-content/65 text-sm leading-snug">{description}</span>
      </span>
    </label>
  );
}
