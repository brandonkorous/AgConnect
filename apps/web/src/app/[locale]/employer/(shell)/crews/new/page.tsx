import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { NewCrewClient } from './NewCrewClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.crews.edit_crew' });
  return { title: `AGCONN — ${t('title_new_a')} ${t('title_new_b')}` };
}

export default function NewCrewRoute() {
  return <NewCrewClient />;
}
