import type { Metadata } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { config as faConfig } from '@fortawesome/fontawesome-svg-core';
import { routing } from '@/i18n/routing';
import { fraunces, inter, dmMono } from '@/lib/fonts';
import '../globals.css';
import '@fortawesome/fontawesome-svg-core/styles.css';

faConfig.autoAddCss = false;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'AgConn',
  description: 'From the field, to your future.',
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
  const fontVars = `${fraunces.variable} ${inter.variable} ${dmMono.variable}`;

  return (
    <html lang={locale} data-theme="tierra-light" className={fontVars}>
      <body className="bg-base-100 text-base-content antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
