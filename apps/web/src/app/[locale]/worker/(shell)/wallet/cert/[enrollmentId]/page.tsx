import { CertPreviewClient } from './CertPreviewClient';

type Props = { params: Promise<{ locale: string; enrollmentId: string }> };

export default async function CertPreviewPage({ params }: Props) {
  const { locale, enrollmentId } = await params;
  return <CertPreviewClient locale={locale} enrollmentId={enrollmentId} />;
}
