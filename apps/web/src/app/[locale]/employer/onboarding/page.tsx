import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { getTranslations } from 'next-intl/server';
import { OnboardingForm } from '@/components/employer/OnboardingForm';
import { Wordmark } from '@/components/primitives/Wordmark';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.onboarding' });
  return { title: t('title') };
}

export default async function EmployerOnboardingPage({ params }: Props) {
  const { locale } = await params;
  const altLocale = locale === 'es' ? 'en' : 'es';
  const altHref = `/${altLocale}/employer/onboarding` as Route;
  return (
    <main className="bg-base-200 relative isolate flex min-h-[100dvh] flex-col py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12% 8%, oklch(83% 0.13 88 / 0.18) 0%, transparent 55%), radial-gradient(circle at 92% 96%, oklch(67% 0.18 145 / 0.10) 0%, transparent 60%)',
        }}
      />

      <div className="container mx-auto flex flex-1 flex-col px-5 md:px-8 lg:px-20">
        <header className="mx-auto flex w-full max-w-xl items-center justify-between">
          <Link
            href={`/${locale}`}
            className="text-base-content no-underline"
            aria-label="AgConn"
          >
            <Wordmark size="sm" tone="ink" />
          </Link>
          <Link
            href={altHref}
            prefetch={false}
            className="bg-base-100 border-base-300 text-base-content/70 hover:text-base-content rounded-full border px-3 py-1 font-mono text-[11px] font-bold tracking-wider no-underline"
          >
            {altLocale.toUpperCase()}
          </Link>
        </header>

        <div className="mx-auto flex w-full max-w-xl flex-1 items-center justify-center py-6">
          <OnboardingForm locale={locale} />
        </div>
      </div>
    </main>
  );
}
