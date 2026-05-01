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
