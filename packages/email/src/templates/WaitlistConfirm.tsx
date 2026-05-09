import * as React from 'react';
import { Heading, Link, Section, Text } from '@react-email/components';
import { Layout } from '../components/Layout.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';
import { colors, fonts, labelStyle } from '../components/tokens.js';
import { waitlistStrings, type Locale } from '../strings/waitlist.js';

export type WaitlistConfirmProps = {
  locale: Locale;
  confirmUrl: string;
  unsubscribeUrl: string;
};

export function WaitlistConfirm({ locale, confirmUrl, unsubscribeUrl }: WaitlistConfirmProps) {
  const t = waitlistStrings[locale].confirm;

  return (
    <Layout preview={t.preheader} locale={locale}>
      <Section style={{ paddingTop: 24 }}>
        <Text style={{ ...labelStyle, margin: '0 0 12px 0' }}>
          {locale === 'es' ? 'CONFIRMAR CORREO' : 'CONFIRM EMAIL'}
        </Text>
        <Heading
          as="h1"
          style={{
            fontFamily: fonts.serif,
            fontStyle: 'italic',
            fontSize: '34px',
            lineHeight: 1.1,
            fontWeight: 400,
            color: colors.ink,
            margin: '0 0 16px 0',
            letterSpacing: '-0.01em',
          }}
        >
          {t.greeting}
        </Heading>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: '16px',
            lineHeight: 1.55,
            color: colors.ink,
            margin: '0 0 24px 0',
          }}
        >
          {t.intro}
        </Text>
      </Section>

      <Section style={{ padding: '8px 0 24px 0' }}>
        <Button href={confirmUrl}>{t.cta}</Button>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: '13px',
            lineHeight: 1.5,
            color: colors.soil,
            margin: '16px 0 4px 0',
          }}
        >
          {t.expires}
        </Text>
      </Section>

      <Section
        style={{
          backgroundColor: colors.sage,
          padding: '20px',
          margin: '8px 0 0 0',
        }}
      >
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: '14px',
            lineHeight: 1.55,
            color: colors.ink,
            margin: 0,
          }}
        >
          {t.about}
        </Text>
      </Section>

      <Section style={{ paddingTop: 24 }}>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: '13px',
            lineHeight: 1.5,
            color: colors.soil,
            margin: '0 0 6px 0',
          }}
        >
          {t.ctaHelp}
        </Text>
        <Link
          href={confirmUrl}
          style={{
            fontFamily: fonts.sans,
            fontSize: '13px',
            color: colors.moss,
            wordBreak: 'break-all',
          }}
        >
          {confirmUrl}
        </Link>
      </Section>

      <Section style={{ paddingTop: 24 }}>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: '13px',
            lineHeight: 1.5,
            color: colors.soil,
            margin: 0,
          }}
        >
          {t.ignore}
        </Text>
      </Section>

      <Footer locale={locale} unsubscribeUrl={unsubscribeUrl} />
    </Layout>
  );
}

WaitlistConfirm.PreviewProps = {
  locale: 'en',
  confirmUrl: 'https://agconn.com/en/confirm?token=preview',
  unsubscribeUrl: 'https://agconn.com/en/unsubscribe?token=preview',
} satisfies WaitlistConfirmProps;

export default WaitlistConfirm;
