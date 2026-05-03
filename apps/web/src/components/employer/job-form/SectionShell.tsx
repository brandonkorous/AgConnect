// Visual frame for a numbered section. Accepts a step number (01..07) and a
// title + subtitle, then renders children inside a base-100 card with a
// dashed-rule header. daisyUI `card` base + Tailwind utilities only.

type Props = {
  num: number;
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function SectionShell({ num, id, title, subtitle, children }: Props) {
  return (
    <section
      id={id}
      className="card bg-base-100 border-base-300 mb-3.5 scroll-mt-24 border"
    >
      <div className="card-body p-6">
        <div className="border-base-300 mb-4 flex items-start gap-3.5 border-b border-dashed pb-3.5">
          <div className="bg-primary/10 text-primary grid h-8 w-8 shrink-0 place-items-center rounded-lg font-mono text-sm font-bold">
            {String(num).padStart(2, '0')}
          </div>
          <div>
            <h3 className="font-display text-xl font-normal tracking-tight">{title}</h3>
            {subtitle && (
              <p className="text-base-content/60 mt-0.5 text-sm">{subtitle}</p>
            )}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
