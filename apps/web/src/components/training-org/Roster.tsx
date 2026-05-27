'use client';

import { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useBulkUpdateEnrollmentsMutation } from '@/lib/api/hooks/mutations/training-org';
import type { RosterEnrollmentView } from '@/lib/api/training-org';

type Props = {
  programId: string;
  enrollments: RosterEnrollmentView[];
  locale: string;
};

const STATUS_TONE: Record<RosterEnrollmentView['status'], string> = {
  enrolled: 'badge-ghost',
  completed: 'badge-success',
  dropped: 'badge-neutral',
};

export function Roster({ programId, enrollments, locale }: Props) {
  const isEs = locale === 'es';
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const bulkMut = useBulkUpdateEnrollmentsMutation();
  const pending = bulkMut.isPending;

  const selectableIds = useMemo(
    () => enrollments.filter((e) => e.status === 'enrolled').map((e) => e.id),
    [enrollments],
  );
  const allSelectableChecked =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelectableChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableIds));
    }
  }

  function statusLabel(s: RosterEnrollmentView['status']): string {
    if (isEs) {
      return s === 'enrolled' ? 'Inscrito' : s === 'completed' ? 'Completado' : 'Retirado';
    }
    return s === 'enrolled' ? 'Enrolled' : s === 'completed' ? 'Completed' : 'Dropped';
  }

  async function apply(status: 'completed' | 'dropped', noShow = false) {
    if (selected.size === 0) return;
    setError(null);
    setSuccess(null);
    const ids = Array.from(selected);
    const res = await bulkMut.mutateAsync({
      programId,
      enrollmentIds: ids,
      status,
      noShow,
    });
    if (res.ok) {
      setSelected(new Set());
      setSuccess(
        isEs
          ? `Actualizados ${res.data.updated}.`
          : `Updated ${res.data.updated}.`,
      );
      window.setTimeout(() => setSuccess(null), 2400);
    } else {
      setError(
        isEs ? 'No se pudo actualizar. Intenta de nuevo.' : 'Could not update. Try again.',
      );
    }
  }

  if (enrollments.length === 0) {
    return (
      <div className="border-base-300 bg-base-100 rounded-2xl border p-8 text-center">
        <p className="text-base-content/70 text-[14px]">
          {isEs ? 'Sin inscripciones todavía.' : 'No enrollments yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {selected.size > 0 && (
        <div className="border-base-300 bg-base-200 sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-2xl border p-3">
          <span className="text-[13px] font-medium">
            {isEs
              ? `${selected.size} seleccionado${selected.size === 1 ? '' : 's'}`
              : `${selected.size} selected`}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => apply('completed')}
              disabled={pending}
              className="btn btn-sm btn-success rounded-full"
            >
              {pending && <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />}
              {isEs ? 'Marcar completado' : 'Mark completed'}
            </button>
            <button
              type="button"
              onClick={() => apply('dropped', false)}
              disabled={pending}
              className="btn btn-sm btn-ghost rounded-full"
            >
              {isEs ? 'Marcar retirado' : 'Mark dropped'}
            </button>
            <button
              type="button"
              onClick={() => apply('dropped', true)}
              disabled={pending}
              className="btn btn-sm btn-ghost rounded-full"
            >
              {isEs ? 'Marcar no-asistencia' : 'Mark no-show'}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-error text-[13px]">{error}</p>}
      {success && (
        <p className="text-success inline-flex items-center gap-1.5 text-[13px]">
          <FontAwesomeIcon icon={faCircleCheck} className="h-3.5 w-3.5" />
          {success}
        </p>
      )}

      <div className="border-base-300 overflow-hidden rounded-2xl border bg-white">
        <table className="w-full text-[13.5px]">
          <thead className="bg-base-200 text-base-content/70 text-left text-xs uppercase tracking-wider">
            <tr>
              <th className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={allSelectableChecked}
                  disabled={selectableIds.length === 0}
                  onChange={toggleAll}
                  aria-label={isEs ? 'Seleccionar todo' : 'Select all'}
                />
              </th>
              <th className="px-3 py-2">{isEs ? 'Trabajador' : 'Worker'}</th>
              <th className="px-3 py-2">{isEs ? 'Contacto' : 'Contact'}</th>
              <th className="px-3 py-2">{isEs ? 'Estado' : 'Status'}</th>
              <th className="px-3 py-2">{isEs ? 'Inscrito' : 'Enrolled'}</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => {
              const selectable = e.status === 'enrolled';
              return (
                <tr key={e.id} className="border-base-200 border-t">
                  <td className="px-3 py-2.5">
                    {selectable && (
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={selected.has(e.id)}
                        onChange={() => toggle(e.id)}
                        aria-label={`Select ${e.workerName}`}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-medium">{e.workerName}</td>
                  <td className="text-base-content/70 px-3 py-2.5 font-mono text-[12px]">
                    {e.workerPhone || e.workerEmail || '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`badge ${STATUS_TONE[e.status]} badge-sm font-mono uppercase tracking-wider`}
                    >
                      {statusLabel(e.status)}
                      {e.noShow && ` · ${isEs ? 'no-asistencia' : 'no-show'}`}
                    </span>
                  </td>
                  <td className="text-base-content/65 px-3 py-2.5 font-mono text-[12px]">
                    {new Date(e.enrolledAt).toLocaleDateString(locale)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
