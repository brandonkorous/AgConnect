import { FieldTodayClient } from './FieldTodayClient';

type Props = { params: Promise<{ locale: string }> };

export default async function FieldTodayPage({ params }: Props) {
  const { locale } = await params;
  return <FieldTodayClient locale={locale} />;
}
