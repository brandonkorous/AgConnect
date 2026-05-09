import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { colors, fonts, sizes } from './tokens.js';

type Props = {
  preview: string;
  locale: 'en' | 'es';
  children: React.ReactNode;
};

export function Layout({ preview, locale, children }: Props) {
  return (
    <Html lang={locale}>
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: colors.sage,
          fontFamily: fonts.sans,
          color: colors.ink,
          margin: 0,
          padding: '32px 16px',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <Container
          style={{
            maxWidth: sizes.containerWidth,
            margin: '0 auto',
            backgroundColor: colors.bone,
            border: `1px solid ${colors.borderHairline}`,
            padding: `${sizes.pagePadding}px`,
          }}
        >
          <Section style={{ paddingBottom: 8 }}>
            <Text
              style={{
                fontFamily: fonts.serif,
                fontStyle: 'italic',
                fontSize: '22px',
                lineHeight: 1.1,
                color: colors.moss,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              AgConn
            </Text>
          </Section>
          {children}
        </Container>
      </Body>
    </Html>
  );
}
