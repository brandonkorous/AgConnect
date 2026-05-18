'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileArrowUp,
  faFilePen,
  faTriangleExclamation,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import {
  pollResumeStatusAction,
  startResumeReuploadAction,
} from '@/lib/api/resume-actions';
import { onboardingPath } from '@/lib/onboarding-steps';

type Props = { locale: string; redirectTo?: string };

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 20;

export function ResumeUpload({ locale, redirectTo }: Props) {
  const t = useTranslations('worker.onboarding');
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'pick' | 'parsing' | 'failed'>('pick');
  const [, startTransition] = useTransition();
  const fallbackTo = redirectTo ?? onboardingPath(locale, 'profile');

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      setError(t('resume.unsupported'));
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(t('resume.too_large'));
      return;
    }
    setFile(f);
  }

  async function pollUntilDone() {
    for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
      const res = await pollResumeStatusAction();
      if (!res.ok) {
        setError(t('error.generic'));
        setPhase('failed');
        return;
      }
      if (res.status === 'parsed') {
        router.push(fallbackTo as Route);
        return;
      }
      if (res.status === 'failed') {
        setPhase('failed');
        setTimeout(() => router.push(fallbackTo as Route), 1200);
        return;
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
    router.push(fallbackTo as Route);
  }

  function upload() {
    if (!file) return;
    setError(null);
    setPhase('parsing');
    startTransition(async () => {
      const res = await startResumeReuploadAction();
      if (!res.ok) {
        setError(t('error.generic'));
        setPhase('pick');
        return;
      }
      void pollUntilDone();
    });
  }

  if (phase === 'parsing') {
    return (
      <div className="border-base-300 bg-base-100 grid place-items-center gap-3 rounded-2xl border p-8 text-center">
        <FontAwesomeIcon
          icon={faSpinner}
          className="text-primary h-6 w-6 animate-spin"
        />
        <p className="text-[14px] font-semibold">{t('resume.parsing.line1')}</p>
        <p className="text-base-content/60 text-[12px]">
          {t('resume.parsing.line2')}
        </p>
      </div>
    );
  }

  if (phase === 'failed') {
    return (
      <div className="border-warning/40 bg-warning/10 grid gap-2 rounded-2xl border p-5">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-warning h-4 w-4" />
          <span className="text-[14px] font-semibold">{t('resume.parse_failed')}</span>
        </div>
        <p className="text-base-content/70 text-[13px]">{t('resume.parsing.manual')}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {!file ? (
        <>
          <label className="btn btn-lg btn-primary justify-start">
            <FontAwesomeIcon icon={faFileArrowUp} className="h-4 w-4" />
            <span>{t('resume.have')}</span>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={pick}
            />
          </label>
          <a href={fallbackTo} className="btn btn-lg btn-outline justify-start">
            <FontAwesomeIcon icon={faFilePen} className="h-4 w-4" />
            <span>{t('resume.dont')}</span>
          </a>
          <p className="text-base-content/60 text-sm">{t('resume.formats')}</p>
        </>
      ) : (
        <div className="border-base-300 bg-base-100 grid gap-3 rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <span className="truncate font-medium">{file.name}</span>
            <span className="text-base-content/60 text-xs font-mono">
              {(file.size / 1024).toFixed(0)} KB
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFile(null)}
              className="btn btn-ghost flex-1"
            >
              {t('resume.cancel')}
            </button>
            <button
              type="button"
              onClick={upload}
              className="btn btn-primary flex-1"
            >
              {t('resume.upload')}
            </button>
          </div>
        </div>
      )}
      {error && (
        <div role="alert" className="alert alert-warning">
          <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
