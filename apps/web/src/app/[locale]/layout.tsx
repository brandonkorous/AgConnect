import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { config as faConfig } from '@fortawesome/fontawesome-svg-core';
import { ClerkProvider } from '@clerk/nextjs';
import { routing } from '@/i18n/routing';
import { inter, interTight, dmMono } from '@/lib/fonts';
import { dataThemeFor, DEFAULT_THEME, themeInitScript } from '@/lib/theme';
import { AppShellProviders } from '@/components/app-shell/AppShellProviders';
import '../globals.css';
import '@fortawesome/fontawesome-svg-core/styles.css';

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function MaybeClerkProvider({ children }: { children: React.ReactNode }) {
    if (!clerkConfigured) return <>{children}</>;
    return <ClerkProvider>{children}</ClerkProvider>;
}

faConfig.autoAddCss = false;

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: 'AgConn',
    description: 'From the field, to your future.',
    manifest: '/manifest.webmanifest',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'AgConn',
    },
};

export const viewport: Viewport = {
    themeColor: '#A85A2A',
};

type Props = {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
    const { locale } = await params;
    if (!hasLocale(routing.locales, locale)) notFound();

    const messages = await getMessages();
    const fontVars = `${inter.variable} ${interTight.variable} ${dmMono.variable}`;

    return (
        <html
            lang={locale}
            data-theme={dataThemeFor(DEFAULT_THEME)}
            style={{ colorScheme: DEFAULT_THEME }}
            className={fontVars}
            suppressHydrationWarning
        >
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
            </head>
            <body className="bg-base-300 text-base-content antialiased">
                <MaybeClerkProvider>
                    <NextIntlClientProvider locale={locale} messages={messages}>
                        <AppShellProviders enablePwa={process.env.NODE_ENV === 'production'}>
                            {children}
                        </AppShellProviders>
                    </NextIntlClientProvider>
                </MaybeClerkProvider>
            </body>
        </html>
    );
}
