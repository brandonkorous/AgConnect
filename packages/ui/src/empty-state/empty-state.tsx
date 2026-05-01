export type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={`mx-auto flex w-full max-w-sm flex-col items-center gap-3 px-4 py-10 text-center ${className}`.trim()}
    >
      {icon && (
        <div className="text-base-content/50 text-3xl" aria-hidden>
          {icon}
        </div>
      )}
      <h3 className="text-base-content font-serif text-lg font-medium">{title}</h3>
      {description && <p className="text-base-content/70 text-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
