'use client';

export function OfflineRetryButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="btn btn-primary"
      onClick={() => window.location.reload()}
    >
      {label}
    </button>
  );
}
