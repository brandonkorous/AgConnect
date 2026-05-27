import { ReuploadClient } from './ReuploadClient';

type Props = { params: Promise<{ locale: string }> };

export default async function ReuploadPage({ params }: Props) {
  const { locale } = await params;
  return <ReuploadClient locale={locale} />;
}
