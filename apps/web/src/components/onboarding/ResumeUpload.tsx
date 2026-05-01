'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileArrowUp,
  faFilePen,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';

type Props = { locale: string };

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export function ResumeUpload({ locale }: Props) {
  const t = useTranslations('worker.onboarding');
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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

  async function upload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      // The 07-resume-parser pipeline isn't online yet; the stub API responds
      // immediately with `failed → manual_entry`. Skip the round-trip and go
      // straight to the manual editor.
      router.push(`/${locale}/onboarding/profile`);
    } catch {
      setError(t('error.generic'));
    } finally {
      setUploading(false);
    }
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
          <a
            href={`/${locale}/onboarding/profile`}
            className="btn btn-lg btn-outline justify-start"
          >
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
              disabled={uploading}
            >
              {t('resume.cancel')}
            </button>
            <button
              type="button"
              onClick={upload}
              className="btn btn-primary flex-1"
              disabled={uploading}
            >
              {uploading ? t('resume.uploading') : t('resume.upload')}
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
