'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { useCancelProgramMutation } from '@/lib/api/hooks/mutations/training-org';

type Props = {
  programId: string;
  enrolledCount: number;
  locale: string;
};

export function CancelProgramButton({ programId, enrolledCount, locale }: Props) {
  const router = useRouter();
  const isEs = locale === 'es';
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const cancelMut = useCancelProgramMutation();
  const pending = cancelMut.isPending;

  async function cancel() {
    setError(null);
    const res = await cancelMut.mutateAsync({ id: programId, reason: reason || undefined });
    if (res.ok) {
      router.push(`/${locale}/training-org/programs`);
    } else {
      setError(
        isEs ? 'No se pudo cancelar. Intenta de nuevo.' : 'Could not cancel. Try again.',
      );
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="btn btn-sm btn-ghost text-error hover:bg-error/10 rounded-full"
      >
        {isEs ? 'Cancelar programa' : 'Cancel program'}
      </button>
    );
  }

  return (
    <div className="border-error bg-error/5 grid gap-3 rounded-2xl border p-4">
      <div className="flex items-start gap-2">
        <FontAwesomeIcon
          icon={faTriangleExclamation}
          className="text-error mt-0.5 h-4 w-4"
        />
        <div>
          <p className="text-[13.5px] font-semibold">
            {isEs ? 'Cancelar este programa' : 'Cancel this program'}
          </p>
          <p className="text-base-content/70 mt-0.5 text-[12.5px]">
            {enrolledCount > 0
              ? isEs
                ? `${enrolledCount} inscritos recibirán un SMS de cancelación.`
                : `${enrolledCount} enrolled workers will receive a cancellation SMS.`
              : isEs
                ? 'Nadie está inscrito todavía.'
                : 'No one is enrolled yet.'}
          </p>
        </div>
      </div>

      <fieldset className="fieldset w-full min-w-0">
        <legend className="fieldset-legend text-xs">
          {isEs ? 'Motivo (opcional)' : 'Reason (optional)'}
        </legend>
        <input
          type="text"
          className="input input-bordered input-sm"
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={
            isEs
              ? 'p. ej., baja inscripción, conflicto de horario'
              : 'e.g., low enrollment, schedule conflict'
          }
        />
      </fieldset>

      {error && <p className="text-error text-[12px]">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="btn btn-sm btn-ghost flex-1"
        >
          {isEs ? 'Atrás' : 'Back'}
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          className="btn btn-sm btn-error flex-1"
        >
          {pending && <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />}
          {pending
            ? isEs
              ? 'Cancelando…'
              : 'Canceling…'
            : isEs
              ? 'Confirmar'
              : 'Confirm'}
        </button>
      </div>
    </div>
  );
}
