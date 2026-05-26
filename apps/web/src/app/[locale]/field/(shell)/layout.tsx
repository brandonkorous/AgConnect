import type { Metadata } from 'next';
import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { requireRole, UserRole } from '@/lib/auth/role';
import { FieldHeader } from '@/components/field/FieldHeader';
import { FieldBottomNav } from '@/components/field/FieldBottomNav';
import { SwitchToFullView } from '@/components/field/SwitchToFullView';

type Props = {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'worker.field.meta' });
    return {
        title: t('title'),
        description: t('description'),
    };
}

export default async function FieldLayout({ children, params }: Props) {
    const { locale } = await params;
    // Auth + onboarded gate. The /field/onboarding sibling lives OUTSIDE this
    // (shell) route group so un-onboarded workers don't bounce through here.
    // See docs/10-worker/99-field-mode.md § Invariants.
    const { onboarded } = await requireRole(locale, UserRole.worker);
    if (!onboarded) {
        redirect(`/${locale}/field/onboarding` as Route);
    }
    return (
        <div className="bg-base-200 min-h-screen">
            <FieldHeader locale={locale} />
            <main className="mx-auto max-w-md px-4 pb-32 pt-4">
                {children}
                <SwitchToFullView locale={locale} />
            </main>
            <FieldBottomNav locale={locale} />
        </div>
    );
}
