'use client';

export type PageErrorProps = {
  variant: '404' | '500';
  title: string;
  description?: string;
  tryAgainLabel?: string;
  goHomeLabel?: string;
  errorIdLabel?: string;
  digest?: string;
  reset?: () => void;
  homeHref?: string;
};

export function PageError({
  variant,
  title,
  description,
  tryAgainLabel,
  goHomeLabel,
  errorIdLabel,
  digest,
  reset,
  homeHref = '/',
}: PageErrorProps) {
  return (
    <div className="bg-base-100 text-base-content flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-base-content/50 font-mono text-sm">{variant}</div>
      <h1 className="font-serif text-3xl font-medium tracking-tight">{title}</h1>
      {description && <p className="text-base-content/80 max-w-md text-base">{description}</p>}
      <div className="mt-2 flex gap-2">
        {reset && tryAgainLabel && (
          <button type="button" className="btn btn-primary" onClick={reset}>
            {tryAgainLabel}
          </button>
        )}
        {goHomeLabel && (
          <a href={homeHref} className="btn btn-ghost">
            {goHomeLabel}
          </a>
        )}
      </div>
      {digest && errorIdLabel && (
        <p className="text-base-content/60 mt-2 font-mono text-xs">
          {errorIdLabel.replace('{id}', digest)}
        </p>
      )}
    </div>
  );
}
