import { ProgramDetailClient } from './ProgramDetailClient';

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function ProgramDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  return <ProgramDetailClient locale={locale} slug={slug} />;
}
