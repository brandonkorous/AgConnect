import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { NewShiftForm } from '@/components/employer/crews/NewShiftForm';
import { listCrews } from '@/lib/api/employer-ops';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.crews.new_shift_form' });
  return { title: `AgConn — ${t('title')}` };
}

export default async function NewShiftPage({ params }: Props) {
  const { locale } = await params;
  const crews = await listCrews();
  return (
    <div className="px-5 md:px-8 lg:px-20 pb-16 pt-8">
      <NewShiftForm locale={locale} crews={crews.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
