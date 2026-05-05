import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { config as faConfig } from '@fortawesome/fontawesome-svg-core';
import { ClerkProvider } from '@clerk/nextjs';
import { esES, enUS } from '@clerk/localizations';
import { routing } from '@/i18n/routing';
import { inter, interTight, dmMono } from '@/lib/fonts';
import { dataThemeFor, DEFAULT_THEME, themeInitScript } from '@/lib/theme';
import { AppShellProviders } from '@/components/app-shell/AppShellProviders';
import '../globals.css';
import '@fortawesome/fontawesome-svg-core/styles.css';

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const isProd = process.env.NODE_ENV === 'production';

function MaybeClerkProvider({
    children,
    locale,
}: {
    children: React.ReactNode;
    locale: string;
}) {
    if (!clerkConfigured) return <>{children}</>;
    const localization = locale === 'es' ? esES : enUS;
    const hideDevBadge = isProd
        ? ({ developmentModeWarning: { display: 'none' } } as Record<string, unknown>)
        : undefined;
    return (
        <ClerkProvider
            localization={localization}
            appearance={hideDevBadge ? { elements: hideDevBadge } : undefined}
        >
            {children}
        </ClerkProvider>
    );
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
                <Script id="tierra-theme-init" strategy="beforeInteractive">
                    {themeInitScript}
                </Script>
            </head>
            <body className="bg-base-300 text-base-content antialiased">
                <MaybeClerkProvider locale={locale}>
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
