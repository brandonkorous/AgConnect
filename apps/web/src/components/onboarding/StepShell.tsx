import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Wordmark } from '@/components/primitives/Wordmark';
import { AccountChip } from '@/components/shell/AccountChip';

type Props = {
    step: number;
    total: number;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    locale: string;
};

export function StepShell({ step, total, title, subtitle, children, locale }: Props) {
    const t = useTranslations('worker.onboarding.shell');
    const tChip = useTranslations('worker.onboarding.account_chip');
    return (
        <div className="bg-base-200 min-h-screen">
            <header className="border-base-300 bg-base-100 border-b">
                <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-4">
                    <Link href={`/${locale}`} aria-label="AGCONN home" className="shrink-0">
                        <Wordmark size="sm" tone="ink" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div
                            className="text-base-content/60 text-xs font-mono"
                            aria-live="polite"
                        >
                            {t('progress', { step, total })}
                        </div>
                        <AccountChip
                            locale={locale}
                            labels={{
                                ariaLabel: tChip('aria_label'),
                                signedInAs: tChip('signed_in_as'),
                                signOut: tChip('sign_out'),
                            }}
                        />
                    </div>
                </div>
                <div className="bg-base-300/50 h-1 w-full">
                    <div
                        className="bg-primary h-1 transition-all"
                        style={{ width: `${(step / total) * 100}%` }}
                    />
                </div>
            </header>
            <main className="mx-auto max-w-2xl px-5 py-8 sm:py-12">
                <h1 className="font-serif text-3xl font-semibold sm:text-4xl">{title}</h1>
                {subtitle && (
                    <p className="text-base-content/70 mt-2 text-base">{subtitle}</p>
                )}
                <div className="mt-6">{children}</div>
            </main>
        </div>
    );
}
