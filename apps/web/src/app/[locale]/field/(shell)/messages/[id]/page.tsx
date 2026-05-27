import { FieldThreadClient } from './FieldThreadClient';

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function FieldThreadPage({ params }: Props) {
  const { locale, id } = await params;
  return <FieldThreadClient locale={locale} id={id} />;
}
