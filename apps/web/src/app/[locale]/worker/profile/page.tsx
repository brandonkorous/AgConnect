import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';
import { ProfileEditor } from '@/components/profile/ProfileEditor';
import { fetchProfile } from '@/lib/api/profile';

type Props = { params: Promise<{ locale: string }> };

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.profile' });
  const initial = await fetchProfile();
  return (
    <div className="px-6 pb-16 pt-8 lg:px-8">
      <WorkerPageHeader
        title={t('title')}
        sub={t('subtitle')}
        right={
          <Link
            href={`/${locale}/worker/profile/preview`}
            className="border-base-300 inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-2.5 text-[13px] font-semibold"
          >
            {t('preview_as_employer')}
          </Link>
        }
      />
      <ProfileEditor locale={locale} initial={initial} />
    </div>
  );
}
