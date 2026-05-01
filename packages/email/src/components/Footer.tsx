import * as React from 'react';
import { Hr, Link, Section, Text } from '@react-email/components';
import { colors, fonts, labelStyle } from './tokens';
import { waitlistStrings, type Locale } from '../strings/waitlist';

type Props = {
  locale: Locale;
  unsubscribeUrl: string;
};

export function Footer({ locale, unsubscribeUrl }: Props) {
  const t = waitlistStrings[locale].footer;
  return (
    <Section style={{ paddingTop: 32 }}>
      <Hr style={{ borderColor: colors.borderHairline, margin: '0 0 16px 0' }} />
      <Text
        style={{
          ...labelStyle,
          margin: '0 0 8px 0',
        }}
      >
        {t.brandLine}
      </Text>
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: '13px',
          lineHeight: 1.5,
          color: colors.soil,
          margin: '0 0 12px 0',
        }}
      >
        {t.unsubscribeReason}
      </Text>
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: '13px',
          lineHeight: 1.5,
          color: colors.soil,
          margin: 0,
        }}
      >
        {t.address} ·{' '}
        <Link href={unsubscribeUrl} style={{ color: colors.soil, textDecoration: 'underline' }}>
          {t.unsubscribe}
        </Link>
      </Text>
    </Section>
  );
}
