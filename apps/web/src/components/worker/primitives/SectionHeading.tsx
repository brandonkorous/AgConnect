type Props = {
  children: React.ReactNode;
  sub?: React.ReactNode;
  right?: React.ReactNode;
};

export function SectionHeading({ children, sub, right }: Props) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-serif text-[20px] font-normal leading-tight tracking-[-0.02em]">
          {children}
        </h2>
        {sub && (
          <div className="text-base-content/60 mt-0.5 text-[12px]">{sub}</div>
        )}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  );
}
