import { useTranslations } from 'next-intl';

export type AppStatus = 'applied' | 'reviewed' | 'hired' | 'rejected' | 'withdrawn';

const VARIANTS: Record<AppStatus, string> = {
  applied: 'bg-info/15 text-info',
  reviewed: 'bg-warning/20 text-warning-content',
  hired: 'bg-success/20 text-success',
  rejected: 'bg-base-300 text-base-content/70',
  withdrawn: 'bg-base-300 text-base-content/70',
};

export function StatusBadge({ status }: { status: AppStatus }) {
  const t = useTranslations('worker.application.status');
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${VARIANTS[status]}`}
    >
      {t(status)}
    </span>
  );
}
