import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EditShiftClient } from './EditShiftClient';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.crews.edit_shift' });
  return { title: `AGCONN — ${t('title')}` };
}

export default async function EditShiftRoute({ params }: Props) {
  const { id } = await params;
  return <EditShiftClient id={id} />;
}
