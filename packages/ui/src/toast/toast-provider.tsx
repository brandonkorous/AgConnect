'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { setToastPusher } from './singleton';
import type { ToastInput, ToastInstance, ToastPusher } from './types';

const DEFAULT_DURATION: Record<ToastInstance['variant'], number> = {
  success: 5000,
  info: 5000,
  warning: 6000,
  error: 8000,
};

const MAX_VISIBLE = 3;

const ToastContext = createContext<ToastPusher | null>(null);

export const useToast = (): ToastPusher => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast called outside <ToastProvider>');
  return ctx;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastInstance[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback<ToastPusher>((input: ToastInput) => {
    const now = Date.now();
    const duration = input.durationMs ?? DEFAULT_DURATION[input.variant];
    setItems((prev) => {
      if (input.dedupeKey) {
        const existing = prev.find((t) => t.dedupeKey === input.dedupeKey);
        if (existing) {
          return prev.map((t) =>
            t.id === existing.id
              ? { ...t, ...input, expiresAt: input.sticky ? Infinity : now + duration }
              : t,
          );
        }
      }
      idRef.current += 1;
      const next: ToastInstance = {
        ...input,
        id: idRef.current,
        expiresAt: input.sticky ? Infinity : now + duration,
        paused: false,
      };
      return [...prev, next];
    });
  }, []);

  useEffect(() => {
    setToastPusher(push);
    return () => setToastPusher(null);
  }, [push]);

  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setItems((prev) => prev.filter((t) => t.paused || t.expiresAt > now));
    }, 250);
    return () => clearInterval(interval);
  }, [items.length]);

  const setPaused = useCallback((id: number, paused: boolean) => {
    setItems((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        if (paused) return { ...t, paused: true };
        const remaining = t.expiresAt - Date.now();
        return { ...t, paused: false, expiresAt: Date.now() + Math.max(remaining, 1500) };
      }),
    );
  }, []);

  const visible = useMemo(() => items.slice(-MAX_VISIBLE), [items]);
  const overflow = items.length - visible.length;

  return (
    <ToastContext.Provider value={push}>
      {children}
      <ToastRegion items={visible} overflow={overflow} onDismiss={dismiss} setPaused={setPaused} />
    </ToastContext.Provider>
  );
}

type RegionProps = {
  items: ToastInstance[];
  overflow: number;
  onDismiss: (id: number) => void;
  setPaused: (id: number, paused: boolean) => void;
};

function ToastRegion({ items, overflow, onDismiss, setPaused }: RegionProps) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-4 pb-[max(env(safe-area-inset-bottom),1rem)] sm:right-4 sm:left-auto sm:items-end"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {items.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} setPaused={setPaused} />
      ))}
      {overflow > 0 && (
        <div className="pointer-events-auto bg-base-300 text-base-content rounded-box px-3 py-1 text-xs">
          +{overflow} more
        </div>
      )}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
  setPaused,
}: {
  toast: ToastInstance;
  onDismiss: () => void;
  setPaused: (id: number, paused: boolean) => void;
}) {
  const cls = {
    success: 'alert-success',
    info: 'alert-info',
    warning: 'alert-warning',
    error: 'alert-error',
  }[toast.variant];

  return (
    <div
      className={`alert ${cls} pointer-events-auto motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 w-full max-w-md shadow-lg`}
      role={toast.variant === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(toast.id, true)}
      onMouseLeave={() => setPaused(toast.id, false)}
      onFocus={() => setPaused(toast.id, true)}
      onBlur={() => setPaused(toast.id, false)}
    >
      <div className="flex-1">
        <div className="font-medium">{toast.title}</div>
        {toast.description && <div className="text-sm opacity-90">{toast.description}</div>}
      </div>
      {toast.action && (
        <button type="button" className="btn btn-sm btn-ghost" onClick={toast.action.onClick}>
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        className="btn btn-ghost btn-sm btn-square"
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{ minWidth: 44, minHeight: 44 }}
      >
        ×
      </button>
    </div>
  );
}
