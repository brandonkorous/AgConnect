import { getTranslations } from 'next-intl/server';
import { Hero } from '@/components/landing/Hero';
import { TrustStrip } from '@/components/landing/TrustStrip';
import { AudienceSplit } from '@/components/landing/AudienceSplit';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { EmployerShowcase } from '@/components/landing/EmployerShowcase';
import { VerificationSpotlight } from '@/components/landing/VerificationSpotlight';
import { ImpactNumbers } from '@/components/landing/ImpactNumbers';
import { FeaturedJobs } from '@/components/landing/FeaturedJobs';
import { FeaturedTraining } from '@/components/landing/FeaturedTraining';
import { Testimonials } from '@/components/landing/Testimonials';
import { Pricing } from '@/components/landing/Pricing';
import { Faq } from '@/components/landing/Faq';
import { FinalCta } from '@/components/landing/FinalCta';
import { JsonLd } from '@/components/seo/JsonLd';
import { landingMetadata } from '@/lib/seo/metadata';
import {
    organizationJsonLd,
    websiteJsonLd,
    jobItemListJsonLd,
    trainingItemListJsonLd,
} from '@/lib/seo/json-ld';
import { getFeaturedJobs, getFeaturedTraining } from '@/lib/api/landing';

type Locale = 'en' | 'es';
type RouteProps = { params: Promise<{ locale: Locale }> };

export const revalidate = 300;

export async function generateMetadata({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'landing.hero' });
    const brandT = await getTranslations({ locale, namespace: 'brand' });
    const tagline = locale === 'es' ? 'Del campo, a tu futuro.' : 'From the field, to your future.';
    return landingMetadata({
        locale,
        title: `${brandT('product_name')} — ${tagline}`,
        description: t('subhead'),
    });
}

export default async function HomePage({ params }: RouteProps) {
    const { locale } = await params;
    const [jobs, programs] = await Promise.all([getFeaturedJobs(), getFeaturedTraining()]);
    return (
        <>
            <JsonLd data={organizationJsonLd()} />
            <JsonLd data={websiteJsonLd(locale)} />
            {jobs.length > 0 ? <JsonLd data={jobItemListJsonLd({ locale, jobs })} /> : null}
            {programs.length > 0 ? <JsonLd data={trainingItemListJsonLd({ locale, programs })} /> : null}
            <Hero />
            <TrustStrip />
            <AudienceSplit />
            <HowItWorks />
            <EmployerShowcase />
            <VerificationSpotlight />
            <ImpactNumbers />
            <FeaturedJobs />
            <Testimonials />
            <FeaturedTraining />
            <Pricing />
            <Faq />
            <FinalCta />
        </>
    );
}
