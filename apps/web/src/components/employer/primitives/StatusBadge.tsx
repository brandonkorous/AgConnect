type StatusKey =
    | 'draft'
    | 'active'
    | 'live'
    | 'closed'
    | 'filled'
    | 'pending'
    | 'verified'
    | 'rejected'
    | 'urgent'
    | 'soon'
    | 'ok'
    | 'warn';

type StatusBadgeProps = {
    status: StatusKey;
    label: string;
    className?: string;
};

const VARIANT: Record<StatusKey, string> = {
    draft: 'badge-warning badge-soft',
    pending: 'badge-warning badge-soft',
    warn: 'badge-warning badge-soft',
    soon: 'badge-warning badge-soft',
    active: 'badge-success badge-soft',
    live: 'badge-success badge-soft',
    verified: 'badge-success badge-soft',
    ok: 'badge-success badge-soft',
    closed: 'badge-neutral badge-soft',
    filled: 'badge-neutral badge-soft',
    rejected: 'badge-error badge-soft',
    urgent: 'badge-error badge-soft',
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
    return (
        <span
            className={[
                'badge badge-sm',
                VARIANT[status],
                'font-mono text-[10px] font-bold uppercase tracking-wider',
                className ?? '',
            ].join(' ')}
        >
            {label}
        </span>
    );
}
