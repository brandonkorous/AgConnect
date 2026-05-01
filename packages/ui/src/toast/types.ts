export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export type ToastInput = {
  variant: ToastVariant;
  title: string;
  description?: string;
  durationMs?: number;
  sticky?: boolean;
  action?: { label: string; onClick: () => void };
  dedupeKey?: string;
};

export type ToastInstance = ToastInput & {
  id: number;
  expiresAt: number;
  paused: boolean;
};

export type ToastPusher = (input: ToastInput) => void;
