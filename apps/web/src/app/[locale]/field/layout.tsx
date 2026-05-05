import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
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
