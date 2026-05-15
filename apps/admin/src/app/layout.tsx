import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { config as faConfig } from '@fortawesome/fontawesome-svg-core';
import { inter, interTight, dmMono } from '@/lib/fonts';
import {
    adminClerkPublishableKey,
    clerkConfigured,
} from '@/lib/clerk';
import './globals.css';
import '@fortawesome/fontawesome-svg-core/styles.css';

faConfig.autoAddCss = false;

function MaybeClerkProvider({ children }: { children: React.ReactNode }) {
    if (!clerkConfigured) return <>{children}</>;
    return (
        <ClerkProvider
            publishableKey={adminClerkPublishableKey}
            signInUrl="/sign-in"
            signInFallbackRedirectUrl="/"
            afterSignOutUrl="/sign-in"
            appearance={{
                elements:
                    process.env.NODE_ENV === 'production'
                        ? { developmentModeWarning: { display: 'none' } }
                        : undefined,
            }}
        >
            {children}
        </ClerkProvider>
    );
}

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_ADMIN_URL?.trim() || 'http://localhost:3100'),
    title: 'AGCONN Admin',
    description: 'Internal admin console.',
    robots: { index: false, follow: false },
};

export const viewport: Viewport = {
    themeColor: '#5B6E2E',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const fontVars = `${inter.variable} ${interTight.variable} ${dmMono.variable}`;

    return (
        <html lang="en" data-theme="tierra-light" style={{ colorScheme: 'light' }} className={fontVars}>
            <body className="bg-base-200 text-base-content antialiased">
                <MaybeClerkProvider>{children}</MaybeClerkProvider>
            </body>
        </html>
    );
}
