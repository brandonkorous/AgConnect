import { FieldApplyClient } from './FieldApplyClient';
import { getSmsApplyNumber, getSmsApplyKeyword } from '@/lib/sms-apply';

type Props = { params: Promise<{ locale: string }> };

export default async function FieldApplyPage({ params }: Props) {
  const { locale } = await params;
  const smsNumber = getSmsApplyNumber();
  const smsApply = smsNumber
    ? { number: smsNumber, keyword: getSmsApplyKeyword() }
    : null;
  return <FieldApplyClient locale={locale} smsApply={smsApply} />;
}
