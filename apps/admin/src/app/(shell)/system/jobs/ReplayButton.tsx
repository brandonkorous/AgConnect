'use client';

import { useState, useTransition } from 'react';
import { replay } from './actions';

export function ReplayButton({ jobId }: { jobId: string }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  function onClick() {
    if (!confirm('Re-enqueue this job? The original row stays in its current state.')) return;
    startTransition(async () => {
      const res = await replay(jobId);
      if (res.ok) {
        setStatus('done');
        setMessage(res.data.replayedAs ? `queued: ${res.data.replayedAs.slice(0, 8)}` : 'queued');
      } else {
        setStatus('error');
        setMessage(res.error.message);
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending || status === 'done'}
        className="btn btn-ghost btn-xs"
      >
        {isPending ? 'Replaying…' : status === 'done' ? 'Replayed' : 'Replay'}
      </button>
      {message && (
        <span className={`text-[11px] ${status === 'error' ? 'text-error' : 'text-base-content/60'}`}>
          {message}
        </span>
      )}
    </span>
  );
}
