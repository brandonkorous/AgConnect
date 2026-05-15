import Link from 'next/link';
import type { Route } from 'next';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { Wordmark } from '@/components/primitives/Wordmark';

type Variant = 'worker' | 'employer' | 'sign_in';

type Props = {
    locale: string;
    variant: Variant;
    children: React.ReactNode;
};

export async function AuthSplitShell({ locale, variant, children }: Props) {
    const t = await getTranslations({ locale, namespace: `auth.pitch.${variant}` });
    const tShared = await getTranslations({ locale, namespace: 'auth.shared' });

    const isDark = variant === 'employer';

    return (
        <main className="bg-base-200 min-h-[100dvh]">
            <div className="grid grid-cols-1 min-h-[100dvh] lg:grid-cols-[minmax(0,46%)_minmax(0,54%)]">
                {/* ─────────────────── Pitch panel — civic-utilitarian, no hero metric */}
                <aside
                    className={[
                        'relative isolate flex flex-col justify-between overflow-hidden p-8 lg:p-14',
                        isDark
                            ? 'bg-base-content text-base-100'
                            : variant === 'sign_in'
                                ? 'bg-base-200'
                                : 'bg-primary/[0.06]',
                    ].join(' ')}
                >
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -z-10"
                        style={{
                            backgroundImage: isDark
                                ? 'radial-gradient(circle at 18% 12%, oklch(83% 0.13 88 / 0.14) 0%, transparent 55%), radial-gradient(circle at 90% 92%, oklch(67% 0.18 145 / 0.10) 0%, transparent 60%)'
                                : 'radial-gradient(circle at 12% 8%, oklch(83% 0.13 88 / 0.32) 0%, transparent 55%), radial-gradient(circle at 92% 96%, oklch(67% 0.18 145 / 0.18) 0%, transparent 60%)',
                        }}
                    />

                    <Link
                        href={`/${locale}`}
                        className="inline-flex items-center self-start no-underline"
                        aria-label="AGCONN"
                    >
                        <Wordmark size="lg" tone={isDark ? 'bone' : 'ink'} />
                    </Link>

                    {/* Hero block — typographic, not hero-metric. Asymmetric column. */}
                    <div className="my-auto max-w-md py-10 lg:py-12">
                        <p
                            className={[
                                'font-mono text-[10px] font-bold uppercase tracking-[0.22em]',
                                isDark ? 'text-accent' : 'text-primary',
                            ].join(' ')}
                        >
                            {t('eyebrow')}
                        </p>
                        <h2
                            className={[
                                'font-display mt-5 text-balance font-light leading-[1.05] tracking-tight',
                                variant === 'sign_in'
                                    ? 'text-5xl md:text-6xl'
                                    : 'text-4xl md:text-5xl',
                                isDark ? 'text-base-100' : 'text-base-content',
                            ].join(' ')}
                        >
                            {t('lead')}
                        </h2>

                        <ul className="mt-9 grid gap-3.5">
                            {(['p1', 'p2', 'p3'] as const).map((k) => (
                                <li key={k} className="flex items-start gap-3">
                                    <span
                                        className={[
                                            'mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded-full',
                                            isDark ? 'bg-accent/20 text-accent' : 'bg-primary/15 text-primary',
                                        ].join(' ')}
                                        aria-hidden
                                    >
                                        <FontAwesomeIcon icon={faCircleCheck} className="h-2.5 w-2.5" />
                                    </span>
                                    <span
                                        className={[
                                            'pt-px text-[14px] leading-relaxed',
                                            isDark ? 'text-base-100/80' : 'text-base-content/75',
                                        ].join(' ')}
                                    >
                                        {t(`proof.${k}`)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div
                        className={[
                            'flex flex-wrap items-center justify-between gap-4 text-[10px]',
                            isDark ? 'text-base-100/45' : 'text-base-content/45',
                        ].join(' ')}
                    >
                        <span className="font-mono uppercase tracking-[0.18em]">
                            {tShared('grant_aligned')}
                        </span>
                        <Link
                            href={`/${locale}`}
                            className={[
                                'inline-flex items-center gap-1.5 no-underline',
                                isDark
                                    ? 'text-base-100/70 hover:text-base-100'
                                    : 'text-base-content/70 hover:text-base-content',
                            ].join(' ')}
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
                            <span>{tShared('back_home')}</span>
                        </Link>
                    </div>
                </aside>

                {/* ─────────────────── Form panel — vertically centered, anchored */}
                <section className="relative flex flex-col">
                    {/* Mobile-only top header — matches MarketingNav padding + height */}
                    <div className="border-secondary/15 bg-base-100 w-full border-b lg:hidden">
                        <div className="flex h-16 items-center justify-between px-5 md:h-24 md:px-8">
                            <Link
                                href={`/${locale}`}
                                className="text-base-content inline-flex items-center no-underline"
                                aria-label="AGCONN"
                            >
                                <Wordmark size="lg" tone="ink" />
                            </Link>
                            <LocaleToggle locale={locale} variant={variant} />
                        </div>
                    </div>

                    {/* Desktop locale toggle floats top-right of form panel */}
                    <div className="absolute right-6 top-6 hidden lg:block">
                        <LocaleToggle locale={locale} variant={variant} />
                    </div>

                    <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-16">
                        <div className="mx-auto w-full max-w-[26rem]">{children}</div>
                    </div>
                </section>
            </div>
        </main>
    );
}

function LocaleToggle({ locale, variant }: { locale: string; variant: Variant }) {
    const enHref =
        variant === 'sign_in'
            ? '/en/sign-in'
            : variant === 'worker'
                ? '/en/worker/sign-up'
                : '/en/employer/sign-up';
    const esHref =
        variant === 'sign_in'
            ? '/es/sign-in'
            : variant === 'worker'
                ? '/es/worker/sign-up'
                : '/es/employer/sign-up';
    return (
        <div className="bg-base-100 border-base-300 inline-flex rounded-full border p-1 font-mono text-xs font-bold tracking-wider">
            <Link
                href={enHref as Route}
                prefetch={false}
                className={`rounded-full px-2.5 py-1 no-underline ${locale === 'en' ? 'bg-primary text-primary-content' : 'text-base-content/60'}`}
            >
                EN
            </Link>
            <Link
                href={esHref as Route}
                prefetch={false}
                className={`rounded-full px-2.5 py-1 no-underline ${locale === 'es' ? 'bg-primary text-primary-content' : 'text-base-content/60'}`}
            >
                ES
            </Link>
        </div>
    );
}
