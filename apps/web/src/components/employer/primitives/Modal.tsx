'use client';

import { useEffect, useId, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

type Props = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Optional right-rail content (e.g., compliance instructions). When set on
   * `xl` size, the modal renders form/content on the left and the sidebar on
   * the right (60/40 split). On narrower viewports the sidebar collapses
   * below the main content.
   */
  sidebar?: React.ReactNode;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ title, children, onClose, size = 'md', sidebar }: Props) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  // ─── Mount: capture prior focus, lock body scroll, focus first element.
  // Unmount: restore. Effect deps intentionally empty — runs once per modal.
  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusFirst = () => {
      const el = dialogRef.current;
      if (!el) return;
      const focusable = el.querySelectorAll<HTMLElement>(FOCUSABLE);
      const target = focusable[0];
      if (target) target.focus();
      else el.focus(); // fallback to dialog itself (tabIndex=-1)
    };
    // Defer to next frame so refs/portals are settled.
    const raf = requestAnimationFrame(focusFirst);

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      const prev = previouslyFocused.current;
      if (prev instanceof HTMLElement) prev.focus();
    };
  }, []);

  // ─── Keyboard: ESC closes, Tab/Shift-Tab traps focus inside the dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const el = dialogRef.current;
      if (!el) return;
      const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => !n.hasAttribute('disabled') && n.offsetParent !== null,
      );
      if (focusable.length === 0) {
        e.preventDefault();
        el.focus();
        return;
      }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !el.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const sizeClass =
    size === 'sm'
      ? 'max-w-sm'
      : size === 'lg'
        ? 'max-w-2xl'
        : size === 'xl'
          ? 'max-w-5xl'
          : 'max-w-[560px]'; // brand default per docs/brand/06-components.md

  return (
    <div
      // Per brand: backdrop is neutral @ 60%.
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={[
          'bg-base-100 w-full rounded-2xl p-8 max-h-[90vh] overflow-y-auto outline-none',
          // Brand shadow token (see globals.css / docs/brand/04-spacing-layout.md)
          'shadow-[var(--shadow-pop)]',
          sizeClass,
        ].join(' ')}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2
            id={titleId}
            className="font-display text-2xl font-semibold tracking-tight tabular-nums slashed-zero"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-base-content/50 hover:text-base-content focus-visible:ring-primary focus-visible:ring-2 grid h-11 w-11 shrink-0 place-items-center rounded-full"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>
        {sidebar ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
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
  );
}
