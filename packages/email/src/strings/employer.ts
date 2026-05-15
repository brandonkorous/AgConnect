import type { Locale } from './waitlist.js';
import type { EmployerEmailTemplate } from '../queue.js';

export type EmployerEmailCopy = {
    subject: string;
    preheader: string;
    heading: string;
    intro: string;
    body: string[];
    cta?: { label: string; pathByLocale: { en: string; es: string } };
    signoff: string;
};

type Vars = Record<string, string | number | null | undefined>;

function fmt(template: string, vars: Vars): string {
    return template.replace(/\{(\w+)\}/g, (_, k) => {
        const v = vars[k];
        return v === undefined || v === null ? '' : String(v);
    });
}

const COPY: Record<EmployerEmailTemplate, Record<Locale, EmployerEmailCopy>> = {
    'employer.flc_pending': {
        en: {
            subject: "We're verifying your AGCONN employer account",
            preheader: "We'll verify your business within 1 business day.",
            heading: 'Thanks for joining AGCONN',
            intro:
                "We received your business details for {legalName}. Our team is reviewing them now and will email you when verification is complete.",
            body: [
                "While you wait, you can prepare job posting drafts — just sign in and head to Jobs.",
                "Verification typically takes less than 1 business day. We'll email you the moment your account is ready.",
            ],
            cta: { label: 'Go to dashboard', pathByLocale: { en: '/en/employer/dashboard', es: '/es/employer/dashboard' } },
            signoff: '— The AGCONN team',
        },
        es: {
            subject: 'Estamos verificando tu cuenta de empleador de AGCONN',
            preheader: 'Verificaremos tu negocio en 1 día hábil.',
            heading: 'Gracias por unirte a AGCONN',
            intro:
                'Recibimos los datos de tu negocio para {legalName}. Nuestro equipo los está revisando y te enviaremos un correo cuando la verificación esté lista.',
            body: [
                'Mientras tanto, puedes preparar borradores de publicaciones de trabajo. Inicia sesión y ve a Trabajos.',
                'La verificación toma menos de 1 día hábil. Te avisaremos por correo en cuanto tu cuenta esté lista.',
            ],
            cta: { label: 'Ir al panel', pathByLocale: { en: '/en/employer/dashboard', es: '/es/employer/dashboard' } },
            signoff: '— El equipo de AGCONN',
        },
    },
    'employer.flc_verified': {
        en: {
            subject: 'Your AGCONN account is verified',
            preheader: 'You can now publish job postings.',
            heading: "You're verified",
            intro: '{legalName} is now verified. You can publish job postings and start receiving applicants.',
            body: [
                "You're on the {plan} plan. Upgrade any time for unlimited postings and worker search.",
            ],
            cta: { label: 'Create your first posting', pathByLocale: { en: '/en/employer/jobs/new', es: '/es/employer/jobs/new' } },
            signoff: '— The AGCONN team',
        },
        es: {
            subject: 'Tu cuenta de AGCONN está verificada',
            preheader: 'Ya puedes publicar trabajos.',
            heading: 'Estás verificado',
            intro: '{legalName} ya está verificado. Puedes publicar trabajos y recibir aplicantes.',
            body: [
                'Estás en el plan {plan}. Mejora tu plan en cualquier momento para publicaciones ilimitadas y búsqueda de trabajadores.',
            ],
            cta: { label: 'Crear tu primer trabajo', pathByLocale: { en: '/en/employer/jobs/new', es: '/es/employer/jobs/new' } },
            signoff: '— El equipo de AGCONN',
        },
    },
    'employer.flc_rejected': {
        en: {
            subject: 'Action needed: verify your AGCONN account',
            preheader: 'We need a little more information.',
            heading: 'Verification needs follow-up',
            intro: "We couldn't verify your business with the information provided.",
            body: [
                'Reason: {reason}',
                'Please update your information and we will review again. Reply to this email if you have questions — a real person reads every reply.',
            ],
            cta: { label: 'Update business info', pathByLocale: { en: '/en/employer/profile', es: '/es/employer/profile' } },
            signoff: '— The AGCONN team',
        },
        es: {
            subject: 'Acción requerida: verifica tu cuenta de AGCONN',
            preheader: 'Necesitamos un poco más de información.',
            heading: 'La verificación necesita seguimiento',
            intro: 'No pudimos verificar tu negocio con la información proporcionada.',
            body: [
                'Motivo: {reason}',
                'Actualiza tu información y revisaremos de nuevo. Responde este correo si tienes preguntas — una persona real lee cada respuesta.',
            ],
            cta: { label: 'Actualizar información', pathByLocale: { en: '/en/employer/profile', es: '/es/employer/profile' } },
            signoff: '— El equipo de AGCONN',
        },
    },
    'employer.billing.subscription_started': {
        en: {
            subject: 'Welcome to AGCONN {plan}',
            preheader: 'Your subscription is active.',
            heading: 'Your subscription is active',
            intro: "You're now on the {plan} plan, billed {interval}.",
            body: [
                'You can manage your subscription, payment methods, and invoices any time from your billing page.',
            ],
            cta: { label: 'Manage billing', pathByLocale: { en: '/en/employer/billing', es: '/es/employer/billing' } },
            signoff: '— The AGCONN team',
        },
        es: {
            subject: 'Bienvenido a AGCONN {plan}',
            preheader: 'Tu suscripción está activa.',
            heading: 'Tu suscripción está activa',
            intro: 'Estás en el plan {plan}, con facturación {interval}.',
            body: [
                'Puedes gestionar tu suscripción, métodos de pago y facturas en cualquier momento desde tu página de facturación.',
            ],
            cta: { label: 'Gestionar facturación', pathByLocale: { en: '/en/employer/billing', es: '/es/employer/billing' } },
            signoff: '— El equipo de AGCONN',
        },
    },
    'employer.billing.subscription_canceled': {
        en: {
            subject: 'Your AGCONN subscription was canceled',
            preheader: "You're back on the Free plan.",
            heading: 'Your subscription was canceled',
            intro: "You're now on the Free plan. Existing job postings stay live until they close.",
            body: [
                'You can resubscribe any time without losing your account history.',
            ],
            cta: { label: 'Resubscribe', pathByLocale: { en: '/en/employer/billing', es: '/es/employer/billing' } },
            signoff: '— The AGCONN team',
        },
        es: {
            subject: 'Tu suscripción de AGCONN fue cancelada',
            preheader: 'Volviste al plan Gratis.',
            heading: 'Tu suscripción fue cancelada',
            intro: 'Volviste al plan Gratis. Tus publicaciones existentes siguen activas hasta que cierren.',
            body: [
                'Puedes volver a suscribirte cuando quieras sin perder el historial de tu cuenta.',
            ],
            cta: { label: 'Resuscribirme', pathByLocale: { en: '/en/employer/billing', es: '/es/employer/billing' } },
            signoff: '— El equipo de AGCONN',
        },
    },
    'employer.billing.payment_failed': {
        en: {
            subject: 'Payment failed for your AGCONN subscription',
            preheader: 'Update your payment method to keep posting.',
            heading: 'Payment failed',
            intro: "We couldn't charge your card for ${amount}.",
            body: [
                'Update your payment method to keep your subscription active. We will retry automatically over the next few days.',
            ],
            cta: { label: 'Update payment', pathByLocale: { en: '/en/employer/billing', es: '/es/employer/billing' } },
            signoff: '— The AGCONN team',
        },
        es: {
            subject: 'Falló el pago de tu suscripción de AGCONN',
            preheader: 'Actualiza tu método de pago para seguir publicando.',
            heading: 'Falló el pago',
            intro: 'No pudimos cobrar a tu tarjeta ${amount}.',
            body: [
                'Actualiza tu método de pago para mantener tu suscripción activa. Reintentaremos automáticamente los próximos días.',
            ],
            cta: { label: 'Actualizar pago', pathByLocale: { en: '/en/employer/billing', es: '/es/employer/billing' } },
            signoff: '— El equipo de AGCONN',
        },
    },
    'employer.application_withdrawn': {
        en: {
            subject: 'Applicant withdrew their application',
            preheader: 'A worker withdrew from {jobTitle}.',
            heading: 'An applicant withdrew',
            intro: 'A worker withdrew their application for {jobTitle}.',
            body: [
                'You can review your remaining applicants from your dashboard.',
            ],
            cta: {
                label: 'Open applicants',
                pathByLocale: {
                    en: '/en/employer/applications',
                    es: '/es/employer/applications',
                },
            },
            signoff: '— The AGCONN team',
        },
        es: {
            subject: 'Un aplicante retiró su solicitud',
            preheader: 'Un trabajador retiró su aplicación para {jobTitle}.',
            heading: 'Un aplicante se retiró',
            intro: 'Un trabajador retiró su aplicación para {jobTitle}.',
            body: [
                'Puedes revisar a los aplicantes restantes desde tu panel.',
            ],
            cta: {
                label: 'Ver aplicantes',
                pathByLocale: {
                    en: '/en/employer/applications',
                    es: '/es/employer/applications',
                },
            },
            signoff: '— El equipo de AGCONN',
        },
    },
    'employer.billing.invoice_paid': {
        en: {
            subject: 'Receipt: ${amount} paid',
            preheader: 'Thanks for your payment.',
            heading: 'Payment received',
            intro: "We received ${amount}. Your invoice is attached below.",
            body: [
                'View or download your invoice any time.',
            ],
            cta: { label: 'View invoice', pathByLocale: { en: '/en/employer/billing', es: '/es/employer/billing' } },
            signoff: '— The AGCONN team',
        },
        es: {
            subject: 'Recibo: ${amount} pagados',
            preheader: 'Gracias por tu pago.',
            heading: 'Pago recibido',
            intro: 'Recibimos ${amount}. Tu factura está disponible abajo.',
            body: [
                'Consulta o descarga tu factura cuando quieras.',
            ],
            cta: { label: 'Ver factura', pathByLocale: { en: '/en/employer/billing', es: '/es/employer/billing' } },
            signoff: '— El equipo de AGCONN',
        },
    },
};

export function getEmployerCopy(
    template: EmployerEmailTemplate,
    locale: Locale,
    vars: Vars,
): EmployerEmailCopy {
    const raw = COPY[template][locale];
    return {
        subject: fmt(raw.subject, vars),
        preheader: fmt(raw.preheader, vars),
        heading: fmt(raw.heading, vars),
        intro: fmt(raw.intro, vars),
        body: raw.body.map((b) => fmt(b, vars)),
        cta: raw.cta,
        signoff: raw.signoff,
    };
}
