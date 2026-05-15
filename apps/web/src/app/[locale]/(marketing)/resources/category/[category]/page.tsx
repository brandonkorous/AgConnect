import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faBookmark } from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { JsonLd } from '@/components/seo/JsonLd';
import { NestedBreadcrumb } from '@/components/seo/Breadcrumb';
import { marketingMetadata } from '@/lib/seo/metadata';
import { organizationJsonLd } from '@/lib/seo/json-ld';
import {
    RESOURCE_CATEGORIES,
    getResourcesByCategory,
} from '@/content/resources';
import { pickLocale, type ResourceCategory } from '@/content/types';

type Locale = 'en' | 'es';
type RouteProps = { params: Promise<{ locale: Locale; category: string }> };

export const dynamicParams = false;
export const revalidate = 86400;

function isResourceCategory(value: string): value is ResourceCategory {
    return (RESOURCE_CATEGORIES as readonly string[]).includes(value);
}

export function generateStaticParams() {
    return RESOURCE_CATEGORIES.flatMap((category) => [
        { locale: 'en', category },
        { locale: 'es', category },
    ]);
}

export async function generateMetadata({ params }: RouteProps) {
    const { locale, category } = await params;
    if (!isResourceCategory(category)) return {};
    const t = await getTranslations({ locale, namespace: 'marketing.resources' });
    const label = t(`categories.${category}.label`);
    const description = t(`preview.categories.${category}.body`);
    return marketingMetadata({
        locale,
        title: `${label} — AGCONN`,
        description,
        pathByLocale: (l) => `/${l}/resources/category/${category}`,
    });
}

export default async function ResourceCategoryPage({ params }: RouteProps) {
    const { locale, category } = await params;
    if (!isResourceCategory(category)) notFound();

    const t = await getTranslations({ locale, namespace: 'marketing.resources' });
    const articles = getResourcesByCategory(category);
    const otherCategories = RESOURCE_CATEGORIES.filter((c) => c !== category);
    const label = t(`categories.${category}.label`);
    const headline = t(`preview.categories.${category}.title`);
    const body = t(`preview.categories.${category}.body`);

    return (
        <>
            <JsonLd data={organizationJsonLd()} />
            <NestedBreadcrumb
                locale={locale}
                parentPath="/resources"
                leafName={label}
                leafPath={`/resources/category/${category}`}
            />

            <section className="bg-base-100 w-full">
                <div className="container mx-auto px-5 pt-20 pb-12 md:px-8 md:pt-24 md:pb-16 lg:px-20 lg:pt-32 lg:pb-20">
                    <Link
                        href={`/${locale}/resources`}
                        className="text-secondary hover:text-base-content mb-8 inline-flex items-center gap-2 font-sans text-sm font-medium"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                        <span>{t('category.back_all')}</span>
                    </Link>

                    <div className="flex flex-col gap-6 max-w-3xl">
                        <EyebrowLabel tone="soil" withRule>
                            {label}
                        </EyebrowLabel>
                        <h1 className="text-base-content font-serif text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
                            {headline}
                        </h1>
                        <p className="text-base-content max-w-prose font-sans text-lg leading-relaxed">
                            {body}
                        </p>
                        <p className="text-secondary font-mono text-xs uppercase tracking-[0.18em]">
                            {t('category.intro', { count: articles.length })}
                        </p>
                    </div>
                </div>
            </section>

            <section className="bg-base-100 w-full border-secondary/15 border-t">
                <div className="container mx-auto px-5 py-16 md:px-8 md:py-20 lg:px-20 lg:py-24">
                    {articles.length === 0 ? (
                        <p className="text-secondary font-sans text-base">{t('category.empty')}</p>
                    ) : (
                        <ul className="grid grid-cols-1 gap-px bg-secondary/15 md:grid-cols-2 lg:grid-cols-3">
                            {articles.map((a) => (
                                <li key={a.slug} className="bg-base-100">
                                    <Link
                                        href={`/${locale}/resources/${a.slug}`}
                                        className="group flex h-full flex-col gap-4 p-8 lg:p-10"
                                    >
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faBookmark} className="text-accent text-xs" />
                                            <span className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                                {t('card.minutes', { n: a.readingMinutes })}
                                            </span>
                                        </div>
                                        <h2 className="text-base-content font-serif text-xl font-medium leading-tight tracking-tight group-hover:text-primary transition-colors">
                                            {pickLocale(a.title, locale)}
                                        </h2>
                                        <p className="text-secondary font-sans text-sm leading-relaxed">
                                            {pickLocale(a.summary, locale)}
                                        </p>
                                        <span className="text-primary mt-auto inline-flex items-center gap-2 self-start border-secondary/30 border-t pt-4 font-sans text-sm font-semibold">
                                            <span>{t('card.read_article')}</span>
                                            <FontAwesomeIcon icon={faArrowRight} className="text-xs transition-transform group-hover:translate-x-1" />
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            <section className="bg-base-200 w-full border-secondary/15 border-t">
                <div className="container mx-auto flex flex-col gap-8 px-5 py-16 md:px-8 md:py-20 lg:px-20 lg:py-24">
                    <EyebrowLabel tone="soil" withRule>
                        {t('category.other_categories')}
                    </EyebrowLabel>
                    <ul className="grid grid-cols-1 gap-px bg-secondary/15 md:grid-cols-2">
                        {otherCategories.map((c) => (
                            <li key={c} className="bg-base-100">
                                <Link
                                    href={`/${locale}/resources/category/${c}`}
                                    className="group flex h-full flex-col gap-3 p-8 lg:p-10"
                                >
                                    <span className="text-accent font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                        {t(`categories.${c}.label`)}
                                    </span>
                                    <h3 className="text-base-content font-serif text-xl font-medium leading-tight tracking-tight group-hover:text-primary transition-colors">
                                        {t(`preview.categories.${c}.title`)}
                                    </h3>
                                    <span className="text-primary mt-auto inline-flex items-center gap-2 self-start font-sans text-sm font-semibold">
                                        <span>{t('card.read_article')}</span>
                                        <FontAwesomeIcon icon={faArrowRight} className="text-xs transition-transform group-hover:translate-x-1" />
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </>
    );
}
