// SMS template catalog — bilingual EN/ES, var-validated, category-typed.
//
// Each entry is the full message body (no separate subject), with `{var}`
// placeholders. The TS type `TemplateVars<T>` keeps callers honest: passing
// the wrong shape is a compile error. `category` is required on every entry
// (the TS shape enforces it) and drives the opt-out compliance lint in
// scripts/check-sms.mjs. The full catalog is the source of truth — see
// docs/00-foundation/05-sms-pipeline/06-messaging.md and
// docs/00-foundation/13-onboarding-identity-remediation/09-sms-standardization.md.

type Locale = 'en' | 'es';

// A2P 10DLC content classes:
//  - transactional: a direct response to a user-initiated action or a status
//    update on a thing the user explicitly engaged (application, training,
//    SMS reply). Opt-out language not required on each message.
//  - promotional: unsolicited / recurring outreach (job alerts, match
//    invitations, employer broadcasts). MUST carry opt-out language.
//  - compliance: the consent flow itself (double opt-in confirm/invalid).
//    MUST carry STOP/HELP per the campaign registration.
export type SmsCategory = 'transactional' | 'promotional' | 'compliance';

type TemplateDef<V extends readonly string[]> = {
    readonly en: string;
    readonly es: string;
    readonly vars: V;
    readonly category: SmsCategory;
    // Declared segment-budget override. The default budget is enforced by
    // scripts/check-sms.mjs; a template that legitimately exceeds it (a
    // mandated, unavoidably-long A2P disclosure) sets this so the exception
    // is explicit and reviewed, never silent.
    readonly maxSegments?: number;
};

const def = <V extends readonly string[]>(t: TemplateDef<V>): TemplateDef<V> => t;

export const smsTemplates = {
    welcome: def({
        en: 'Welcome to AGCONN, {firstName}! Search jobs at agconn.com/jobs. Reply STOP to opt out.',
        es: '¡Bienvenido a AGCONN, {firstName}! Busca trabajos en agconn.com/jobs. Responde STOP para cancelar.',
        vars: ['firstName'] as const,
        category: 'promotional',
    }),
    'application.applied': def({
        en: 'You applied for {jobTitle} at {employer}. Track at agconn.com/applications.',
        es: 'Aplicaste para {jobTitle} con {employer}. Sigue tu solicitud en agconn.com/applications.',
        vars: ['jobTitle', 'employer'] as const,
        category: 'transactional',
    }),
    'application.reviewed': def({
        en: '{employer} reviewed your application for {jobTitle}.',
        es: '{employer} revisó tu solicitud para {jobTitle}.',
        vars: ['jobTitle', 'employer'] as const,
        category: 'transactional',
    }),
    'application.hired': def({
        en: "Great news! You're hired for {jobTitle} at {employer}, starting {startDate}. They'll contact you.",
        es: '¡Buenas noticias! Te contrataron para {jobTitle} con {employer}, comenzando {startDate}. Te contactarán.',
        vars: ['jobTitle', 'employer', 'startDate'] as const,
        category: 'transactional',
    }),
    'application.rejected': def({
        en: '{employer} chose another candidate for {jobTitle}. Keep applying! agconn.com/jobs',
        es: '{employer} eligió a otro candidato para {jobTitle}. ¡Sigue aplicando! agconn.com/jobs',
        vars: ['jobTitle', 'employer'] as const,
        category: 'transactional',
    }),
    'job.alert': def({
        en: 'New {jobTitle} job in {county}: ${wageMin}-${wageMax}/hr. agconn.com/jobs/{slug} Reply STOP to opt out.',
        es: 'Nuevo trabajo de {jobTitle} en {county}: ${wageMin}-${wageMax}/hr. agconn.com/jobs/{slug} Responde STOP para cancelar.',
        vars: ['jobTitle', 'county', 'wageMin', 'wageMax', 'slug'] as const,
        category: 'promotional',
    }),
    'training.reminder.48h': def({
        en: 'Reminder: {programTitle} starts {startDate} at {startTime}. {location}',
        es: 'Recordatorio: {programTitle} empieza el {startDate} a las {startTime}. {location}',
        vars: ['programTitle', 'startDate', 'startTime', 'location'] as const,
        category: 'transactional',
    }),
    'training.reminder.2h': def({
        en: '{programTitle} starts in 2 hours at {location}. See you there!',
        es: '{programTitle} empieza en 2 horas en {location}. ¡Nos vemos!',
        vars: ['programTitle', 'location'] as const,
        category: 'transactional',
    }),
    'training.completed': def({
        en: 'Congrats! You completed {programTitle}. Download your certificate: {certUrl}',
        es: '¡Felicidades! Completaste {programTitle}. Descarga tu certificado: {certUrl}',
        vars: ['programTitle', 'certUrl'] as const,
        category: 'transactional',
    }),
    'worker.invitation': def({
        en: '{employer} invited you to apply for {jobTitle} (${wageMin}-${wageMax}/hr in {county}). View: agconn.com/invitations/{id} Reply STOP to opt out.',
        es: '{employer} te invitó a aplicar para {jobTitle} (${wageMin}-${wageMax}/hr en {county}). Ver: agconn.com/invitations/{id} Responde STOP para cancelar.',
        vars: ['employer', 'jobTitle', 'wageMin', 'wageMax', 'county', 'id'] as const,
        category: 'promotional',
    }),
    'application.withdrawn': def({
        en: 'Withdrew your application for {jobTitle} at {employer}. Browse more: agconn.com/jobs',
        es: 'Retiraste tu solicitud para {jobTitle} con {employer}. Ver más: agconn.com/jobs',
        vars: ['jobTitle', 'employer'] as const,
        category: 'transactional',
    }),
    'training.enrolled': def({
        en: "You're enrolled in {programTitle}. Starts {startDate} at {location}. We'll remind you 2 days before.",
        es: 'Estás inscrito en {programTitle}. Empieza el {startDate} en {location}. Te recordaremos 2 días antes.',
        vars: ['programTitle', 'startDate', 'location'] as const,
        category: 'transactional',
    }),
    'training.unenrolled': def({
        en: "You unenrolled from {programTitle}. Browse more programs: agconn.com/training",
        es: 'Cancelaste {programTitle}. Ver más programas: agconn.com/training',
        vars: ['programTitle'] as const,
        category: 'transactional',
    }),
    'training.canceled': def({
        en: '{programTitle} on {startDate} has been canceled. We refunded your spot — browse more programs: agconn.com/training',
        es: '{programTitle} del {startDate} fue cancelado. Liberamos tu lugar — ver más programas: agconn.com/training',
        vars: ['programTitle', 'startDate'] as const,
        category: 'transactional',
    }),
    'job.posting.edited': def({
        en: '{employer} updated {jobTitle} ({fields}). Review the new details: agconn.com/applications',
        es: '{employer} actualizó {jobTitle} ({fields}). Revisa los nuevos detalles: agconn.com/applications',
        vars: ['employer', 'jobTitle', 'fields'] as const,
        category: 'transactional',
    }),
    'job.match.invitation': def({
        en: 'New {jobTitle} match in {county}: ${wageMin}-${wageMax}/hr, starts {startDate}. Reply {keyword} to apply. Reply STOP to opt out.',
        es: 'Nuevo trabajo de {jobTitle} en {county}: ${wageMin}-${wageMax}/hr, empieza {startDate}. Responde {keyword} para aplicar. Responde STOP para cancelar.',
        vars: ['jobTitle', 'county', 'wageMin', 'wageMax', 'startDate', 'keyword'] as const,
        category: 'promotional',
    }),
    'sms.apply.confirmed': def({
        en: 'You applied for {jobTitle} at {employer}. Track at agconn.com/applications. Reply STOP to opt out.',
        es: 'Aplicaste para {jobTitle} con {employer}. Sigue en agconn.com/applications. Responde STOP para cancelar.',
        vars: ['jobTitle', 'employer'] as const,
        category: 'transactional',
    }),
    'sms.apply.unknown_keyword': def({
        en: "We couldn't find a job for '{keyword}'. Browse openings at agconn.com/jobs.",
        es: "No encontramos un trabajo con '{keyword}'. Busca en agconn.com/jobs.",
        vars: ['keyword'] as const,
        category: 'transactional',
    }),
    'worker.shift.updated': def({
        en: 'Shift updated: {shiftDate} at {startTime} · {location}. Open your AGCONN schedule for details.',
        es: 'Turno actualizado: {shiftDate} a las {startTime} · {location}. Revisa tu horario en AGCONN.',
        vars: ['shiftDate', 'startTime', 'location'] as const,
        category: 'transactional',
    }),
    'employer.broadcast': def({
        en: '{employer}: {body} (Reply STOP to opt out.)',
        es: '{employer}: {body} (Responde STOP para cancelar.)',
        vars: ['employer', 'body'] as const,
        category: 'promotional',
    }),
    // Inbound opt-in flow (mobile-originated double opt-in). See
    // services/api/src/webhooks/twilio.ts for the state machine, and the
    // Twilio A2P 10DLC campaign description for compliance context. The
    // confirm/invalid disclosures are mandated and unavoidably long; their
    // ES form is UCS-2 (accents) so the segment budget is explicitly raised.
    'sms.optin.confirm': def({
        en: 'AGCONN: Reply YES to receive bilingual job alerts, training reminders, and hiring updates in CA Central Valley. Msg freq varies (typ. 1-15/mo). Msg & data rates may apply. Reply STOP to cancel, HELP for help. Terms: agconn.com/sms-consent',
        es: 'AGCONN: Responde SI para recibir avisos de trabajo, recordatorios de capacitación y actualizaciones de contratación en el Valle Central. Frec. variable (típ. 1-15/mes). Pueden aplicar tarifas. Responde STOP para cancelar, HELP para ayuda. Términos: agconn.com/sms-consent',
        vars: [] as const,
        category: 'compliance',
        maxSegments: 5,
    }),
    // Sent on YES (confirmOptIn). Name is asked FIRST: it is the highest-value
    // field for employers and survives mid-flow drop-off, so we capture a
    // contactable identity before county/skills. County moved to its own
    // sms.onboard.ask_county prompt (next step).
    'sms.optin.welcome': def({
        en: "Welcome to AGCONN! Let's set you up for job matches. First, what's your name? Reply your first and last name.",
        es: '¡Bienvenido a AGCONN! Vamos a configurarte para recibir trabajos. Primero, ¿cómo te llamas? Responde tu nombre y apellido.',
        vars: [] as const,
        category: 'transactional',
        maxSegments: 3,
    }),
    'sms.optin.invalid': def({
        en: 'AGCONN: We need a YES to start sending you jobs. Reply YES to confirm, or STOP to cancel.',
        es: 'AGCONN: Necesitamos un SI para empezar a enviarte trabajos. Responde SI para confirmar o STOP para cancelar.',
        vars: [] as const,
        category: 'compliance',
    }),
    // SMS micro-onboarding (Phase 3). Order: name (sms.optin.welcome) ->
    // county (sms.onboard.ask_county) -> skills (sms.onboard.ask_skills).
    'sms.onboard.ask_county': def({
        en: 'Thanks! Which county do you work in? Reply a number: 1=Fresno 2=Kern 3=Kings 4=Madera 5=Tulare.',
        es: '¡Gracias! ¿En qué condado trabajas? Responde un número: 1=Fresno 2=Kern 3=Kings 4=Madera 5=Tulare.',
        vars: [] as const,
        category: 'transactional',
    }),
    'sms.onboard.invalid_county': def({
        en: 'Reply a number for your county: 1=Fresno 2=Kern 3=Kings 4=Madera 5=Tulare.',
        es: 'Responde un número para tu condado: 1=Fresno 2=Kern 3=Kings 4=Madera 5=Tulare.',
        vars: [] as const,
        category: 'transactional',
    }),
    // Re-prompt when the name reply isn't a usable first + last (one word,
    // digits/symbols only, empty). Phrased to read correctly as a retry.
    'sms.onboard.ask_name': def({
        en: 'We need your full name to match you with employers. Reply your first and last name.',
        es: 'Necesitamos tu nombre completo para conectarte con empleadores. Responde tu nombre y apellido.',
        vars: [] as const,
        category: 'transactional',
    }),
    'sms.onboard.ask_skills': def({
        en: 'Last step. Reply the numbers for your work (e.g. 1 3 6): 1=Harvest 2=Pruning 3=Irrigation 4=Packing 5=Planting 6=Forklift 7=Tractor 8=Crew lead.',
        es: 'Último paso. Responde los números de tu trabajo (ej. 1 3 6): 1=Cosecha 2=Poda 3=Riego 4=Empaque 5=Siembra 6=Montacargas 7=Tractor 8=Líder de cuadrilla.',
        vars: [] as const,
        category: 'transactional',
        maxSegments: 4,
    }),
    'sms.onboard.done': def({
        en: "You're all set, {firstName}. We'll text jobs that match you in {county}. Reply JOBS anytime to see openings. Reply STOP to opt out.",
        es: 'Listo, {firstName}. Te enviaremos trabajos para ti en {county}. Responde JOBS para ver trabajos. Responde STOP para cancelar.',
        vars: ['firstName', 'county'] as const,
        category: 'transactional',
    }),
    'sms.jobs.digest': def({
        en: 'Jobs for you:\n{list}\nReply the code to apply.',
        es: 'Trabajos para ti:\n{list}\nResponde el código para aplicar.',
        vars: ['list'] as const,
        category: 'transactional',
    }),
    'sms.jobs.none': def({
        en: "No open jobs in {county} right now. We'll text you when one matches. Reply STOP to opt out.",
        es: 'No hay trabajos en {county} ahora. Te avisaremos cuando haya uno. Responde STOP para cancelar.',
        vars: ['county'] as const,
        category: 'transactional',
    }),
} as const;

export type SmsTemplateName = keyof typeof smsTemplates;

export type TemplateVars<T extends SmsTemplateName> = Record<
    (typeof smsTemplates)[T]['vars'][number],
    string
>;

const PLACEHOLDER_RE = /\{([a-zA-Z][a-zA-Z0-9_]*)\}/g;

export function renderSms<T extends SmsTemplateName>(
    name: T,
    locale: Locale,
    vars: TemplateVars<T>,
): string {
    const tpl = smsTemplates[name][locale];
    const required = new Set<string>(smsTemplates[name].vars as readonly string[]);
    return tpl.replace(PLACEHOLDER_RE, (_match, key: string) => {
        if (!required.has(key)) {
            throw new Error(`renderSms(${name}/${locale}): placeholder {${key}} not declared in template vars`);
        }
        const value = (vars as Record<string, string>)[key];
        if (value === undefined || value === null) {
            throw new Error(`renderSms(${name}/${locale}): missing var ${key}`);
        }
        return String(value);
    });
}
