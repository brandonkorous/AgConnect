import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';

type Tone = 'soil' | 'honey';

interface Props {
    eyebrow: string;
    headline: string;
    intro?: string;
    tone?: Tone;
    align?: 'split' | 'center';
    accent?: React.ReactNode;
}

export function MarketingPageHero({
    eyebrow,
    headline,
    intro,
    tone = 'soil',
    align = 'split',
    accent,
}: Props) {
    if (align === 'center') {
        return (
            <section className="bg-base-100 w-full">
                <div className="container mx-auto flex flex-col items-start gap-6 px-5 pt-20 pb-16 md:px-8 md:pt-24 md:pb-20 lg:px-20 lg:pt-32 lg:pb-24">
                    <EyebrowLabel tone={tone} withRule>
                        {eyebrow}
                    </EyebrowLabel>
                    <h1 className="text-base-content max-w-4xl font-serif text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-[80px]">
                        {headline}
                    </h1>
                    {intro ? (
                        <p className="text-base-content max-w-prose font-sans text-lg leading-relaxed">
                            {intro}
                        </p>
                    ) : null}
                    {accent}
                </div>
            </section>
        );
    }

    return (
        <section className="bg-base-100 w-full">
            <div className="container mx-auto px-5 pt-20 pb-16 md:px-8 md:pt-24 md:pb-20 lg:px-20 lg:pt-32 lg:pb-24">
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1fr)] lg:items-end lg:gap-20">
                    <div className="flex flex-col gap-6">
                        <EyebrowLabel tone={tone} withRule>
                            {eyebrow}
                        </EyebrowLabel>
                        <h1 className="text-base-content font-serif text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-[80px]">
                            {headline}
                        </h1>
                    </div>
                    <div className="flex flex-col gap-4 lg:pb-2">
                        {intro ? (
                            <p className="text-base-content max-w-prose font-sans text-lg leading-relaxed">
                                {intro}
                            </p>
                        ) : null}
                        {accent}
                    </div>
                </div>
            </div>
        </section>
    );
}
