'use client';

import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { saveTranslation } from './actions';

type Props = {
  id: string | null;
  locale: 'en' | 'es';
  initialValue: string;
  // When the cell doesn't exist yet, the parent provides an onCreate callback
  // that opens the "create pair" affordance for the row.
  onMissing?: () => void;
};

type Status = 'idle' | 'saving' | 'saved' | 'error';

export function TranslationCellEditor({ id, locale, initialValue, onMissing }: Props) {
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  // Keep the textarea height matched to content.
  useEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = '0px';
    ta.style.height = `${Math.max(ta.scrollHeight, 36)}px`;
  }, [value]);

  // If the row prop changes (e.g. filter reload), pick up the new value.
  useEffect(() => {
    setValue(initialValue);
    setStatus('idle');
    setError(null);
  }, [initialValue, id]);

  if (!id) {
    return (
      <button
        type="button"
        onClick={onMissing}
        className="text-base-content/40 hover:text-primary hover:bg-base-200 group flex w-full items-center gap-1 rounded px-2 py-1.5 text-left text-xs italic"
      >
        + add {locale.toUpperCase()}
      </button>
    );
  }

  const commit = async () => {
    if (value === initialValue) {
      setStatus('idle');
      return;
    }
    setStatus('saving');
    setError(null);
    const result = await saveTranslation(id, value);
    if (result.ok) {
      setStatus('saved');
      // Fade the saved indicator after a beat.
      window.setTimeout(() => setStatus('idle'), 1400);
    } else {
      setStatus('error');
      setError(result.error.message || result.error.code);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      ref.current?.blur();
    }
    if (e.key === 'Escape') {
      setValue(initialValue);
      setStatus('idle');
      setError(null);
      ref.current?.blur();
    }
  };

  return (
    <div className="group relative">
      <textarea
        ref={ref}
        lang={locale}
        value={value}
        spellCheck={true}
        onChange={(e) => setValue(e.currentTarget.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        className="border-base-200 hover:border-base-300 focus:border-primary focus:bg-base-100 w-full resize-none rounded border bg-transparent px-2 py-1.5 text-sm leading-relaxed transition-colors focus:outline-none"
        rows={1}
      />
      <div className="text-base-content/50 pointer-events-none absolute right-2 top-1.5 text-xs">
        {status === 'saving' && (
          <span className="loading loading-spinner loading-xs" aria-label="Saving" />
        )}
        {status === 'saved' && (
          <FontAwesomeIcon icon={faCheck} className="text-success h-3 w-3" aria-label="Saved" />
        )}
        {status === 'error' && (
          <span title={error ?? 'Save failed'} className="text-error">
            <FontAwesomeIcon icon={faCircleExclamation} className="h-3 w-3" />
          </span>
        )}
      </div>
    </div>
  );
}
