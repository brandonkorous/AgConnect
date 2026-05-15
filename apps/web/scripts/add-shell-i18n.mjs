#!/usr/bin/env node
// One-shot: add shell.* and admin.audit.* namespaces to messages/{en,es}.json.
// Idempotent: re-running overwrites in place.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const messagesDir = join(here, '..', 'messages');

const adminActions = [
    'auth.login',
    'auth.logout',
    'auth.failed_login',
    'auth.role_changed',
    'worker.profile.updated',
    'worker.resume.uploaded',
    'worker.application.submitted',
    'worker.application.withdrawn',
    'employer.flc.submitted',
    'employer.flc.verified',
    'employer.flc.rejected',
    'job.posting.created',
    'job.posting.published',
    'job.posting.closed',
    'application.status.changed',
    'application.hired',
    'billing.subscription.created',
    'billing.subscription.canceled',
    'billing.payment.succeeded',
    'billing.payment.failed',
    'training.enrollment.created',
    'training.completion.recorded',
    'cert.issued',
    'cert.revoked',
    'tenant.created',
    'tenant.updated',
    'tenant.disabled',
    'tenant.restored',
    'admin.impersonation.started',
    'admin.impersonation.ended',
    'admin.user.deleted',
    'admin.data.exported',
    'admin.audit.redacted',
    'system.audit.retention.purged',
    'system.audit.verified',
    'system.audit.tamper_detected',
    'system.audit.breaker.recovered',
    'error.unhandled',
];

const adminActionDescriptionsEn = {
    'auth.login': { label: 'Logged in', description: 'Successful sign-in' },
    'auth.logout': { label: 'Logged out', description: 'Session ended' },
    'auth.failed_login': { label: 'Failed login', description: 'Sign-in attempt was rejected' },
    'auth.role_changed': { label: 'Role changed', description: 'A user role was modified' },
    'worker.profile.updated': { label: 'Profile updated', description: 'Worker edited their profile' },
    'worker.resume.uploaded': { label: 'Resume uploaded', description: 'Worker uploaded a resume' },
    'worker.application.submitted': { label: 'Application submitted', description: 'Worker applied to a job' },
    'worker.application.withdrawn': { label: 'Application withdrawn', description: 'Worker withdrew an application' },
    'employer.flc.submitted': { label: 'FLC license submitted', description: 'Employer submitted an FLC license' },
    'employer.flc.verified': { label: 'FLC license verified', description: 'Admin verified an FLC license' },
    'employer.flc.rejected': { label: 'FLC license rejected', description: 'Admin rejected an FLC license' },
    'job.posting.created': { label: 'Job posting created', description: 'Employer created a job posting' },
    'job.posting.published': { label: 'Job posting published', description: 'A draft posting went live' },
    'job.posting.closed': { label: 'Job posting closed', description: 'A posting was closed' },
    'application.status.changed': { label: 'Application status changed', description: 'Application moved stage' },
    'application.hired': { label: 'Worker hired', description: 'Application reached hired status' },
    'billing.subscription.created': { label: 'Subscription started', description: 'Stripe subscription created' },
    'billing.subscription.canceled': { label: 'Subscription canceled', description: 'Stripe subscription canceled' },
    'billing.payment.succeeded': { label: 'Payment succeeded', description: 'Stripe charged successfully' },
    'billing.payment.failed': { label: 'Payment failed', description: 'A Stripe charge failed' },
    'training.enrollment.created': { label: 'Training enrollment', description: 'Worker enrolled in a program' },
    'training.completion.recorded': { label: 'Training completed', description: 'Worker completed a program' },
    'cert.issued': { label: 'Certificate issued', description: 'AGCONN issued a certificate' },
    'cert.revoked': { label: 'Certificate revoked', description: 'A certificate was revoked' },
    'tenant.created': { label: 'Tenant created', description: 'A new tenant was provisioned' },
    'tenant.updated': { label: 'Tenant updated', description: 'Tenant settings or metadata changed' },
    'tenant.disabled': { label: 'Tenant disabled', description: 'Tenant was soft-deleted' },
    'tenant.restored': { label: 'Tenant restored', description: 'A previously disabled tenant was restored' },
    'admin.impersonation.started': { label: 'Impersonation started', description: 'Admin began impersonating a user' },
    'admin.impersonation.ended': { label: 'Impersonation ended', description: 'Admin ended an impersonation' },
    'admin.user.deleted': { label: 'User deleted', description: 'Admin deleted a user account' },
    'admin.data.exported': { label: 'Data exported', description: 'Admin exported a CSV / report' },
    'admin.audit.redacted': { label: 'Audit redacted', description: 'PII redacted from audit events' },
    'system.audit.retention.purged': { label: 'Retention purge', description: 'Nightly retention job removed expired events' },
    'system.audit.verified': { label: 'Audit verified', description: 'HMAC verification completed' },
    'system.audit.tamper_detected': { label: 'Tamper detected', description: 'HMAC mismatch found' },
    'system.audit.breaker.recovered': { label: 'Breaker recovered', description: 'Audit circuit breaker drained' },
    'error.unhandled': { label: 'Unhandled error', description: 'A request failed with an unhandled exception' },
};

// next-intl rejects keys containing "." (interprets them as nesting). Convert
// dotted action codes (auth.login) into nested objects (auth: { login: {} })
// so the viewer can resolve t(`action.${event.action}.label`) by walking the
// path. The DB stores the dotted code; the i18n shape mirrors it nested.
const nestActions = (entries) => {
    const out = {};
    for (const [code, value] of entries) {
        const parts = code.split('.');
        let cursor = out;
        for (let i = 0; i < parts.length - 1; i += 1) {
            const k = parts[i];
            if (typeof cursor[k] !== 'object' || cursor[k] === null) cursor[k] = {};
            cursor = cursor[k];
        }
        cursor[parts[parts.length - 1]] = value;
    }
    return out;
};

const adminActionDescriptionsEnNested = nestActions(
    Object.entries(adminActionDescriptionsEn),
);

const blankActions = nestActions(
    adminActions.map((a) => [a, { label: '', description: '' }]),
);

const shellEn = {
    error: {
        unauthenticated: { title: 'Please sign in', description: 'Your session expired.' },
        forbidden: { title: "You don't have access to that", description: '' },
        no_tenant: { title: 'Account not set up yet', description: 'Contact your administrator to finish onboarding.' },
        tenant_disabled: { title: 'This workspace is paused', description: 'Reach out to AGCONN support if this is unexpected.' },
        not_found: { title: "We couldn't find that", description: '' },
        validation_failed: { title: 'Please check the highlighted fields', description: '' },
        rate_limited: { title: 'Slow down a moment', description: "You're sending requests too quickly. Try again shortly." },
        conflict: { title: 'Something changed before you saved', description: 'Reload to see the latest version.' },
        internal_error: { title: 'Something went wrong on our end', description: "We've been notified. Try again in a minute." },
        service_unavailable: { title: 'A service is temporarily unavailable', description: 'Try again in a few minutes.' },
        offline: { title: "You're offline", description: "We'll keep trying when your connection returns." },
        aborted: { title: '', description: '' },
        confirmation_required: { title: 'Confirmation required', description: '' },
        audit_write_failed: { title: 'Action could not be recorded', description: '' },
    },
    validation: {
        invalid_type: 'This field is required.',
        invalid_string: 'Please enter a valid value.',
        too_small: 'Too short.',
        too_big: 'Too long.',
        invalid_email: 'Enter a valid email address.',
        invalid_url: 'Enter a valid web address.',
        invalid_date: 'Enter a valid date.',
        custom: 'Please review this field.',
    },
    toast: { region: 'Notifications' },
    modal: { confirm: 'Confirm', cancel: 'Cancel', close: 'Close' },
    form: { required_indicator: 'required', submit_default: 'Save', submitting: 'Saving…' },
    page_error: {
        '404': { title: "We couldn't find that page", description: 'The link may be old or the page may have moved.' },
        '500': { title: 'Something went wrong', description: "We've been notified. Please try again." },
        try_again: 'Try again',
        go_home: 'Back to home',
        error_id: 'Error ID: {id}',
    },
    install: {
        title: 'Install AGCONN on your phone',
        body: 'Open jobs and applications faster, with one tap from your home screen.',
        cta: 'Install',
        later: 'Maybe later',
        ios: {
            title: 'Add AGCONN to your home screen',
            body: 'Tap the share icon below, then choose "Add to Home Screen."',
            share_step: 'Tap the share icon',
            add_step: 'Tap "Add to Home Screen"',
        },
    },
    offline: {
        banner: "You're offline. Some features may not work.",
        page: {
            title: "You're offline",
            description: "Reconnect to load this page. Pages you've already visited stay available.",
            try_again: 'Try again',
        },
    },
    update: {
        title: 'A new version is ready',
        description: 'Refresh to get the latest improvements.',
        cta: 'Refresh',
    },
    empty: { generic: { title: 'Nothing here yet', description: '' } },
    consent: {
        title: 'Cookie preferences',
        body: "We use essential cookies so AGCONN works. With your consent, we also use analytics cookies to learn how the app is used and improve it. You can change this any time.",
        accept_all: 'Accept all',
        reject_non_essential: 'Only essentials',
        customize: 'Customize',
        save: 'Save preferences',
        privacy_link: 'Privacy policy',
        category: {
            essential: {
                label: 'Essential',
                description: 'Sign-in, security, and the audit log. Always on.',
            },
            functional: {
                label: 'Functional',
                description: 'Remembers your language and theme.',
            },
            analytics: {
                label: 'Analytics',
                description: 'Helps us understand which features matter and where workers get stuck.',
            },
            marketing: {
                label: 'Marketing',
                description: 'Lets us measure the effect of partner outreach. Off by default.',
            },
        },
    },
};

const shellEs = {
    error: {
        unauthenticated: { title: 'Inicia sesión por favor', description: 'Tu sesión expiró.' },
        forbidden: { title: 'No tienes acceso a eso', description: '' },
        no_tenant: { title: 'Tu cuenta aún no está lista', description: 'Contacta a tu administrador para terminar la configuración.' },
        tenant_disabled: { title: 'Este espacio de trabajo está pausado', description: 'Comunícate con soporte de AGCONN si esto es inesperado.' },
        not_found: { title: 'No encontramos eso', description: '' },
        validation_failed: { title: 'Revisa los campos marcados', description: '' },
        rate_limited: { title: 'Despacio un momento', description: 'Estás enviando solicitudes muy rápido. Intenta de nuevo en un momento.' },
        conflict: { title: 'Algo cambió antes de que guardaras', description: 'Recarga para ver la versión más reciente.' },
        internal_error: { title: 'Hubo un problema de nuestro lado', description: 'Ya nos enteramos. Vuelve a intentar en un minuto.' },
        service_unavailable: { title: 'Un servicio está temporalmente no disponible', description: 'Intenta de nuevo en unos minutos.' },
        offline: { title: 'Estás sin conexión', description: 'Seguiremos intentando cuando vuelva la señal.' },
        aborted: { title: '', description: '' },
        confirmation_required: { title: 'Se requiere confirmación', description: '' },
        audit_write_failed: { title: 'No se pudo registrar la acción', description: '' },
    },
    validation: {
        invalid_type: 'Este campo es obligatorio.',
        invalid_string: 'Ingresa un valor válido.',
        too_small: 'Demasiado corto.',
        too_big: 'Demasiado largo.',
        invalid_email: 'Ingresa un correo válido.',
        invalid_url: 'Ingresa una dirección web válida.',
        invalid_date: 'Ingresa una fecha válida.',
        custom: 'Revisa este campo.',
    },
    toast: { region: 'Notificaciones' },
    modal: { confirm: 'Confirmar', cancel: 'Cancelar', close: 'Cerrar' },
    form: { required_indicator: 'obligatorio', submit_default: 'Guardar', submitting: 'Guardando…' },
    page_error: {
        '404': { title: 'No encontramos esa página', description: 'El enlace puede ser antiguo o la página pudo haberse movido.' },
        '500': { title: 'Algo salió mal', description: 'Ya nos enteramos. Intenta de nuevo por favor.' },
        try_again: 'Intentar de nuevo',
        go_home: 'Volver al inicio',
        error_id: 'ID de error: {id}',
    },
    install: {
        title: 'Instala AGCONN en tu teléfono',
        body: 'Abre trabajos y aplicaciones más rápido, con un toque desde tu pantalla de inicio.',
        cta: 'Instalar',
        later: 'Quizás después',
        ios: {
            title: 'Agrega AGCONN a tu pantalla de inicio',
            body: 'Toca el icono de compartir abajo y elige "Agregar a inicio."',
            share_step: 'Toca el icono de compartir',
            add_step: 'Toca "Agregar a pantalla de inicio"',
        },
    },
    offline: {
        banner: 'Estás sin conexión. Algunas funciones pueden no funcionar.',
        page: {
            title: 'Estás sin conexión',
            description: 'Reconéctate para cargar esta página. Las páginas que ya viste siguen disponibles.',
            try_again: 'Intentar de nuevo',
        },
    },
    update: {
        title: 'Hay una versión nueva lista',
        description: 'Actualiza para obtener las últimas mejoras.',
        cta: 'Actualizar',
    },
    empty: { generic: { title: 'Nada por aquí todavía', description: '' } },
    consent: {
        title: 'Preferencias de cookies',
        body: 'Usamos cookies esenciales para que AGCONN funcione. Con tu consentimiento, también usamos cookies de análisis para entender cómo se usa la app y mejorarla. Puedes cambiar esto en cualquier momento.',
        accept_all: 'Aceptar todo',
        reject_non_essential: 'Solo esenciales',
        customize: 'Personalizar',
        save: 'Guardar preferencias',
        privacy_link: 'Política de privacidad',
        category: {
            essential: {
                label: 'Esenciales',
                description: 'Inicio de sesión, seguridad y el registro de auditoría. Siempre activos.',
            },
            functional: {
                label: 'Funcionales',
                description: 'Recuerda tu idioma y tema.',
            },
            analytics: {
                label: 'Análisis',
                description: 'Nos ayuda a entender qué funciones importan y dónde se atoran los trabajadores.',
            },
            marketing: {
                label: 'Marketing',
                description: 'Nos permite medir el efecto del trabajo con socios. Apagado por defecto.',
            },
        },
    },
};

const adminAuditEn = {
    page: { title: 'Audit log', subtitle: 'Every consequential action across this tenant' },
    filter: {
        tenant: { label: 'Tenant', placeholder: 'Select tenant' },
        actor: { label: 'Actor' },
        action: { label: 'Action', prefix_mode: 'Match prefix' },
        resource: { label: 'Resource' },
        outcome: { label: 'Outcome', success: 'Success', failure: 'Failure', both: 'All' },
        date: {
            label: 'Date range',
            preset: { '1h': 'Last hour', '24h': 'Last 24 hours', '7d': 'Last 7 days', '30d': 'Last 30 days', custom: 'Custom' },
        },
        correlation_id: { label: 'Correlation ID' },
        reset: 'Reset filters',
    },
    table: {
        column: { time: 'Time', action: 'Action', actor: 'Actor', resource: 'Resource', outcome: 'Outcome' },
        empty: { title: 'No events match your filters', description: 'Try widening the date range or removing a filter.' },
    },
    drawer: {
        section: { actor: 'Actor', resource: 'Resource', outcome: 'Outcome', correlation: 'Correlation', metadata: 'Metadata' },
        action: { view_correlation: 'View correlation timeline', view_actor: 'View actor timeline', copy_json: 'Copy as JSON', verify: 'Verify HMAC' },
        verified: { 'true': 'HMAC verified', 'false': 'HMAC mismatch — possible tampering' },
    },
    action: adminActionDescriptionsEnNested,
};

const adminAuditEsBlank = {
    page: { title: '', subtitle: '' },
    filter: {
        tenant: { label: '', placeholder: '' },
        actor: { label: '' },
        action: { label: '', prefix_mode: '' },
        resource: { label: '' },
        outcome: { label: '', success: '', failure: '', both: '' },
        date: {
            label: '',
            preset: { '1h': '', '24h': '', '7d': '', '30d': '', custom: '' },
        },
        correlation_id: { label: '' },
        reset: '',
    },
    table: {
        column: { time: '', action: '', actor: '', resource: '', outcome: '' },
        empty: { title: '', description: '' },
    },
    drawer: {
        section: { actor: '', resource: '', outcome: '', correlation: '', metadata: '' },
        action: { view_correlation: '', view_actor: '', copy_json: '', verify: '' },
        verified: { 'true': '', 'false': '' },
    },
    action: blankActions,
};

function patch(file, mutator) {
    const path = join(messagesDir, file);
    const obj = JSON.parse(readFileSync(path, 'utf8'));
    mutator(obj);
    writeFileSync(path, JSON.stringify(obj, null, 2) + '\n', 'utf8');
    console.log(`patched ${file}`);
}

patch('en.json', (m) => {
    m.shell = shellEn;
    m.admin = m.admin ?? {};
    m.admin.audit = adminAuditEn;
});

patch('es.json', (m) => {
    m.shell = shellEs;
    m.admin = m.admin ?? {};
    m.admin.audit = adminAuditEsBlank;
});
