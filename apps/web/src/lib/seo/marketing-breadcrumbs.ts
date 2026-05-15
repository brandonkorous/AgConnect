import type { Locale } from './metadata';
import type { BreadcrumbTrail } from './json-ld';

type Label = Record<Locale, string>;

const HOME: Label = { en: 'Home', es: 'Inicio' };

const NODE: Record<string, Label> = {
    '/about': { en: 'About', es: 'Quiénes somos' },
    '/accessibility': { en: 'Accessibility', es: 'Accesibilidad' },
    '/careers': { en: 'Careers', es: 'Empleos' },
    '/contact': { en: 'Contact', es: 'Contacto' },
    '/employers': { en: 'For employers', es: 'Para empleadores' },
    '/faq': { en: 'FAQ', es: 'Preguntas' },
    '/how-it-works': { en: 'How it works', es: 'Cómo funciona' },
    '/impact': { en: 'Impact', es: 'Impacto' },
    '/partners': { en: 'Partners', es: 'Socios' },
    '/press': { en: 'Press', es: 'Prensa' },
    '/pricing': { en: 'Pricing', es: 'Precios' },
    '/privacy': { en: 'Privacy', es: 'Privacidad' },
    '/promotora': { en: 'Promotora program', es: 'Programa de promotoras' },
    '/resources': { en: 'Resources', es: 'Recursos' },
    '/skills-wallet': { en: 'Skills wallet', es: 'Cartera de habilidades' },
    '/sms-consent': { en: 'SMS consent', es: 'Consentimiento SMS' },
    '/sms-flyer': { en: 'SMS flyer', es: 'Volante SMS' },
    '/subprocessors': { en: 'Subprocessors', es: 'Subprocesadores' },
    '/terms': { en: 'Terms', es: 'Términos' },
    '/trust': { en: 'Trust', es: 'Confianza' },
    '/worker-rights': { en: 'Worker rights', es: 'Derechos del trabajador' },
    '/workers': { en: 'For workers', es: 'Para trabajadores' },
};

export function homeLabel(locale: Locale): string {
    return HOME[locale];
}

export function nodeLabel(path: string, locale: Locale): string | undefined {
    return NODE[path]?.[locale];
}

export function trailFor(path: string, locale: Locale): BreadcrumbTrail {
    const own = nodeLabel(path, locale);
    if (!own) return [];
    return [{ name: own, path }];
}

export function nestedTrail(
    parentPath: string,
    leafName: string,
    leafPath: string,
    locale: Locale,
): BreadcrumbTrail {
    const parent = nodeLabel(parentPath, locale);
    if (!parent) return [{ name: leafName, path: leafPath }];
    return [
        { name: parent, path: parentPath },
        { name: leafName, path: leafPath },
    ];
}
