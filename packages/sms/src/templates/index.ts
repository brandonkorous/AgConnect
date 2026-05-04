// SMS template catalog — bilingual EN/ES, var-validated.
//
// Each entry is the full message body (no separate subject), with `{var}`
// placeholders. The TS type `TemplateVars<T>` keeps callers honest: passing
// the wrong shape is a compile error. The full catalog is the source of
// truth — see docs/00-foundation/05-sms-pipeline/06-messaging.md.

type Locale = 'en' | 'es';

type TemplateDef<V extends readonly string[]> = {
  readonly en: string;
  readonly es: string;
  readonly vars: V;
};

const def = <V extends readonly string[]>(t: TemplateDef<V>): TemplateDef<V> => t;

export const smsTemplates = {
  welcome: def({
    en: 'Welcome to AgConn, {firstName}! Search jobs at agconn.com/jobs. Reply STOP to opt out.',
    es: '¡Bienvenido a AgConn, {firstName}! Busca trabajos en agconn.com/jobs. Responde STOP para cancelar.',
    vars: ['firstName'] as const,
  }),
  'application.applied': def({
    en: 'You applied for {jobTitle} at {employer}. Track at agconn.com/applications.',
    es: 'Aplicaste para {jobTitle} con {employer}. Sigue tu solicitud en agconn.com/applications.',
    vars: ['jobTitle', 'employer'] as const,
  }),
  'application.reviewed': def({
    en: '{employer} reviewed your application for {jobTitle}.',
    es: '{employer} revisó tu solicitud para {jobTitle}.',
    vars: ['jobTitle', 'employer'] as const,
  }),
  'application.hired': def({
    en: "Great news! You're hired for {jobTitle} at {employer}, starting {startDate}. They'll contact you.",
    es: '¡Buenas noticias! Te contrataron para {jobTitle} con {employer}, comenzando {startDate}. Te contactarán.',
    vars: ['jobTitle', 'employer', 'startDate'] as const,
  }),
  'application.rejected': def({
    en: '{employer} chose another candidate for {jobTitle}. Keep applying! agconn.com/jobs',
    es: '{employer} eligió a otro candidato para {jobTitle}. ¡Sigue aplicando! agconn.com/jobs',
    vars: ['jobTitle', 'employer'] as const,
  }),
  'job.alert': def({
    en: 'New {jobTitle} job in {county}: ${wageMin}-${wageMax}/hr. agconn.com/jobs/{slug}',
    es: 'Nuevo trabajo de {jobTitle} en {county}: ${wageMin}-${wageMax}/hr. agconn.com/jobs/{slug}',
    vars: ['jobTitle', 'county', 'wageMin', 'wageMax', 'slug'] as const,
  }),
  'training.reminder.48h': def({
    en: 'Reminder: {programTitle} starts {startDate} at {startTime}. {location}',
    es: 'Recordatorio: {programTitle} empieza el {startDate} a las {startTime}. {location}',
    vars: ['programTitle', 'startDate', 'startTime', 'location'] as const,
  }),
  'training.reminder.2h': def({
    en: '{programTitle} starts in 2 hours at {location}. See you there!',
    es: '{programTitle} empieza en 2 horas en {location}. ¡Nos vemos!',
    vars: ['programTitle', 'location'] as const,
  }),
  'training.completed': def({
    en: 'Congrats! You completed {programTitle}. Download your certificate: {certUrl}',
    es: '¡Felicidades! Completaste {programTitle}. Descarga tu certificado: {certUrl}',
    vars: ['programTitle', 'certUrl'] as const,
  }),
  'worker.invitation': def({
    en: '{employer} invited you to apply for {jobTitle} (${wageMin}-${wageMax}/hr in {county}). View: agconn.com/invitations/{id}',
    es: '{employer} te invitó a aplicar para {jobTitle} (${wageMin}-${wageMax}/hr en {county}). Ver: agconn.com/invitations/{id}',
    vars: ['employer', 'jobTitle', 'wageMin', 'wageMax', 'county', 'id'] as const,
  }),
  'application.withdrawn': def({
    en: 'Withdrew your application for {jobTitle} at {employer}. Browse more: agconn.com/jobs',
    es: 'Retiraste tu solicitud para {jobTitle} con {employer}. Ver más: agconn.com/jobs',
    vars: ['jobTitle', 'employer'] as const,
  }),
  'training.enrolled': def({
    en: "You're enrolled in {programTitle}. Starts {startDate} at {location}. We'll remind you 2 days before.",
    es: 'Estás inscrito en {programTitle}. Empieza el {startDate} en {location}. Te recordaremos 2 días antes.',
    vars: ['programTitle', 'startDate', 'location'] as const,
  }),
  'training.unenrolled': def({
    en: "You unenrolled from {programTitle}. Browse more programs: agconn.com/training",
    es: 'Cancelaste {programTitle}. Ver más programas: agconn.com/training',
    vars: ['programTitle'] as const,
  }),
  'job.posting.edited': def({
    en: '{employer} updated {jobTitle} ({fields}). Review the new details: agconn.com/applications',
    es: '{employer} actualizó {jobTitle} ({fields}). Revisa los nuevos detalles: agconn.com/applications',
    vars: ['employer', 'jobTitle', 'fields'] as const,
  }),
  'job.match.invitation': def({
    en: 'New {jobTitle} match in {county}: ${wageMin}-${wageMax}/hr, starts {startDate}. Reply {keyword} to apply.',
    es: 'Nuevo trabajo de {jobTitle} en {county}: ${wageMin}-${wageMax}/hr, empieza {startDate}. Responde {keyword} para aplicar.',
    vars: ['jobTitle', 'county', 'wageMin', 'wageMax', 'startDate', 'keyword'] as const,
  }),
  'sms.apply.confirmed': def({
    en: 'You applied for {jobTitle} at {employer}. Track at agconn.com/applications. Reply STOP to opt out.',
    es: 'Aplicaste para {jobTitle} con {employer}. Sigue en agconn.com/applications. Responde STOP para cancelar.',
    vars: ['jobTitle', 'employer'] as const,
  }),
  'sms.apply.unknown_keyword': def({
    en: "We couldn't find a job for '{keyword}'. Browse openings at agconn.com/jobs.",
    es: "No encontramos un trabajo con '{keyword}'. Busca en agconn.com/jobs.",
    vars: ['keyword'] as const,
  }),
  'worker.shift.updated': def({
    en: 'Shift updated: {shiftDate} at {startTime} · {location}. Open your AgConn schedule for details.',
    es: 'Turno actualizado: {shiftDate} a las {startTime} · {location}. Revisa tu horario en AgConn.',
    vars: ['shiftDate', 'startTime', 'location'] as const,
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
