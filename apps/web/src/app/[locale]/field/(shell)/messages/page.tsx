import { FieldMessagesClient } from './FieldMessagesClient';

type Props = { params: Promise<{ locale: string }> };

export default async function FieldMessagesPage({ params }: Props) {
  const { locale } = await params;
  return <FieldMessagesClient locale={locale} />;
}
