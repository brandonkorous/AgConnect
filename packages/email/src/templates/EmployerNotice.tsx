import * as React from 'react';
import { Heading, Section, Text } from '@react-email/components';
import { Layout } from '../components/Layout.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';
import { colors, fonts } from '../components/tokens.js';
import type { Locale } from '../strings/waitlist.js';
import type { EmployerEmailCopy } from '../strings/employer.js';

export type EmployerNoticeProps = {
    locale: Locale;
    copy: EmployerEmailCopy;
    ctaUrl?: string;
    unsubscribeUrl: string;
};

export function EmployerNotice({ locale, copy, ctaUrl, unsubscribeUrl }: EmployerNoticeProps) {
    return (
        <Layout preview={copy.preheader} locale={locale}>
            <Section style={{ paddingTop: 24 }}>
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
                    {copy.heading}
                </Heading>
                <Text style={paragraph}>{copy.intro}</Text>
                {copy.body.map((p, i) => (
                    <Text key={i} style={paragraph}>
                        {p}
                    </Text>
                ))}
            </Section>

            {copy.cta && ctaUrl && (
                <Section style={{ padding: '8px 0 24px 0' }}>
                    <Button href={ctaUrl}>{copy.cta.label}</Button>
                </Section>
            )}

            <Section style={{ paddingTop: 12 }}>
                <Text
                    style={{
                        ...paragraph,
                        color: colors.soil,
                        fontSize: '13px',
                    }}
                >
                    {copy.signoff}
                </Text>
            </Section>

            <Footer locale={locale} unsubscribeUrl={unsubscribeUrl} />
        </Layout>
    );
}

const paragraph = {
    fontFamily: fonts.sans,
    fontSize: '15px',
    lineHeight: 1.55,
    color: colors.ink,
    margin: '0 0 12px 0',
} as const;

EmployerNotice.PreviewProps = {
    locale: 'en',
    copy: {
        subject: 'Your AGCONN account is verified',
        preheader: 'You can now publish job postings.',
        heading: "You're verified",
        intro: 'Central Valley Farms is now verified. You can publish job postings.',
        body: ["You're on the Free plan."],
        cta: { label: 'Create your first posting', pathByLocale: { en: '/en/employer/jobs/new', es: '/es/employer/jobs/new' } },
        signoff: '— The AGCONN team',
    },
    ctaUrl: 'https://agconn.com/en/employer/jobs/new',
    unsubscribeUrl: 'https://agconn.com/en/unsubscribe?token=preview',
} satisfies EmployerNoticeProps;

export default EmployerNotice;
