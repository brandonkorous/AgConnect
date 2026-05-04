type Props = {
  id: string;
  title: string;
  sub?: string;
  children: React.ReactNode;
};

// Mirrors the design-template Section: white card, hairline border, 1rem
// rounded, display-font heading + base-content/60 mono eyebrow rule below.
export function SectionCard({ id, title, sub, children }: Props) {
  return (
    <section
      id={id}
      className="bg-base-100 border-base-300 mb-5 scroll-mt-24 rounded-2xl border p-6"
    >
      <header className="border-base-300 mb-5 border-b pb-4">
        <h2 className="font-display text-2xl font-light tracking-tight">{title}</h2>
        {sub && <p className="text-base-content/60 mt-1 text-sm">{sub}</p>}
      </header>
      {children}
    </section>
  );
}
