import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function EmployerIndex({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/employer/dashboard`);
}
