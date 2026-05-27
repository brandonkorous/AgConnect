import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FieldShellClient } from './FieldShellClient';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.field.meta' });
  return { title: t('title'), description: t('description') };
}

export default async function FieldLayout({ children, params }: Props) {
  const { locale } = await params;
  return <FieldShellClient locale={locale}>{children}</FieldShellClient>;
}
