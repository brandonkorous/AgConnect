type Props = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  right?: React.ReactNode;
};

// Worker-page H1 block — matches the design's `PageHeader` (eyebrow in mono,
// display-font title, optional sub, optional right-aligned actions). Does
// NOT render the sidebar/topbar — that's the layout's job.
export function WorkerPageHeader({ eyebrow, title, sub, right }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <span className="text-base-content/60 font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">
            {eyebrow}
          </span>
        )}
        <h1 className="font-serif mt-2 text-[32px] font-normal leading-[1.05] tracking-[-0.025em] sm:text-[44px]">
          {title}
        </h1>
        {sub && (
          <p className="text-base-content/70 mt-1.5 max-w-[640px] text-[14.5px]">
            {sub}
          </p>
        )}
      </div>
      {right && <div className="flex shrink-0 gap-2">{right}</div>}
    </div>
  );
}
