'use client';

export type ErrorStateAction = {
  href: string;
  label: string;
};

export type ErrorStateSuggestion = {
  href: string;
  label: string;
  hint?: string;
};

export type ErrorStateProps = {
  code: string;
  eyebrow: string;
  title: string;
  description?: string;
  attempted?: string;
  attemptedLabel?: string;
  primaryAction?: ErrorStateAction;
  secondaryAction?: ErrorStateAction;
  suggestionsLabel?: string;
  suggestions?: ErrorStateSuggestion[];
  tryAgainLabel?: string;
  reset?: () => void;
  digest?: string;
  errorIdLabel?: string;
};

export function ErrorState({
  code,
  eyebrow,
  title,
  description,
  attempted,
  attemptedLabel,
  primaryAction,
  secondaryAction,
  suggestionsLabel,
  suggestions,
  tryAgainLabel,
  reset,
  digest,
  errorIdLabel,
}: ErrorStateProps) {
  const hasActions = Boolean(primaryAction || secondaryAction || (reset && tryAgainLabel));
  const hasSuggestions = Boolean(suggestions && suggestions.length > 0);

  return (
    <section
      role="region"
      aria-labelledby="error-state-title"
      className="flex w-full flex-col items-center justify-center px-5 py-20 md:py-28"
    >
      <div className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <div className="text-base-content/60 flex items-center justify-center gap-2.5">
          <span className="font-mono text-xs tabular-nums tracking-[0.18em]">{code}</span>
          <span aria-hidden className="text-base-content/30 select-none">
            ·
          </span>
          <span className="eyebrow text-xs">{eyebrow}</span>
        </div>

        <h1
          id="error-state-title"
          className="font-serif text-3xl font-medium tracking-tight md:text-4xl"
        >
          {title}
        </h1>

        {description && (
          <p className="text-base-content/80 mx-auto max-w-md text-base leading-relaxed">
            {description}
          </p>
        )}

        {attempted && (
          <div className="bg-base-200 border-base-300 flex w-full max-w-md flex-col gap-1 rounded-box border px-4 py-3 text-left">
            {attemptedLabel && (
              <span className="text-base-content/60 eyebrow text-[0.65rem]">
                {attemptedLabel}
              </span>
            )}
            <code className="text-base-content/80 font-mono text-sm break-all">
              {attempted}
            </code>
          </div>
        )}

        {hasActions && (
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            {reset && tryAgainLabel && (
              <button type="button" onClick={reset} className="btn btn-primary">
                {tryAgainLabel}
              </button>
            )}
            {primaryAction && (
              <a className="btn btn-primary" href={primaryAction.href}>
                {primaryAction.label}
              </a>
            )}
            {secondaryAction && (
              <a className="btn btn-ghost" href={secondaryAction.href}>
                {secondaryAction.label}
              </a>
            )}
          </div>
        )}

        {hasSuggestions && (
          <div className="border-base-300 mt-6 flex w-full max-w-md flex-col gap-3 border-t pt-6">
            {suggestionsLabel && (
              <p className="text-base-content/60 eyebrow text-center text-[0.65rem]">
                {suggestionsLabel}
              </p>
            )}
            <ul className="flex flex-col gap-1">
              {suggestions!.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    className="hover:bg-base-200 group flex flex-col gap-0.5 rounded-field px-3 py-2.5 text-left transition-colors"
                  >
                    <span className="text-base-content text-sm font-medium group-hover:text-primary">
                      {s.label}
                    </span>
                    {s.hint && (
                      <span className="text-base-content/60 text-xs">{s.hint}</span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {digest && errorIdLabel && (
          <p className="text-base-content/50 mt-4 font-mono text-xs">
            {errorIdLabel.replace('{id}', digest)}
          </p>
        )}
      </div>
    </section>
  );
}
