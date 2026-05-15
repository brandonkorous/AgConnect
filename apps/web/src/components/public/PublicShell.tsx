import Link from 'next/link';
import { Wordmark } from '@/components/primitives/Wordmark';

type Props = {
    locale: string;
    title: React.ReactNode;
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg';
};

const widths = { sm: 'max-w-xl', md: 'max-w-3xl', lg: 'max-w-5xl' } as const;

// Minimal chrome for public, anonymous-browsable surfaces (training discovery,
// public certificate verification). No sidebar, no auth nav — just wordmark
// + an H1, sized to the content.
export function PublicShell({ locale, title, children, maxWidth = 'md' }: Props) {
    return (
        <div className="bg-base-100 min-h-screen">
            <header className="border-base-300 bg-base-100 border-b">
                <div className={`mx-auto flex items-center justify-between px-5 py-4 ${widths[maxWidth]}`}>
                    <Link href={`/${locale}`} aria-label="AGCONN home">
                        <Wordmark size="sm" tone="ink" />
                    </Link>
                </div>
            </header>
            <main className={`mx-auto px-5 py-8 sm:py-12 ${widths[maxWidth]}`}>
                <h1 className="font-serif text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
                    {title}
                </h1>
                <div className="mt-6">{children}</div>
            </main>
        </div>
    );
}
