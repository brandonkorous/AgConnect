import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getEmployerProfile } from '@/lib/api/employer';
import { ProfileEditor } from '@/components/employer/ProfileEditor';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.profile' });
  return { title: `AgConn — ${t('title')}` };
}

export default async function EmployerProfilePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.profile' });
  const profile = await getEmployerProfile();

  return (
    <div className="px-8 pb-16 pt-8">
      <div className="mb-6">
        <h1 className="font-display text-4xl font-light leading-tight tracking-tight">
          {t('title')}
        </h1>
        <p className="text-base-content/70 mt-2 max-w-2xl text-sm">{t('subtitle')}</p>
      </div>

      <div className="mx-auto max-w-2xl">
        <ProfileEditor
          initial={{
            legalName: profile?.legalName ?? '',
            dbaName: profile?.dbaName ?? '',
            flcLicenseNum: profile?.flcLicenseNum ?? '',
            ein: profile?.ein ?? '',
            county: profile?.county ?? '',
            contactEmail: profile?.contactEmail ?? '',
            contactPhone: profile?.contactPhone ?? '',
            licenseType: (profile?.licenseType ?? 'grower') as 'grower' | 'flc',
          }}
        />
      </div>
    </div>
  );
}
