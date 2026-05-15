import { getTranslations } from 'next-intl/server';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { marketingMetadata } from '@/lib/seo/metadata';
import { organizationJsonLd } from '@/lib/seo/json-ld';
import { LegalPageLayout } from '@/components/marketing/LegalPageLayout';

type Locale = 'en' | 'es';
type RouteProps = { params: Promise<{ locale: Locale }> };

export const dynamicParams = false;
export const revalidate = 86400;

const SECTION_IDS = [
    'eligibility',
    'account',
    'conduct',
    'content',
    'payment',
    'ip',
    'termination',
    'liability',
    'disputes',
    'changes',
    'general',
] as const;

export async function generateMetadata({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.terms' });
    return marketingMetadata({
        locale,
        title: t('meta.title'),
        description: t('meta.description'),
        pathByLocale: (l) => `/${l}/terms`,
    });
}

export default async function TermsPage({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.terms' });
    const legalT = await getTranslations({ locale, namespace: 'marketing.legal' });

    const sections = SECTION_IDS.map((id) => ({
        id,
        title: t(`toc.${id}`),
        body: t(`${id}.body`),
    }));

    return (
        <>
            <JsonLd data={organizationJsonLd()} />
            <Breadcrumb locale={locale} path="/terms" />

            <LegalPageLayout
                locale={locale}
                eyebrow={t('eyebrow')}
                headline={t('headline')}
                intro={t('intro')}
                sections={sections}
                lastUpdatedLabel={legalT('last_updated')}
                lastUpdatedDate="2026-05-09"
                placeholderNotice={legalT('placeholder_notice')}
                contactNote={legalT('contact')}
                sectionsLabel={legalT('sections_label')}
                seeContactsLabel={legalT('see_contacts')}
            />
        </>
    );
}
