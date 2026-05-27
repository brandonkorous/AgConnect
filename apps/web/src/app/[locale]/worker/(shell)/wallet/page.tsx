import { WalletClient } from './WalletClient';

type Props = { params: Promise<{ locale: string }> };

export default async function WalletPage({ params }: Props) {
  const { locale } = await params;
  return <WalletClient locale={locale} />;
}
