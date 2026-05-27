import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faSeedling } from '@fortawesome/free-solid-svg-icons';
import { Wordmark } from '@/components/primitives/Wordmark';
import { AccountChip } from '@/components/shell/AccountChip';

type Audience = 'worker' | 'employer';

type Props = {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    locale: string;
    /** Defaults to 'worker' so existing /worker/onboarding pages keep working. */
    audience?: Audience;
    /** Multi-step wizards (worker) pass step+total to render a progress bar. */
    step?: number;
    total?: number;
};

export async function OnboardingSplitShell({
    title,
    subtitle,
    children,
    locale,
    audience = 'worker',
    step,
    total,
}: Props) {
    const tShell = await getTranslations({ locale, namespace: 'worker.onboarding.shell' });
    const tChip = await getTranslations({
        locale,
        namespace: `${audience}.onboarding.account_chip`,
    });
    const tPitch = await getTranslations({
        locale,
        namespace: `${audience}.onboarding.pitch`,
    });

    const showProgress = typeof step === 'number' && typeof total === 'number';

    return (
        <main className="bg-base-200 min-h-[100dvh]">
            <div className="grid grid-cols-1 min-h-[100dvh] lg:grid-cols-[minmax(0,46%)_minmax(0,54%)]">
                {/* ─────────────────── Pitch panel — supportive context, not metric */}
                <aside className="bg-primary/[0.06] relative isolate flex flex-col justify-between overflow-hidden p-8 lg:p-14">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -z-10"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 12% 8%, oklch(83% 0.13 88 / 0.32) 0%, transparent 55%), radial-gradient(circle at 92% 96%, oklch(67% 0.18 145 / 0.18) 0%, transparent 60%)',
                        }}
                    />

                    <Link
                        href={`/${locale}`}
                        className="inline-flex items-center self-start no-underline"
                        aria-label="AGCONN"
                    >
                        <Wordmark size="lg" tone="ink" />
                    </Link>

                    <div className="my-auto max-w-md py-10 lg:py-12">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                            {tPitch('eyebrow')}
                        </p>
                        <h2 className="font-display mt-5 text-balance font-light leading-[1.05] tracking-tight text-4xl md:text-5xl text-base-content">
                            {tPitch('lead')}
                        </h2>

                        <ul className="mt-9 grid gap-3.5">
                            {(['p1', 'p2', 'p3'] as const).map((k) => (
                                <li key={k} className="flex items-start gap-3">
                                    <span
                                        className="bg-primary/15 text-primary mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded-full"
                                        aria-hidden
                                    >
                                        <FontAwesomeIcon icon={faCircleCheck} className="h-2.5 w-2.5" />
                                    </span>
                                    <span className="text-base-content/75 pt-px text-[14px] leading-relaxed">
                                        {tPitch(`proof.${k}`)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="text-base-content/45 flex flex-wrap items-center justify-between gap-4 text-[10px]">
                        <span className="font-mono uppercase tracking-[0.18em]">
                            {tPitch('badge')}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-base-content/55">
                            <FontAwesomeIcon icon={faSeedling} className="h-3 w-3" />
                            <span>{tPitch('footer_note')}</span>
                        </span>
                    </div>
                </aside>

                {/* ─────────────────── Form panel — wizard column with progress + account */}
                <section className="bg-base-100 relative flex flex-col">
                    <header className="border-base-300 sticky top-0 z-10 border-b bg-base-100/95 backdrop-blur">
                        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-6 py-4 sm:px-10 lg:px-12">
                            <Link href={`/${locale}`} aria-label="AGCONN home" className="shrink-0 lg:hidden">
                                <Wordmark size="sm" tone="ink" />
                            </Link>
                            {showProgress ? (
                                <div
                                    className="text-base-content/60 text-xs font-mono"
                                    aria-live="polite"
                                >
                                    {tShell('progress', { step, total })}
                                </div>
                            ) : (
                                <span aria-hidden />
                            )}
                            <AccountChip
                                locale={locale}
                                labels={{
                                    ariaLabel: tChip('aria_label'),
                                    signedInAs: tChip('signed_in_as'),
                                    signOut: tChip('sign_out'),
                                    ...(audience === 'worker'
                                        ? {
                                              switchToField: tChip('switch_to_field'),
                                              switchToWorker: tChip('switch_to_worker'),
                                          }
                                        : {}),
                                }}
                            />
                        </div>
                        {showProgress && (
                            <div className="bg-base-300/50 h-1 w-full">
                                <div
                                    className="bg-primary h-1 transition-all"
                                    style={{ width: `${(step / total) * 100}%` }}
                                />
                            </div>
                        )}
                    </header>

                    <div className="flex flex-1 flex-col px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
                        <div className="mx-auto w-full max-w-xl">
                            <h1 className="font-serif text-3xl font-semibold sm:text-4xl">{title}</h1>
                            {subtitle && (
                                <p className="text-base-content/70 mt-2 text-base">{subtitle}</p>
                            )}
                            <div className="mt-8">{children}</div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
