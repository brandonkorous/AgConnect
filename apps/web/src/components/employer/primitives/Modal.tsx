'use client';

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

type Size = 'sm' | 'md' | 'lg' | 'xl';

type Props = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: Size;
  /**
   * Optional right-rail content (e.g., compliance instructions). When set on
   * `xl` size, the modal renders form/content on the left and the sidebar on
   * the right (60/40 split). On narrower viewports the sidebar collapses
   * below the main content.
   */
  sidebar?: React.ReactNode;
};

export type ModalHandle = {
  open: () => void;
  close: () => void;
};

const SIZE_CLASS: Record<Size, string> = {
  sm: 'max-w-sm',
  md: 'max-w-[560px]',
  lg: 'max-w-2xl',
  xl: 'max-w-5xl',
};

export const Modal = forwardRef<ModalHandle, Props>(function Modal(
  { title, children, onClose, size = 'md', sidebar },
  ref,
) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  // True when the close is being driven by our own unmount cleanup, so the
  // `close` event listener can suppress the redundant onClose() that would
  // otherwise re-set the parent state mid-unmount.
  const closingByCleanup = useRef(false);

  useImperativeHandle(
    ref,
    () => ({
      open: () => dialogRef.current?.showModal(),
      close: () => dialogRef.current?.close(),
    }),
    [],
  );

  // Mount-on-render usage (`{open && <Modal/>}`): show the native dialog as a
  // top-layer modal on first paint, and tear it down on unmount.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (!el.open) {
      try {
        el.showModal();
      } catch {
        /* already open or detached */
      }
    }
    return () => {
      if (el.open) {
        closingByCleanup.current = true;
        el.close();
      }
    };
  }, []);

  // Native <dialog> emits `close` when ESC is pressed or close() is called.
  // Forward to the caller's onClose so the parent can unmount — but ignore
  // close events triggered by our own unmount cleanup (above), since the
  // parent has already decided to unmount us.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const handler = () => {
      if (closingByCleanup.current) {
        closingByCleanup.current = false;
        return;
      }
      onClose();
    };
    el.addEventListener('close', handler);
    return () => el.removeEventListener('close', handler);
  }, [onClose]);

  // Backdrop click: when the user clicks the dialog element directly (not its
  // inner content), close. The native ::backdrop pseudo-element receives clicks
  // through to the dialog itself.
  function onBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) {
      dialogRef.current?.close();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClick={onBackdropClick}
      className="modal bg-neutral/60 backdrop:bg-neutral/60"
    >
      <div
        className={[
          'modal-box bg-base-100 relative w-full rounded-2xl p-8',
          'shadow-[var(--shadow-pop)]',
          SIZE_CLASS[size],
        ].join(' ')}
      >
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close"
          className="text-base-content/50 hover:text-base-content focus-visible:ring-primary focus-visible:ring-2 absolute right-3 top-3 grid h-11 w-11 shrink-0 place-items-center rounded-full"
        >
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
        </button>

        <h2
          id={titleId}
          className="font-display pr-12 text-2xl font-semibold tracking-tight tabular-nums slashed-zero"
        >
          {title}
        </h2>

        <div className="mt-4">
          {sidebar ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
              <div className="min-w-0">{children}</div>
              <aside className="lg:border-base-300 lg:border-l lg:pl-6">
                {sidebar}
              </aside>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </dialog>
  );
});
