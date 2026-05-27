import { ProfileMainClient } from './ProfileMainClient';

type Props = { params: Promise<{ locale: string }> };

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  return <ProfileMainClient locale={locale} />;
}
