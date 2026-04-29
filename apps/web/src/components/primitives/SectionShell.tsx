type Props = {
  children: React.ReactNode;
  band?: 'bone' | 'sage' | 'moss' | 'ink';
  id?: string;
  className?: string;
};

const bandClass: Record<NonNullable<Props['band']>, string> = {
  bone: 'bg-bone text-ink',
  sage: 'bg-sage text-ink',
  moss: 'bg-moss text-bone',
  ink: 'bg-ink text-bone',
};

export function SectionShell({ children, band = 'bone', id, className = '' }: Props) {
  return (
    <section id={id} className={`${bandClass[band]} w-full`}>
      <div className={`mx-auto max-w-[1280px] px-5 py-16 md:px-8 md:py-20 lg:px-20 lg:py-24 ${className}`}>
        {children}
      </div>
    </section>
  );
}
