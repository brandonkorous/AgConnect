'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type ConfirmInput = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
};

type ModalApi = {
  confirm: (input: ConfirmInput) => Promise<boolean>;
  alert: (input: Omit<ConfirmInput, 'cancelLabel'>) => Promise<void>;
};

const ModalContext = createContext<ModalApi | null>(null);

export const useModal = (): ModalApi => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal called outside <ModalProvider>');
  return ctx;
};

type Pending = {
  input: ConfirmInput;
  isAlert: boolean;
  resolve: (v: boolean) => void;
};

export function ModalProvider({
  children,
  defaults,
}: {
  children: React.ReactNode;
  defaults?: { confirmLabel: string; cancelLabel: string };
}) {
  const [queue, setQueue] = useState<Pending[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const enqueue = useCallback(
    (entry: Omit<Pending, 'resolve'>) =>
      new Promise<boolean>((resolve) => {
        triggerRef.current = (typeof document !== 'undefined'
          ? (document.activeElement as HTMLElement | null)
          : null);
        setQueue((q) => [...q, { ...entry, resolve }]);
      }),
    [],
  );

  const api: ModalApi = {
    confirm: (input) => enqueue({ input, isAlert: false }),
    alert: (input) => enqueue({ input, isAlert: true }).then(() => undefined),
  };

  const current = queue[0];

  useEffect(() => {
    if (!dialogRef.current) return;
    if (current && !dialogRef.current.open) dialogRef.current.showModal();
    if (!current && dialogRef.current.open) dialogRef.current.close();
  }, [current]);

  const resolve = useCallback(
    (value: boolean) => {
      setQueue((q) => {
        if (q.length === 0) return q;
        const [head, ...rest] = q;
        head?.resolve(value);
        return rest;
      });
      const trigger = triggerRef.current;
      if (trigger && typeof trigger.focus === 'function') trigger.focus();
      triggerRef.current = null;
    },
    [],
  );

  const cancelLabel = current?.input.cancelLabel ?? defaults?.cancelLabel ?? 'Cancel';
  const confirmLabel = current?.input.confirmLabel ?? defaults?.confirmLabel ?? 'Confirm';
  const isDestructive = current?.input.variant === 'destructive';

  return (
    <ModalContext.Provider value={api}>
      {children}
      <dialog
        ref={dialogRef}
        className="modal"
        onCancel={(e) => {
          if (isDestructive) {
            e.preventDefault();
            return;
          }
          resolve(false);
        }}
        onClick={(e) => {
          if (isDestructive) return;
          if (e.target === e.currentTarget) resolve(false);
        }}
      >
        <div className="modal-box bg-base-100 max-w-md">
          {current && (
            <>
              <h3 className="text-base-content font-serif text-xl font-medium">{current.input.title}</h3>
              {current.input.description && (
                <p className="text-base-content/80 mt-2 text-sm">{current.input.description}</p>
              )}
              <div className="modal-action">
                {!current.isAlert && (
                  <button type="button" className="btn btn-ghost" onClick={() => resolve(false)}>
                    {cancelLabel}
                  </button>
                )}
                <button
                  type="button"
                  className={`btn ${isDestructive ? 'btn-error' : 'btn-primary'}`}
                  onClick={() => resolve(true)}
                  autoFocus
                >
                  {confirmLabel}
                </button>
              </div>
            </>
          )}
        </div>
      </dialog>
    </ModalContext.Provider>
  );
}
