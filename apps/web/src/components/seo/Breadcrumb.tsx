import { JsonLd } from './JsonLd';
import { breadcrumbJsonLd, type BreadcrumbTrail } from '@/lib/seo/json-ld';
import { homeLabel, trailFor, nestedTrail } from '@/lib/seo/marketing-breadcrumbs';
import type { Locale } from '@/lib/seo/metadata';

type SimpleProps = { locale: Locale; path: string };
type TrailProps = { locale: Locale; trail: BreadcrumbTrail };
type NestedProps = {
    locale: Locale;
    parentPath: string;
    leafName: string;
    leafPath: string;
};

function emit(locale: Locale, trail: BreadcrumbTrail) {
    const fullTrail: BreadcrumbTrail = [
        { name: homeLabel(locale), path: '/' },
        ...trail,
    ];
    return <JsonLd data={breadcrumbJsonLd({ locale, trail: fullTrail })} />;
}

export function Breadcrumb(props: SimpleProps | TrailProps) {
    if ('path' in props) {
        return emit(props.locale, trailFor(props.path, props.locale));
    }
    return emit(props.locale, props.trail);
}

export function NestedBreadcrumb(props: NestedProps) {
    const trail = nestedTrail(props.parentPath, props.leafName, props.leafPath, props.locale);
    return emit(props.locale, trail);
}
