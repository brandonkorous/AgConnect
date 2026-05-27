'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { isOk } from '@agconn/api-client';
import { pushToast } from '@agconn/ui';
import { getApiClient } from '@/lib/api/client';
import {
  draftFromCrew,
  emptyDraft,
  type CrewDraft,
  type CrewEditorPageProps,
} from './types';
import { draftsEqual } from './draftsEqual';
import type { ActiveHireView } from '@/lib/api/hooks/employer-ops';

type Args = {
  locale: string;
  mode: 'new' | 'edit';
  crew: CrewEditorPageProps['crew'];
  hires: ActiveHireView[];
};

export function useCrewEditor({ locale, mode, crew, hires }: Args) {
  const t = useTranslations('employer.crews.edit_crew');
  const router = useRouter();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [, setTick] = useState(0);

  const initialDraft = useMemo<CrewDraft>(
    () => (crew ? draftFromCrew(crew) : emptyDraft()),
    [crew],
  );
  const [draft, setDraft] = useState<CrewDraft>(initialDraft);

  const updateDraft = useCallback((patch: Partial<CrewDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setLastSavedAt(null);
  }, []);

  useEffect(() => {
    if (lastSavedAt == null) return;
    const id = setInterval(() => setTick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, [lastSavedAt]);

  const trimmedName = draft.name.trim();
  const isNameValid = trimmedName.length >= 2;
  const isDirty = useMemo(() => !draftsEqual(draft, initialDraft), [draft, initialDraft]);
  const canSubmit = mode === 'new' ? isNameValid : isNameValid && isDirty;

  const foremanName = useMemo(() => {
    if (!draft.foremanUserId) return null;
    const h = hires.find((x) => x.workerUserId === draft.foremanUserId);
    if (!h) return crew?.foremanName ?? null;
    return `${h.firstName} ${h.lastInitial ? `${h.lastInitial}.` : ''}`.trim();
  }, [draft.foremanUserId, hires, crew?.foremanName]);

  function buildBody() {
    return {
      name: draft.name.trim(),
      shortCode: draft.shortCode.trim() || null,
      crewType: draft.crewType || null,
      primaryCrop: draft.primaryCrop || null,
      color: draft.color,
      requiredSkills: Array.from(draft.requiredSkills),
      baseWageCents: draft.baseWageCents,
      pieceRateCents: draft.pieceRateCents,
      pieceRateUnit: draft.pieceRateUnit.trim() || null,
      foremanPremiumCents: draft.foremanPremiumCents,
      commsChannels: draft.commsChannels,
      foremanUserId: draft.foremanUserId,
      notes: draft.notes.trim() || null,
    };
  }

  async function save() {
    setAttemptedSave(true);
    if (!isNameValid) {
      setNameError(t('error_name_required'));
      const el = document.getElementById('basics');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setNameError(null);
    setError(null);
    setBusy(true);
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      if (mode === 'new') {
        const body = buildBody();
        const res = await client.post<{ crew: { id: string } }>(
          '/v1/employer/crews',
          Object.fromEntries(
            Object.entries(body).filter(([, v]) => v !== null && v !== undefined),
          ),
          { handleErrorInline: true },
        );
        if (!isOk(res)) {
          setError(res.error.message || t('error_save'));
          return;
        }
        router.push(`/${locale}/employer/crews/${res.data.crew.id}/edit` as Route);
      } else if (crew) {
        const res = await client.patch(`/v1/employer/crews/${crew.id}`, buildBody(), {
          handleErrorInline: true,
        });
        if (!isOk(res)) {
          setError(res.error.message || t('error_save'));
          return;
        }
        setLastSavedAt(Date.now());
        void queryClient.invalidateQueries({ queryKey: ['employer'] });
      }
    } finally {
      setBusy(false);
    }
  }

  async function duplicate() {
    if (!crew) return;
    setBusy(true);
    setError(null);
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const body = buildBody();
      const res = await client.post<{ crew: { id: string } }>(
        '/v1/employer/crews',
        {
          ...Object.fromEntries(
            Object.entries(body).filter(([, v]) => v !== null && v !== undefined),
          ),
          name: t('duplicate_name', { name: draft.name }),
          foremanUserId: undefined,
        },
        { handleErrorInline: true },
      );
      if (!isOk(res)) {
        setError(res.error.message || t('error_duplicate'));
        return;
      }
      router.push(`/${locale}/employer/crews/${res.data.crew.id}/edit` as Route);
    } finally {
      setBusy(false);
    }
  }

  async function archive() {
    if (!crew) return;
    setBusy(true);
    setError(null);
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.del(`/v1/employer/crews/${crew.id}`, { handleErrorInline: true });
      if (!isOk(res)) {
        setError(res.error.message || t('error_archive'));
        return;
      }
      pushToast({
        variant: 'success',
        title: t('archive_toast_title', { name: crew.name }),
      });
      router.push(`/${locale}/employer/crews`);
      void queryClient.invalidateQueries({ queryKey: ['employer'] });
    } finally {
      setBusy(false);
    }
  }

  return {
    draft,
    updateDraft,
    busy,
    error,
    setError,
    nameError,
    attemptedSave,
    archiveOpen,
    setArchiveOpen,
    memberCount,
    setMemberCount,
    lastSavedAt,
    isNameValid,
    isDirty,
    canSubmit,
    foremanName,
    save,
    duplicate,
    archive,
  };
}

