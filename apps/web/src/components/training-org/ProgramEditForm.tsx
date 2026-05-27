'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useUpdateProgramMutation } from '@/lib/api/hooks/mutations/training-org';
import type { ProgramFullView } from '@/lib/api/training-org';

type Props = {
  program: ProgramFullView;
  locale: string;
};

type SessionRow = { start: string; end: string; notes: string };

function toLocalInputValue(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIsoFromLocal(local: string): string {
  if (!local) return '';
  return new Date(local).toISOString();
}

export function ProgramEditForm({ program, locale }: Props) {
  const isEs = locale === 'es';
  const [descriptionEn, setDescriptionEn] = useState(program.descriptionEn);
  const [descriptionEs, setDescriptionEs] = useState(program.descriptionEs);
  const [locationName, setLocationName] = useState(program.locationName);
  const [locationAddress, setLocationAddress] = useState(program.locationAddress);
  const [sessions, setSessions] = useState<SessionRow[]>(
    program.sessionTimes.map((s) => ({
      start: toLocalInputValue(s.start),
      end: toLocalInputValue(s.end),
      notes: s.notes ?? '',
    })),
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateMut = useUpdateProgramMutation();
  const pending = updateMut.isPending;

  function updateSession(i: number, patch: Partial<SessionRow>) {
    setSessions((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function addSession() {
    setSessions((prev) => [...prev, { start: '', end: '', notes: '' }]);
  }
  function removeSession(i: number) {
    setSessions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const sessionsPayload = sessions
      .filter((s) => s.start && s.end)
      .map((s) => ({
        start: toIsoFromLocal(s.start),
        end: toIsoFromLocal(s.end),
        ...(s.notes ? { notes: s.notes } : {}),
      }));

    void (async () => {
      const res = await updateMut.mutateAsync({
        id: program.id,
        body: {
          descriptionEn,
          descriptionEs,
          locationName,
          locationAddress,
          sessionTimes: sessionsPayload,
        },
      });
      if (res.ok) {
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2000);
      } else {
        setError(
          res.code === 'program_not_editable'
            ? isEs
              ? 'No se puede editar un programa cancelado o cerrado.'
              : 'Cannot edit a canceled or closed program.'
            : isEs
              ? 'No se pudo guardar. Intenta de nuevo.'
              : 'Could not save. Try again.',
        );
      }
    })();
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <fieldset className="fieldset w-full min-w-0">
        <legend className="fieldset-legend">
          {isEs ? 'Descripción (Inglés)' : 'Description (English)'}
        </legend>
        <textarea
          className="textarea textarea-bordered min-h-[160px]"
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.target.value)}
          required
          minLength={20}
          maxLength={5000}
        />
      </fieldset>

      <fieldset className="fieldset w-full min-w-0">
        <legend className="fieldset-legend">
          {isEs ? 'Descripción (Español)' : 'Description (Spanish)'}
        </legend>
        <textarea
          className="textarea textarea-bordered min-h-[160px]"
          value={descriptionEs}
          onChange={(e) => setDescriptionEs(e.target.value)}
          required
          minLength={20}
          maxLength={5000}
        />
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <fieldset className="fieldset w-full min-w-0">
          <legend className="fieldset-legend">
            {isEs ? 'Nombre del lugar' : 'Location name'}
          </legend>
          <input
            type="text"
            className="input input-bordered"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            required
          />
        </fieldset>
        <fieldset className="fieldset w-full min-w-0">
          <legend className="fieldset-legend">
            {isEs ? 'Dirección' : 'Address'}
          </legend>
          <input
            type="text"
            className="input input-bordered"
            value={locationAddress}
            onChange={(e) => setLocationAddress(e.target.value)}
            required
          />
        </fieldset>
      </div>

      <div className="border-base-300 rounded-2xl border p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">
            {isEs ? 'Sesiones' : 'Sessions'}
          </h2>
          <button
            type="button"
            onClick={addSession}
            className="btn btn-xs btn-ghost rounded-full"
          >
            {isEs ? '+ Añadir sesión' : '+ Add session'}
          </button>
        </div>
        <div className="grid gap-3">
          {sessions.map((s, i) => (
            <div
              key={i}
              className="border-base-200 grid gap-2 rounded-xl border p-3 md:grid-cols-[1fr_1fr_1.5fr_auto]"
            >
              <fieldset className="fieldset min-w-0">
                <legend className="fieldset-legend text-xs">
                  {isEs ? 'Inicio' : 'Start'}
                </legend>
                <input
                  type="datetime-local"
                  className="input input-bordered input-sm"
                  value={s.start}
                  onChange={(e) => updateSession(i, { start: e.target.value })}
                />
              </fieldset>
              <fieldset className="fieldset min-w-0">
                <legend className="fieldset-legend text-xs">
                  {isEs ? 'Fin' : 'End'}
                </legend>
                <input
                  type="datetime-local"
                  className="input input-bordered input-sm"
                  value={s.end}
                  onChange={(e) => updateSession(i, { end: e.target.value })}
                />
              </fieldset>
              <fieldset className="fieldset min-w-0">
                <legend className="fieldset-legend text-xs">
                  {isEs ? 'Notas' : 'Notes'}
                </legend>
                <input
                  type="text"
                  className="input input-bordered input-sm"
                  maxLength={140}
                  value={s.notes}
                  onChange={(e) => updateSession(i, { notes: e.target.value })}
                />
              </fieldset>
              <button
                type="button"
                onClick={() => removeSession(i)}
                className="btn btn-sm btn-ghost text-error self-end"
              >
                {isEs ? 'Quitar' : 'Remove'}
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-base-content/55 text-xs">
              {isEs ? 'Sin sesiones todavía.' : 'No sessions yet.'}
            </p>
          )}
        </div>
      </div>

      {error && <p className="text-error text-[13px]">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary rounded-full"
        >
          {pending && <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />}
          {pending
            ? isEs
              ? 'Guardando…'
              : 'Saving…'
            : isEs
              ? 'Guardar cambios'
              : 'Save changes'}
        </button>
        {saved && (
          <span className="text-success inline-flex items-center gap-1.5 text-[13px]">
            <FontAwesomeIcon icon={faCircleCheck} className="h-3.5 w-3.5" />
            {isEs ? 'Guardado' : 'Saved'}
          </span>
        )}
        <Link
          href={`/${locale}/training-org/programs`}
          className="text-base-content/65 ml-auto text-[13px]"
        >
          {isEs ? 'Cancelar' : 'Cancel'}
        </Link>
      </div>
    </form>
  );
}
