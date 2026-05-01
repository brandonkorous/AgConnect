import * as React from 'react';
import { Heading, Section, Text } from '@react-email/components';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Footer } from '../components/Footer';
import { colors, fonts, labelStyle } from '../components/tokens';
import { waitlistStrings, type Locale } from '../strings/waitlist';

export type WaitlistWelcomeProps = {
  locale: Locale;
  homeUrl: string;
  unsubscribeUrl: string;
};

export function WaitlistWelcome({ locale, homeUrl, unsubscribeUrl }: WaitlistWelcomeProps) {
  const t = waitlistStrings[locale].welcome;
  const bullets = [t.bullet1, t.bullet2, t.bullet3];

  return (
    <Layout preview={t.preheader} locale={locale}>
      <Section style={{ paddingTop: 24 }}>
        <Text style={{ ...labelStyle, margin: '0 0 12px 0', color: colors.honey }}>
          {locale === 'es' ? 'CONFIRMADO' : 'CONFIRMED'}
        </Text>
        <Heading
          as="h1"
          style={{
            fontFamily: fonts.serif,
            fontStyle: 'italic',
            fontSize: '40px',
            lineHeight: 1.05,
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

      <Section style={{ padding: '0 0 24px 0' }}>
        <Text
          style={{
            fontFamily: fonts.serif,
            fontSize: '20px',
            lineHeight: 1.2,
            fontWeight: 500,
            color: colors.moss,
            margin: '0 0 12px 0',
          }}
        >
          {t.whatNext}
        </Text>
        {bullets.map((b, i) => (
          <Text
            key={i}
            style={{
              fontFamily: fonts.sans,
              fontSize: '15px',
              lineHeight: 1.55,
              color: colors.ink,
              margin: '0 0 10px 0',
              paddingLeft: '14px',
              borderLeft: `2px solid ${colors.honey}`,
            }}
          >
            {b}
          </Text>
        ))}
      </Section>

      <Section style={{ padding: '4px 0 8px 0' }}>
        <Button href={homeUrl}>{t.cta}</Button>
      </Section>

      <Section style={{ paddingTop: 24 }}>
        <Text
          style={{
            fontFamily: fonts.serif,
            fontStyle: 'italic',
            fontSize: '15px',
            color: colors.soil,
            margin: 0,
          }}
        >
          {t.signoff}
        </Text>
      </Section>

      <Footer locale={locale} unsubscribeUrl={unsubscribeUrl} />
    </Layout>
  );
}

WaitlistWelcome.PreviewProps = {
  locale: 'en',
  homeUrl: 'https://agconn.com/en',
  unsubscribeUrl: 'https://agconn.com/en/unsubscribe?token=preview',
} satisfies WaitlistWelcomeProps;

export default WaitlistWelcome;
