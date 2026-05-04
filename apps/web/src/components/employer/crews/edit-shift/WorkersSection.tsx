'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';
import { ActiveHiresPicker } from '@/components/employer/crews/ActiveHiresPicker';
import { SectionCard } from './SectionCard';
import type { ShiftAssignmentView } from '@/lib/api/employer-ops';

const STATUSES = ['assigned', 'confirmed', 'declined', 'no_show', 'completed'] as const;
type AssignmentStatus = (typeof STATUSES)[number];

type Props = {
  shiftId: string;
  crewId: string | null;
  initial: ShiftAssignmentView[];
  onCountsChanged: (next: { assignedCount: number; confirmedCount: number }) => void;
};

export function WorkersSection({ shiftId, crewId, initial, onCountsChanged }: Props) {
  const t = useTranslations('employer.crews.edit_shift.workers');
  const locale = useLocale();
  const [items, setItems] = useState<ShiftAssignmentView[]>(initial);
  const [crewMemberIds, setCrewMemberIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onCountsChanged({
      assignedCount: items.length,
      confirmedCount: items.filter(
        (a) => a.status === 'confirmed' || a.status === 'completed',
      ).length,
    });
  }, [items, onCountsChanged]);

  useEffect(() => {
    if (!crewId) {
      setCrewMemberIds([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.get<{ members: { workerUserId: string }[] }>(
        `/v1/employer/crews/${crewId}`,
        { handleErrorInline: true },
      );
      if (cancelled) return;
      if (isOk(res)) setCrewMemberIds(res.data.members.map((m) => m.workerUserId));
    })();
    return () => {
      cancelled = true;
    };
  }, [crewId, locale]);

  async function refresh() {
    const client = getApiClient(locale === 'es' ? 'es' : 'en');
    const res = await client.get<{ assignments: ShiftAssignmentView[] }>(
      `/v1/employer/shifts/${shiftId}`,
      { handleErrorInline: true },
    );
    if (isOk(res)) setItems(res.data.assignments);
  }

  async function assign(workerUserId: string) {
    setError(null);
    setBusy(true);
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.post(
        `/v1/employer/shifts/${shiftId}/assign`,
        { workerUserId },
        { handleErrorInline: true },
      );
      if (!isOk(res)) {
        setError(res.error.message || t('error_assign'));
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(a: ShiftAssignmentView, status: AssignmentStatus) {
    setError(null);
    setBusy(true);
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.patch(
        `/v1/employer/shifts/${shiftId}/assignments/${a.id}`,
        { status },
        { handleErrorInline: true },
      );
      if (!isOk(res)) {
        setError(res.error.message || t('error_status'));
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const assignedIds = items.map((a) => a.workerUserId);

  return (
    <SectionCard
      id="workers"
      title={t('title')}
      sub={t('sub', { count: items.length })}
    >
      {error && (
        <div className="bg-warning/10 border-warning/30 text-base-content mb-3 rounded-xl border px-3 py-2 text-sm">
          {error}
        </div>
      )}
      {items.length === 0 ? (
        <div className="border-base-300 text-base-content/60 mb-4 rounded-xl border border-dashed p-4 text-center text-xs">
          {t('empty')}
        </div>
      ) : (
        <ul className="border-base-300 divide-base-300 mb-4 divide-y rounded-xl border">
          {items.map((a) => {
            const initials = `${a.firstName[0] ?? '?'}${a.lastInitial}`.toUpperCase();
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-3.5 py-2.5">
                <span className="bg-base-200 grid h-9 w-9 place-items-center rounded-full font-mono text-[11px] font-bold">
                  {initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-tight">
                    {a.firstName} {a.lastInitial ? `${a.lastInitial}.` : ''}
                  </span>
                  <span className="text-base-content/60 text-[11px]">
                    {t(`status.${a.status}`)}
                  </span>
                </span>
                <select
                  value={a.status}
                  disabled={busy}
                  onChange={(e) => changeStatus(a, e.target.value as AssignmentStatus)}
                  className="select select-sm select-bordered text-xs"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`status.${s}`)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => changeStatus(a, 'declined')}
                  aria-label={t('remove')}
                  className="text-base-content/40 hover:text-base-content rounded p-1"
                >
                  <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div>
        <div className="text-base-content/60 mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider">
          {t('assign_label')}
        </div>
        <ActiveHiresPicker
          excludeUserIds={assignedIds}
          suggestUserIds={crewMemberIds}
          busy={busy}
          onSelect={assign}
        />
      </div>
    </SectionCard>
  );
}
