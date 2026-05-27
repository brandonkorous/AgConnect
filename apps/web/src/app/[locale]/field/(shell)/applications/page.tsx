import { FieldApplicationsClient } from './FieldApplicationsClient';

type Props = { params: Promise<{ locale: string }> };

export default async function FieldApplicationsPage({ params }: Props) {
  const { locale } = await params;
  return <FieldApplicationsClient locale={locale} />;
}
