import { EmployerShellClient } from './EmployerShellClient';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function EmployerLayout({ children, params }: Props) {
  const { locale } = await params;
  return <EmployerShellClient locale={locale}>{children}</EmployerShellClient>;
}
