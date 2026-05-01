import { UtilityBar } from '@/components/landing/UtilityBar';
import { MarketingNav } from '@/components/landing/MarketingNav';
import { MarketingFooter } from '@/components/landing/MarketingFooter';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <UtilityBar />
            <MarketingNav />
            <main>{children}</main>
            <MarketingFooter />
        </>
    );
}
