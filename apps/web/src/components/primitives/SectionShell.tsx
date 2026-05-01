type Props = {
    children: React.ReactNode;
    band?: 'bone' | 'sage' | 'moss' | 'ink';
    id?: string;
    className?: string;
};

const bandClass: Record<NonNullable<Props['band']>, string> = {
    bone: 'bg-base-100 text-base-content',
    sage: 'bg-base-300 text-base-content',
    moss: 'bg-primary text-primary-content',
    ink: 'bg-neutral text-neutral-content',
};

export function SectionShell({ children, band = 'bone', id, className = '' }: Props) {
    return (
        <section id={id} className={`${bandClass[band]} w-full`}>
            <div className={`mx-auto px-5 py-16 md:px-8 md:py-20 lg:px-20 lg:py-24 ${className}`}>
                {children}
            </div>
        </section>
    );
}
