'use client';

import { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useTranslations } from 'next-intl';
import type { JobPhotoView } from '@/lib/api/hooks/employer';
import { uploadJobPhoto, deleteJobPhoto, reorderJobPhotos } from './api';

type Props = {
  jobId: string | null;
  locale: string;
  photos: JobPhotoView[];
  onChange: (photos: JobPhotoView[]) => void;
};

const MAX_PHOTOS = 6;

export function PhotoGrid({ jobId, locale, photos, onChange }: Props) {
  const t = useTranslations('employer.jobs.form_v2');
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const slots = MAX_PHOTOS;
  const photoSlots: (JobPhotoView | null)[] = Array.from({ length: slots }, (_, i) => photos[i] ?? null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !jobId) return;
    setUploading(true);
    try {
      const next: JobPhotoView[] = [...photos];
      for (const file of Array.from(files)) {
        if (next.length >= MAX_PHOTOS) break;
        const photo = await uploadJobPhoto(locale, jobId, file);
        if (photo) next.push(photo);
      }
      onChange(next);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function remove(p: JobPhotoView) {
    if (!jobId) return;
    const ok = await deleteJobPhoto(locale, jobId, p.id);
    if (!ok) return;
    onChange(photos.filter((x) => x.id !== p.id));
  }

  function onDragStart(p: JobPhotoView) {
    setDragId(p.id);
  }

  async function onDrop(target: JobPhotoView) {
    if (!dragId || !jobId || dragId === target.id) return;
    const next = [...photos];
    const fromIdx = next.findIndex((x) => x.id === dragId);
    const toIdx = next.findIndex((x) => x.id === target.id);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = next.splice(fromIdx, 1);
    if (moved) next.splice(toIdx, 0, moved);
    onChange(next);
    setDragId(null);
    await reorderJobPhotos(locale, jobId, next.map((p) => p.id));
  }

  return (
    <div>
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        className="hidden"
        onChange={onPick}
      />
      {!jobId ? (
        <div className="border-base-300 bg-base-200/50 text-base-content/65 grid min-h-24 place-items-center rounded-lg border-2 border-dashed p-4 text-center">
          <div>
            <FontAwesomeIcon icon={faPlus} className="text-base-content/40 mb-1.5 h-5 w-5" />
            <p className="text-sm font-semibold">{t('photo_save_first')}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {photoSlots.map((p, i) =>
            p ? (
              <div
                key={p.id}
                draggable={!!jobId}
                onDragStart={() => onDragStart(p)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(p)}
                className="group bg-base-200 border-base-300 relative aspect-square overflow-hidden rounded-lg border"
              >
                <img
                  src={p.url}
                  alt={p.captionEn ?? ''}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => remove(p)}
                  aria-label={t('photo_remove')}
                  className="bg-base-100/90 text-error hover:bg-base-100 absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                key={`empty-${i}`}
                type="button"
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
                className="border-base-300 text-base-content/40 hover:border-primary hover:text-primary grid aspect-square place-items-center rounded-lg border border-dashed transition-colors disabled:opacity-40"
                aria-label={t('photo_add')}
              >
                <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
