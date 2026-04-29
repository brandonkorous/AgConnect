import { UtilityBar } from '@/components/landing/UtilityBar';
import { MarketingNav } from '@/components/landing/MarketingNav';
import { Hero } from '@/components/landing/Hero';
import { TrustStrip } from '@/components/landing/TrustStrip';
import { AudienceSplit } from '@/components/landing/AudienceSplit';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { EmployerShowcase } from '@/components/landing/EmployerShowcase';
import { VerificationSpotlight } from '@/components/landing/VerificationSpotlight';
import { BilingualSection } from '@/components/landing/BilingualSection';
import { ImpactNumbers } from '@/components/landing/ImpactNumbers';
import { FeaturedJobs } from '@/components/landing/FeaturedJobs';
import { FeaturedTraining } from '@/components/landing/FeaturedTraining';
import { Testimonials } from '@/components/landing/Testimonials';
import { Pricing } from '@/components/landing/Pricing';
import { Faq } from '@/components/landing/Faq';
import { FinalCta } from '@/components/landing/FinalCta';
import { MarketingFooter } from '@/components/landing/MarketingFooter';

export default function HomePage() {
  return (
    <>
      <UtilityBar />
      <MarketingNav />
      <main>
        <Hero />
        <TrustStrip />
        <AudienceSplit />
        <HowItWorks />
        <EmployerShowcase />
        <VerificationSpotlight />
        <BilingualSection />
        <ImpactNumbers />
        <FeaturedJobs />
        <FeaturedTraining />
        <Testimonials />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <MarketingFooter />
    </>
  );
}
