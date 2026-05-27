import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EditCrewClient } from './EditCrewClient';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.crews.edit_crew' });
  return { title: `AGCONN — ${t('breadcrumb_edit')}` };
}

export default async function EditCrewRoute({ params }: Props) {
  const { id } = await params;
  return <EditCrewClient id={id} />;
}
