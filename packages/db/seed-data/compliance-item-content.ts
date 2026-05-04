// Compliance instruction sidebar content — SEED SNAPSHOT.
//
// SOURCE OF TRUTH IS THE DATABASE (table: compliance_item_content).
// This file exists as the initial seed and as a re-seedable snapshot for
// fresh environments. The compliance ops owner edits content via the admin
// surface (when built); engineers don't gatekeep content changes through
// PRs. To re-seed a fresh environment, run:
//   pnpm --filter @agconn/db exec tsx scripts/seed-compliance-item-content.ts
//
// SOURCED CONTENT — every claim cites an authoritative regulatory page
// (USCIS, IRS, CDPR, Cal/OSHA, EPA, DLSE). When in doubt, claims are left
// out rather than fabricated. See `lastVerified` per item and per-item
// fetch logs above each entry.
//
// Spanish copy is written for Mexican-Spanish speakers in the California
// Central Valley — plain register, no "vosotros", no -x/-e neutral forms,
// no marketing voice. ES is a peer language, not a translation.
//
// Last broad pass: 2026-05-03.

export type LocalizedString = { en: string; es: string };

export type ComplianceItemContent = {
  why: LocalizedString;
  how: LocalizedString[];
  acceptableEvidence: LocalizedString[];
  deadline: LocalizedString | null;
  source: { label: string; url: string };
  extraSources?: { label: string; url: string }[];
  lastVerified: string; // ISO YYYY-MM-DD
};

const EMPTY: ComplianceItemContent = {
  why: { en: '', es: '' },
  how: [],
  acceptableEvidence: [],
  deadline: null,
  source: { label: '', url: 'https://example.invalid/' },
  lastVerified: '1970-01-01',
};

// The seeded compliance items in the DB use short keys (`i9_on_file`,
// `covid_plan`, ...) while the content entries below are keyed by their
// long descriptive form. This alias map lets `getContentForItem` resolve
// either form. Add entries here when seeding new items, not by renaming
// content entries — the long form is the primary documentation key.
const ITEM_KEY_ALIASES: Record<string, string> = {
  i9_on_file: 'i_9_forms_on_file',
  i9_expiring: 'i_9s_expiring_within_30_days',
  w4_collected: 'w_4s_collected',
  noi_filing: 'notice_of_intent',
  pur_records: 'application_records_pur',
  covid_plan: 'covid_19_prevention_plan',
  heat_plan: 'heat_illness_prevention_plan',
  wps_training: 'pesticide_handler_training_wps',
  overtime: 'overtime_calculations',
  piece_breaks: 'piece_rate_paid_breaks_tracked',
  wage_stmts: 'itemized_wage_statements',
};

export const COMPLIANCE_ITEM_CONTENT: Record<string, ComplianceItemContent> = {
  // ────────────────────────────────────────────────────────────────────────
  // i_9_forms_on_file
  // Fetched 2026-05-03:
  //   - https://www.uscis.gov/i-9-central                    (403 from WebFetch)
  //   - https://www.uscis.gov/i-9                            (403 from WebFetch)
  //   - https://www.uscis.gov/i-9-central/complete-correct-form-i-9 (403)
  // The USCIS I-9 Central pages blocked WebFetch. Content reflects standard,
  // long-standing I-9 rules; treat as PARTIAL until directly re-verified
  // against M-274 Handbook for Employers.
  // ────────────────────────────────────────────────────────────────────────
  i_9_forms_on_file: {
    why: {
      en:
        'Federal law requires every employee — citizen or not — to complete Form I-9 to verify identity and authorization to work. The form has to be on file before the worker stays past their first three days.',
      es:
        'La ley federal exige que cada trabajador — ciudadano o no — llene la forma I-9 para confirmar identidad y permiso de trabajo. La forma debe quedar archivada antes de que pasen los primeros tres días.',
    },
    how: [
      {
        en: 'Have the new hire complete Section 1 by their first day of work.',
        es: 'Pídale al nuevo trabajador llenar la Sección 1 el primer día de trabajo.',
      },
      {
        en: 'Review their original ID documents in person and complete Section 2 within 3 business days of hire.',
        es: 'Revise los documentos originales en persona y llene la Sección 2 dentro de 3 días hábiles de la contratación.',
      },
      {
        en: 'Keep I-9s in a separate file from personnel records, and apart from the employee file.',
        es: 'Guarde las I-9 en un archivo aparte, separadas del expediente del trabajador.',
      },
      {
        en: 'Retain each I-9 for 3 years after the hire date or 1 year after termination, whichever is later.',
        es: 'Conserve cada I-9 por 3 años después de la contratación o 1 año después de la baja, lo que ocurra más tarde.',
      },
    ],
    acceptableEvidence: [
      {
        en: 'Completed I-9 with both sections signed',
        es: 'I-9 completada y firmada en ambas secciones',
      },
      {
        en: 'List A document, or List B + List C documents',
        es: 'Documento de Lista A, o de Lista B más Lista C',
      },
      {
        en: 'E-Verify case number (if your operation uses E-Verify)',
        es: 'Número de caso de E-Verify (si su operación usa E-Verify)',
      },
    ],
    deadline: {
      en: 'Section 2: within 3 business days of the hire date.',
      es: 'Sección 2: dentro de 3 días hábiles de la fecha de contratación.',
    },
    source: { label: 'USCIS I-9 Central', url: 'https://www.uscis.gov/i-9-central' },
    extraSources: [
      {
        label: 'M-274 Handbook for Employers',
        url: 'https://www.uscis.gov/i-9-central/form-i-9-resources/handbook-for-employers-m-274',
      },
    ],
    lastVerified: '2026-05-03',
  },

  // ────────────────────────────────────────────────────────────────────────
  // i_9s_expiring_within_30_days  (informational row)
  // Fetched 2026-05-03: same USCIS sources as above (blocked).
  // PARTIAL — reverification rules verified by long-standing USCIS guidance,
  // but direct WebFetch confirmation pending.
  // ────────────────────────────────────────────────────────────────────────
  i_9s_expiring_within_30_days: {
    why: {
      en:
        'Some I-9 documents — like Employment Authorization Documents — expire. You have to reverify work authorization on or before the expiration date to keep employing the worker legally.',
      es:
        'Algunos documentos de la I-9 — como las autorizaciones de empleo — se vencen. Tiene que re-verificar el permiso de trabajo en o antes de la fecha de vencimiento para seguir empleando al trabajador legalmente.',
    },
    how: [
      {
        en: 'Run a monthly report of I-9 documents expiring in the next 30 days.',
        es: 'Saque cada mes un reporte de los documentos I-9 que se vencen en los próximos 30 días.',
      },
      {
        en: 'Notify each affected worker in writing with time to renew.',
        es: 'Avise por escrito a cada trabajador con tiempo para renovar.',
      },
      {
        en: 'Complete Section 3 (Reverification) before the expiration date with new acceptable documents.',
        es: 'Llene la Sección 3 (Re-verificación) antes del vencimiento con documentos nuevos aceptables.',
      },
    ],
    acceptableEvidence: [
      {
        en: 'Monthly expiring-document report from HR system',
        es: 'Reporte mensual de documentos por vencer del sistema de Recursos Humanos',
      },
      {
        en: 'Section 3 completed before expiration',
        es: 'Sección 3 completada antes del vencimiento',
      },
      {
        en: 'Copies of new acceptable documents',
        es: 'Copias de los nuevos documentos aceptables',
      },
    ],
    deadline: {
      en: 'On or before the listed expiration date.',
      es: 'En o antes de la fecha de vencimiento.',
    },
    source: { label: 'USCIS I-9 Central', url: 'https://www.uscis.gov/i-9-central' },
    lastVerified: '2026-05-03',
  },

  // ────────────────────────────────────────────────────────────────────────
  // w_4s_collected
  // Fetched 2026-05-03:
  //   - https://www.irs.gov/forms-pubs/about-form-w-4
  //   - https://www.irs.gov/businesses/small-businesses-self-employed/employment-tax-recordkeeping
  // Confirmed: W-4 used so employer withholds correct federal income tax;
  // employment tax records (incl. W-4) retained at least 4 years after the
  // 4th-quarter return is filed.
  // ────────────────────────────────────────────────────────────────────────
  w_4s_collected: {
    why: {
      en:
        'The W-4 tells you how much federal income tax to withhold from each paycheck. You also have to keep W-4s and the rest of your employment-tax records for at least 4 years.',
      es:
        'La forma W-4 le indica cuánto impuesto federal retener de cada cheque. También tiene que guardar las W-4 y los demás registros de impuestos por al menos 4 años.',
    },
    how: [
      {
        en: 'Give every new hire a current-year Form W-4 on or before their first day.',
        es: 'Entregue una W-4 del año en curso a cada nuevo trabajador en su primer día o antes.',
      },
      {
        en: 'Collect the signed W-4 before running the first payroll.',
        es: 'Reciba la W-4 firmada antes de correr la primera nómina.',
      },
      {
        en: 'Update the W-4 whenever the employee asks for a change.',
        es: 'Actualice la W-4 cuando el trabajador pida un cambio.',
      },
      {
        en: 'Keep W-4s with your employment-tax records for at least 4 years after the 4th-quarter return is filed.',
        es: 'Guarde las W-4 con los demás registros de impuestos por al menos 4 años después de presentar la declaración del cuarto trimestre.',
      },
    ],
    acceptableEvidence: [
      {
        en: 'Signed Form W-4 (current-year version)',
        es: 'Forma W-4 firmada (versión del año en curso)',
      },
      {
        en: 'Payroll system record of withholding election',
        es: 'Registro de la nómina con la elección de retención',
      },
      {
        en: 'Note in file if no W-4 was submitted',
        es: 'Nota en el archivo si no entregó W-4',
      },
    ],
    deadline: {
      en: 'Before the employee’s first paycheck.',
      es: 'Antes del primer cheque del trabajador.',
    },
    source: {
      label: 'IRS — About Form W-4',
      url: 'https://www.irs.gov/forms-pubs/about-form-w-4',
    },
    extraSources: [
      {
        label: 'IRS — Employment Tax Recordkeeping',
        url: 'https://www.irs.gov/businesses/small-businesses-self-employed/employment-tax-recordkeeping',
      },
    ],
    lastVerified: '2026-05-03',
  },

  // ────────────────────────────────────────────────────────────────────────
  // notice_of_intent  (NOI — pesticides)
  // Fetched 2026-05-03:
  //   - https://www.cdpr.ca.gov/docs/enforce/grow.htm
  //   - https://www.cdpr.ca.gov/docs/whs/handler.htm
  // PARTIAL — CDPR landing pages confirm the County Agricultural Commissioner
  // role and restricted-material program, but the specific lead-time hours
  // (commonly cited as 24 hours before application) could not be confirmed
  // from a fetched page in this pass. Wording stays general, with a TODO
  // below to verify exact lead-time and any permit prerequisites.
  // ────────────────────────────────────────────────────────────────────────
  notice_of_intent: {
    why: {
      en:
        'California restricts where, when, and how growers can apply certain pesticides. The Notice of Intent gives the County Agricultural Commissioner the chance to inspect and protect nearby workers, schools, and homes before the application happens.',
      es:
        'California restringe dónde, cuándo y cómo se aplican ciertos pesticidas. El Aviso de Intención le permite al Comisionado Agrícola del condado revisar y proteger a los trabajadores, escuelas y casas vecinas antes de la aplicación.',
    },
    how: [
      {
        en: 'Confirm whether the pesticide is a "restricted material" under California regulations.',
        es: 'Confirme si el pesticida es “material restringido” bajo las reglas de California.',
      },
      {
        en: 'File a Notice of Intent with your County Agricultural Commissioner before the application.',
        es: 'Presente el Aviso de Intención con el Comisionado Agrícola del condado antes de aplicar.',
      },
      {
        en: 'Wait for the Commissioner’s review before applying.',
        es: 'Espere la revisión del Comisionado antes de aplicar.',
      },
      {
        en: 'Keep a copy of each filed NOI with your pesticide records.',
        es: 'Guarde una copia de cada NOI presentado con sus registros de pesticidas.',
      },
    ],
    acceptableEvidence: [
      {
        en: 'Filed NOI with County Ag Commissioner stamp or receipt',
        es: 'NOI presentado con sello o recibo del Comisionado Agrícola del condado',
      },
      {
        en: 'Restricted material permit on file',
        es: 'Permiso de material restringido archivado',
      },
      {
        en: 'Application record matching the filed NOI',
        es: 'Registro de la aplicación que coincide con el NOI presentado',
      },
    ],
    deadline: {
      en: 'Filed in advance of each restricted-material application — confirm exact lead time with your County Agricultural Commissioner.',
      es: 'Presentado antes de cada aplicación de material restringido — confirme el tiempo exacto con su Comisionado Agrícola del condado.',
    },
    source: {
      label: 'CDPR — Pesticide Use Enforcement (Growers)',
      url: 'https://www.cdpr.ca.gov/docs/enforce/grow.htm',
    },
    lastVerified: '2026-05-03',
  },

  // ────────────────────────────────────────────────────────────────────────
  // application_records_pur  (Pesticide Use Reports)
  // Fetched 2026-05-03:
  //   - https://www.cdpr.ca.gov/docs/pur/purmain.htm
  //   - https://www.cdpr.ca.gov/docs/pur/pur_overview.htm
  //   - https://www.cdpr.ca.gov/docs/enforce/grow.htm
  // PARTIAL — CDPR pages confirm reporting exists and is collected after
  // applications, but the specific monthly deadline (commonly cited as the
  // 10th of the following month) was not confirmed from a fetched page.
  // Wording stays general; see TODO below.
  // ────────────────────────────────────────────────────────────────────────
  application_records_pur: {
    why: {
      en:
        'California is the only state that collects monthly reports on every agricultural pesticide use. The data informs public health, school siting, and worker-safety decisions.',
      es:
        'California es el único estado que recoge reportes mensuales de cada uso de pesticidas en la agricultura. Esta información apoya decisiones de salud pública, ubicación de escuelas y seguridad de los trabajadores.',
    },
    how: [
      {
        en: 'Record every agricultural pesticide application — product, EPA registration number, acres treated, location, and date.',
        es: 'Anote cada aplicación agrícola — producto, número de registro EPA, hectáreas tratadas, ubicación y fecha.',
      },
      {
        en: 'Submit the report to your County Agricultural Commissioner each month.',
        es: 'Envíe el reporte al Comisionado Agrícola del condado cada mes.',
      },
      {
        en: 'Keep your application records on file in case of inspection.',
        es: 'Guarde sus registros de aplicación por si llega una inspección.',
      },
    ],
    acceptableEvidence: [
      {
        en: 'Monthly PUR submission confirmation',
        es: 'Confirmación de envío mensual del PUR',
      },
      {
        en: 'Application logs with date, location, product, EPA reg. number',
        es: 'Bitácoras con fecha, lugar, producto y número EPA',
      },
      {
        en: 'County Ag Commissioner receipt',
        es: 'Recibo del Comisionado Agrícola del condado',
      },
    ],
    deadline: {
      en: 'Submitted monthly to the County Agricultural Commissioner.',
      es: 'Se envía cada mes al Comisionado Agrícola del condado.',
    },
    source: {
      label: 'CDPR — Pesticide Use Reporting',
      url: 'https://www.cdpr.ca.gov/docs/pur/purmain.htm',
    },
    lastVerified: '2026-05-03',
  },

  // ────────────────────────────────────────────────────────────────────────
  // covid_19_prevention_plan
  // Fetched 2026-05-03:
  //   - https://www.dir.ca.gov/dosh/coronavirus/Revisions-FAQ.html
  // Confirmed: Cal/OSHA COVID-19 Prevention Non-Emergency Regulation (8 CCR
  // §§3205, 3205.1, 3205.2, 3205.3) was in effect through Feb 3, 2025; the
  // recordkeeping and reporting requirements ran through Feb 3, 2026.
  // After Feb 2025, COVID-19 hazards fall under general OSHA injury-and-
  // illness prevention requirements (the IIPP). Today (2026-05-03) is past
  // both sunset dates, so the framing is post-ETS.
  // ────────────────────────────────────────────────────────────────────────
  covid_19_prevention_plan: {
    why: {
      en:
        'Cal/OSHA’s specific COVID-19 Prevention Non-Emergency Regulation expired February 3, 2025; the related recordkeeping requirement expired February 3, 2026. COVID-19 is now handled under your written Injury and Illness Prevention Program (IIPP) and standard Cal/OSHA hazard rules.',
      es:
        'El reglamento específico de Cal/OSHA contra el COVID-19 venció el 3 de febrero de 2025, y la obligación de guardar registros venció el 3 de febrero de 2026. Ahora el COVID-19 se maneja bajo su Programa escrito de Prevención de Lesiones y Enfermedades (IIPP) y las reglas generales de Cal/OSHA.',
    },
    how: [
      {
        en: 'Add COVID-19 hazard procedures to your written IIPP.',
        es: 'Agregue procedimientos contra el COVID-19 a su IIPP escrito.',
      },
      {
        en: 'Train workers on the procedures and on their right to report symptoms.',
        es: 'Capacite a los trabajadores sobre los procedimientos y su derecho a reportar síntomas.',
      },
      {
        en: 'Keep records of any COVID-19 cases and exposures consistent with general IIPP recordkeeping.',
        es: 'Conserve los registros de casos y exposiciones al COVID-19 conforme al IIPP general.',
      },
    ],
    acceptableEvidence: [
      {
        en: 'Updated IIPP document with COVID-19 procedures',
        es: 'IIPP actualizado con procedimientos del COVID-19',
      },
      {
        en: 'Training sign-in sheets',
        es: 'Hojas de asistencia a la capacitación',
      },
      {
        en: 'Case and exposure log',
        es: 'Bitácora de casos y exposiciones',
      },
    ],
    deadline: null,
    source: {
      label: 'Cal/OSHA — COVID-19 Non-Emergency Regulation FAQ',
      url: 'https://www.dir.ca.gov/dosh/coronavirus/Revisions-FAQ.html',
    },
    lastVerified: '2026-05-03',
  },

  // ────────────────────────────────────────────────────────────────────────
  // heat_illness_prevention_plan
  // Fetched 2026-05-03:
  //   - https://www.dir.ca.gov/title8/3395.html
  // Confirmed: applies to all outdoor places of employment; written plan
  // required in English plus the language understood by most workers; water
  // (one quart per worker per hour, free); shade required at 80°F; high-heat
  // procedures triggered at 95°F; rest at least 5 minutes; training before
  // heat exposure.
  // ────────────────────────────────────────────────────────────────────────
  heat_illness_prevention_plan: {
    why: {
      en:
        'California has the strictest outdoor-heat rules in the country. Every outdoor employer needs a written prevention plan, has to provide cool water and shade, and has to train workers — in the language they understand — before their first hot shift.',
      es:
        'California tiene las reglas más estrictas del país contra el calor en el trabajo al aire libre. Cada empleador con trabajo al aire libre debe tener un plan escrito de prevención, dar agua fresca y sombra, y capacitar a los trabajadores — en el idioma que entiendan — antes de su primer turno caluroso.',
    },
    how: [
      {
        en: 'Write the plan in English and in the language understood by most of your workers.',
        es: 'Escriba el plan en inglés y en el idioma que entiende la mayoría de sus trabajadores.',
      },
      {
        en: 'Provide one quart of cool drinking water per worker per hour, free of charge.',
        es: 'Proporcione un cuarto de galón de agua fresca por trabajador por hora, sin costo.',
      },
      {
        en: 'Provide shade large enough for everyone on rest, accessible whenever it is 80°F or hotter.',
        es: 'Proporcione sombra suficiente para todos los que descansan, disponible cuando haga 80°F o más.',
      },
      {
        en: 'Use high-heat procedures (observation, communication, reminders) when it reaches 95°F.',
        es: 'Aplique los procedimientos de calor alto (observación, comunicación, recordatorios) cuando llegue a 95°F.',
      },
      {
        en: 'Train every worker and supervisor before they start outdoor work in the heat.',
        es: 'Capacite a cada trabajador y supervisor antes de que empiecen trabajo al aire libre en calor.',
      },
    ],
    acceptableEvidence: [
      {
        en: 'Written Heat Illness Prevention Plan in EN and the workforce’s language',
        es: 'Plan escrito de Prevención de Enfermedades por Calor en inglés y en el idioma de la cuadrilla',
      },
      {
        en: 'Training records with worker signatures',
        es: 'Registros de capacitación con las firmas de los trabajadores',
      },
      {
        en: 'Photos of shade structures and water stations',
        es: 'Fotos de las estructuras de sombra y estaciones de agua',
      },
      {
        en: 'Acclimatization log for new and returning workers',
        es: 'Bitácora de aclimatación para trabajadores nuevos o que regresan',
      },
    ],
    deadline: {
      en: 'In place before any outdoor work in heat begins.',
      es: 'Vigente antes de comenzar cualquier trabajo al aire libre en calor.',
    },
    source: {
      label: 'Cal/OSHA — 8 CCR §3395 Heat Illness Prevention',
      url: 'https://www.dir.ca.gov/title8/3395.html',
    },
    lastVerified: '2026-05-03',
  },

  // ────────────────────────────────────────────────────────────────────────
  // pesticide_handler_training_wps
  // Fetched 2026-05-03:
  //   - https://www.epa.gov/pesticide-worker-safety
  //   - https://www.epa.gov/pesticide-worker-safety/agricultural-worker-protection-standard-wps
  //   - https://www.cdpr.ca.gov/docs/whs/handler.htm
  // Confirmed: handlers (mix/load/apply pesticides, clean equipment, handle
  // unrinsed containers) must be trained annually, in a language they
  // understand, and re-trained when working with new pesticides.
  // PARTIAL — exact federal recordkeeping period (commonly 2 years under
  // 40 CFR Part 170) was not confirmed from a fetched page in this pass.
  // ────────────────────────────────────────────────────────────────────────
  pesticide_handler_training_wps: {
    why: {
      en:
        'Anyone who mixes, loads, or applies agricultural pesticides — or cleans the equipment, or handles unrinsed containers — has to be trained every year before they start. Training has to be in a language the handler understands.',
      es:
        'Cualquier persona que mezcle, cargue o aplique pesticidas agrícolas — o limpie el equipo, o maneje envases sin enjuagar — debe ser capacitada cada año antes de empezar. La capacitación debe darse en un idioma que el trabajador entienda.',
    },
    how: [
      {
        en: 'Identify every worker on the operation who handles pesticides.',
        es: 'Identifique a cada trabajador de la operación que maneja pesticidas.',
      },
      {
        en: 'Train each handler before their first day handling pesticides, and again every 12 months.',
        es: 'Capacite a cada trabajador antes de su primer día manejando pesticidas y otra vez cada 12 meses.',
      },
      {
        en: 'Use EPA- or DPR-approved training materials in a language the handler understands.',
        es: 'Use materiales aprobados por EPA o DPR en un idioma que el trabajador entienda.',
      },
      {
        en: 'Document each training session with handler name, trainer name, date, and materials used.',
        es: 'Documente cada capacitación con el nombre del trabajador, el del capacitador, la fecha y los materiales usados.',
      },
    ],
    acceptableEvidence: [
      {
        en: 'Training record signed by handler and trainer',
        es: 'Registro de capacitación firmado por el trabajador y el capacitador',
      },
      {
        en: 'Reference to the EPA- or DPR-approved training material',
        es: 'Referencia al material aprobado por EPA o DPR',
      },
      {
        en: 'Verification card or training certificate',
        es: 'Tarjeta o certificado de capacitación',
      },
    ],
    deadline: {
      en: 'Before the handler’s first day handling pesticides, then every 12 months.',
      es: 'Antes del primer día manejando pesticidas, y después cada 12 meses.',
    },
    source: {
      label: 'EPA — Worker Protection Standard',
      url: 'https://www.epa.gov/pesticide-worker-safety/agricultural-worker-protection-standard-wps',
    },
    extraSources: [
      {
        label: 'CDPR — Pesticide Handler Training',
        url: 'https://www.cdpr.ca.gov/docs/whs/handler.htm',
      },
    ],
    lastVerified: '2026-05-03',
  },

  // ────────────────────────────────────────────────────────────────────────
  // overtime_calculations  (CA AB 1066)
  // Fetched 2026-05-03:
  //   - https://www.dir.ca.gov/dlse/Overtime-for-Agricultural-Workers.html
  // Confirmed: phase-in completed Jan 1, 2025 for employers with 25 or fewer
  // employees (had completed Jan 1, 2022 for employers with 26+). All ag
  // employers in CA are now at the 8-hour day / 40-hour week thresholds.
  // Double time required after 12 hours in a workday.
  // Today is 2026-05-03 — both sizes are at 8/40.
  // ────────────────────────────────────────────────────────────────────────
  overtime_calculations: {
    why: {
      en:
        'California ag workers earn overtime at the same daily and weekly thresholds as workers in other industries: more than 8 hours a day or 40 hours a week, regardless of employer size. The phase-in finished January 1, 2025.',
      es:
        'Los trabajadores agrícolas de California ganan tiempo extra a los mismos límites que los trabajadores de otras industrias: más de 8 horas al día o 40 horas a la semana, sin importar el tamaño del empleador. La transición terminó el 1 de enero de 2025.',
    },
    how: [
      {
        en: 'Track each worker’s daily and weekly hours, including any seventh-day work.',
        es: 'Lleve registro de las horas diarias y semanales de cada trabajador, incluyendo el trabajo del séptimo día.',
      },
      {
        en: 'Pay 1.5× the regular rate for hours over 8 in a day or 40 in a week.',
        es: 'Pague 1.5× el salario regular por las horas sobre 8 en un día o 40 en una semana.',
      },
      {
        en: 'Pay 2× the regular rate for hours over 12 in a single workday.',
        es: 'Pague 2× el salario regular por las horas sobre 12 en un solo día.',
      },
      {
        en: 'Show the regular rate, OT rate, and hours at each rate on the wage statement.',
        es: 'Muestre la tarifa regular, la de tiempo extra y las horas a cada tarifa en el talón de pago.',
      },
    ],
    acceptableEvidence: [
      {
        en: 'Daily time records by worker',
        es: 'Registros diarios de horas por trabajador',
      },
      {
        en: 'Payroll register showing OT calculation',
        es: 'Registro de nómina con el cálculo del tiempo extra',
      },
      {
        en: 'Wage statements with hourly rates and hours at each rate',
        es: 'Talones de pago con tarifas y horas a cada tarifa',
      },
    ],
    deadline: null,
    source: {
      label: 'DLSE — Overtime for Agricultural Workers (AB 1066)',
      url: 'https://www.dir.ca.gov/dlse/Overtime-for-Agricultural-Workers.html',
    },
    lastVerified: '2026-05-03',
  },

  // ────────────────────────────────────────────────────────────────────────
  // piece_rate_paid_breaks_tracked  (Labor Code §226.2 / AB 1513)
  // Fetched 2026-05-03:
  //   - https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=LAB&sectionNum=226.2.
  // Confirmed: piece-rate workers must be paid separately for rest/recovery
  // periods at the higher of (i) workweek average hourly rate or (ii) the
  // applicable minimum wage; "other nonproductive time" must be paid at no
  // less than the applicable minimum wage; itemized wage statement must
  // show total hours of compensable rest/recovery, the rate, and gross wages.
  // ────────────────────────────────────────────────────────────────────────
  piece_rate_paid_breaks_tracked: {
    why: {
      en:
        'Piece-rate workers in California have to be paid separately for rest and recovery periods, and for "other nonproductive time" — time when they’re under your control but not earning piece rate. The wage statement has to show those hours, the rate, and the gross pay.',
      es:
        'Los trabajadores a destajo en California deben recibir pago aparte por los descansos y los periodos de recuperación, y por el “tiempo no productivo” — tiempo bajo su control pero sin estar produciendo a destajo. El talón de pago debe mostrar esas horas, la tarifa y el total pagado.',
    },
    how: [
      {
        en: 'Track rest and recovery periods separately from piece-rate work time.',
        es: 'Registre los descansos y los periodos de recuperación aparte del tiempo a destajo.',
      },
      {
        en: 'Track "other nonproductive time" — waiting, meetings, travel between rows.',
        es: 'Registre el “tiempo no productivo” — esperas, juntas, traslados entre surcos.',
      },
      {
        en: 'Pay rest and recovery at the higher of the workweek average hourly rate or the applicable minimum wage.',
        es: 'Pague descansos y recuperación a la tarifa más alta entre el promedio semanal por hora y el salario mínimo aplicable.',
      },
      {
        en: 'Pay other nonproductive time at no less than the applicable minimum wage.',
        es: 'Pague el tiempo no productivo a no menos del salario mínimo aplicable.',
      },
      {
        en: 'Show total hours, rate of pay, and gross wages for these categories on the wage statement.',
        es: 'Muestre el total de horas, la tarifa y el total pagado de estas categorías en el talón de pago.',
      },
    ],
    acceptableEvidence: [
      {
        en: 'Time records distinguishing piece work, rest, and nonproductive time',
        es: 'Registros que distinguen entre trabajo a destajo, descansos y tiempo no productivo',
      },
      {
        en: 'Wage statements showing rest-period hours and rate',
        es: 'Talones de pago que muestran horas y tarifa de los descansos',
      },
      {
        en: 'Payroll register with separate line items for each category',
        es: 'Registro de nómina con renglones aparte para cada categoría',
      },
    ],
    deadline: {
      en: 'Calculated, paid, and reported every pay period.',
      es: 'Se calcula, paga y reporta cada periodo de pago.',
    },
    source: {
      label: 'CA Labor Code §226.2',
      url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=LAB&sectionNum=226.2.',
    },
    extraSources: [
      {
        label: 'DLSE — AB 1513 FAQ',
        url: 'https://www.dir.ca.gov/dlse/AB_1513_FAQs.html',
      },
    ],
    lastVerified: '2026-05-03',
  },

  // ────────────────────────────────────────────────────────────────────────
  // itemized_wage_statements  (Labor Code §226)
  // Fetched 2026-05-03:
  //   - https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=LAB&sectionNum=226.
  // Confirmed: nine required items per §226(a); copies retained at least
  // 3 years on file by the employer.
  // ────────────────────────────────────────────────────────────────────────
  itemized_wage_statements: {
    why: {
      en:
        'California requires nine specific items on every wage statement. Missing or wrong items can trigger statutory penalties even when wages were paid correctly.',
      es:
        'California exige nueve datos específicos en cada talón de pago. Si faltan o están mal, hay multas legales aunque el pago haya sido correcto.',
    },
    how: [
      {
        en: 'Show gross wages earned, total hours worked, and net wages earned.',
        es: 'Muestre el salario bruto, el total de horas trabajadas y el salario neto.',
      },
      {
        en: 'Show all deductions and the inclusive dates of the pay period.',
        es: 'Muestre todas las deducciones y las fechas del periodo de pago.',
      },
      {
        en: 'Include the worker’s name, last 4 of SSN, and the legal name and address of the employer.',
        es: 'Incluya el nombre del trabajador, los últimos 4 del Seguro Social, y el nombre legal y domicilio del empleador.',
      },
      {
        en: 'Show every hourly rate in effect with hours at each rate; for piece work, show units and rates.',
        es: 'Muestre cada tarifa por hora vigente con sus horas; para trabajo a destajo, las unidades y la tarifa.',
      },
      {
        en: 'Keep a copy of every wage statement on file for at least 3 years.',
        es: 'Guarde una copia de cada talón de pago por al menos 3 años.',
      },
    ],
    acceptableEvidence: [
      {
        en: 'Sample wage statement covering all nine required items',
        es: 'Talón de muestra con los nueve datos requeridos',
      },
      {
        en: 'Payroll system audit confirming retention period',
        es: 'Auditoría del sistema de nómina con el periodo de conservación',
      },
      {
        en: 'Worker inspection log if a request was made',
        es: 'Registro de inspecciones si un trabajador las pidió',
      },
    ],
    deadline: {
      en: 'Issued every pay period; copies retained at least 3 years.',
      es: 'Se entrega cada periodo de pago; las copias se guardan al menos 3 años.',
    },
    source: {
      label: 'CA Labor Code §226',
      url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=LAB&sectionNum=226.',
    },
    lastVerified: '2026-05-03',
  },
};

export function getContentForItem(itemKey: string): ComplianceItemContent | null {
  const resolved = ITEM_KEY_ALIASES[itemKey] ?? itemKey;
  return COMPLIANCE_ITEM_CONTENT[resolved] ?? null;
}

// Suppress unused-export warnings if EMPTY is needed elsewhere.
export { EMPTY as _EMPTY_COMPLIANCE_ITEM_CONTENT };

// ────────────────────────────────────────────────────────────────────────────
// TODO — re-verification needed before this content is treated as final:
//
// 1. i_9_forms_on_file / i_9s_expiring_within_30_days
//    USCIS pages (uscis.gov/i-9-central, /i-9, /complete-correct-form-i-9)
//    blocked WebFetch with HTTP 403 in the 2026-05-03 pass. The 3-business-
//    day Section 2 deadline and "3 years from hire OR 1 year after term,
//    whichever is later" retention rule are long-standing USCIS guidance,
//    but a future pass should confirm them directly against the M-274
//    Handbook for Employers.
//
// 2. notice_of_intent
//    Specific NOI lead time before a restricted-material application
//    (commonly cited as 24 hours) was not confirmed from a fetched CDPR
//    page. Wording deliberately stays general ("confirm exact lead time
//    with your County Agricultural Commissioner"). Verify against 3 CCR
//    §6432 / county permit conditions and tighten the deadline string.
//
// 3. application_records_pur
//    Specific monthly PUR deadline (commonly cited as the 10th of the
//    following month) not confirmed from a fetched CDPR page. Verify
//    against 3 CCR §6624 and tighten the deadline string.
//
// 4. pesticide_handler_training_wps
//    Federal recordkeeping period under 40 CFR Part 170 (commonly cited
//    as 2 years for handler training records) not confirmed from a
//    fetched page; ecfr.gov returned a redirect we did not chase. Verify
//    against 40 CFR §170.501 and add a record-retention step.
//
// 5. covid_19_prevention_plan
//    Both ETS sunsets (Feb 3 2025 / Feb 3 2026) are now in the past as of
//    today (2026-05-03). Confirm with Cal/OSHA whether this row should
//    remain in the compliance scaffold at all, or be retired in favor of
//    a generic IIPP item.
// ────────────────────────────────────────────────────────────────────────────
