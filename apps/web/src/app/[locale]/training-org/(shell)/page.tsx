import { redirect } from 'next/navigation';

type Props = { params: Promise<{ locale: string }> };

export default async function TrainingOrgIndex({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/training-org/programs`);
}
