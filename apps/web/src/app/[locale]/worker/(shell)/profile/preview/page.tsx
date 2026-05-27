import { ProfilePreviewClient } from './ProfilePreviewClient';

type Props = { params: Promise<{ locale: string }> };

export default async function PreviewAsEmployer({ params }: Props) {
  const { locale } = await params;
  return <ProfilePreviewClient locale={locale} />;
}
