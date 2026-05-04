type Props = {
  id: string;
  title: string;
  sub?: string;
  children: React.ReactNode;
};

// White card with hairline border + display heading + base-content/60 sub.
// Matches the edit-shift SectionCard so the two editors read as siblings.
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
