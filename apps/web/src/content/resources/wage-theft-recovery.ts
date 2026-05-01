import type { ResourceArticle } from '../types';

export const wageTheftRecovery: ResourceArticle = {
    slug: 'wage-theft-recovery',
    category: 'workers_rights',
    publishedAt: '2026-04-08',
    readingMinutes: 5,
    title: {
        en: 'When wages go missing: a farmworker guide to recovering pay in California',
        es: 'Cuando faltan los salarios: una guía para trabajadores agrícolas para recuperar el pago en California',
    },
    summary: {
        en: 'Unpaid hours, missing piece-rate slips, illegal deductions. California law gives you tools to recover what you earned, even years later.',
        es: 'Horas no pagadas, comprobantes de pago a destajo faltantes, deducciones ilegales. La ley de California le da herramientas para recuperar lo que ganó, incluso años después.',
    },
    sections: [
        {
            heading: {
                en: 'Keep your own record',
                es: 'Mantenga su propio registro',
            },
            body: {
                en: 'The single most important thing you can do is write down your hours, your crew, the field name or address, and the labor contractor or grower for every day you work. A small notebook or a phone note works. If a wage dispute happens later, your record is admissible evidence and often more reliable than the employer\'s.',
                es: 'Lo más importante que puede hacer es anotar sus horas, su cuadrilla, el nombre o dirección del campo y el contratista de trabajo o agricultor de cada día que trabaje. Un cuaderno pequeño o una nota en el teléfono sirve. Si surge una disputa salarial más tarde, su registro es evidencia admisible y a menudo más confiable que la del empleador.',
            },
        },
        {
            heading: {
                en: 'The three-year window',
                es: 'La ventana de tres años',
            },
            body: {
                en: 'You have three years from the date a wage was due to file a claim with the California Labor Commissioner. For overtime, minimum wage, or piece-rate disputes, that clock matters. If part of the claim involves a contract violation, it may extend to four years. Do not wait — but do not assume it is too late.',
                es: 'Tiene tres años desde la fecha en que se debía un salario para presentar un reclamo ante el Comisionado del Trabajo de California. Para disputas de horas extras, salario mínimo o pago a destajo, ese plazo importa. Si parte del reclamo involucra una violación de contrato, puede extenderse a cuatro años. No espere — pero no asuma que es demasiado tarde.',
            },
        },
        {
            heading: {
                en: 'Filing with the Labor Commissioner',
                es: 'Presentar ante el Comisionado del Trabajo',
            },
            body: {
                en: 'Filing is free. You do not need a lawyer. The form is available in Spanish, and the agency holds settlement conferences and hearings in either language with interpreters. The Labor Commissioner can recover unpaid wages, waiting-time penalties, and interest. They can also reach the grower directly when a labor contractor is the formal employer.',
                es: 'Presentar es gratuito. No necesita abogado. El formulario está disponible en español, y la agencia celebra conferencias de conciliación y audiencias en cualquiera de los dos idiomas con intérpretes. El Comisionado del Trabajo puede recuperar salarios no pagados, multas por demora en el pago e intereses. También pueden llegar directamente al agricultor cuando el contratista de trabajo es el empleador formal.',
            },
        },
        {
            heading: {
                en: 'Joint liability with growers',
                es: 'Responsabilidad conjunta con los agricultores',
            },
            body: {
                en: 'Under California Labor Code 2810.3 and federal MSPA rules, the grower whose land you worked on can be held responsible alongside the farm labor contractor. If the FLC closes shop or disappears, the grower is still on the hook. This is one of the strongest protections farmworkers have, and many do not know it exists.',
                es: 'Bajo el Código Laboral de California 2810.3 y las reglas federales de MSPA, el agricultor en cuya tierra trabajó puede ser responsabilizado junto con el contratista de trabajo agrícola. Si el FLC cierra o desaparece, el agricultor sigue siendo responsable. Esta es una de las protecciones más fuertes que tienen los trabajadores agrícolas, y muchos no saben que existe.',
            },
        },
        {
            heading: {
                en: 'No retaliation, ever',
                es: 'Sin represalias, nunca',
            },
            body: {
                en: 'It is illegal for an employer to fire, blacklist, threaten immigration consequences, or otherwise retaliate against you for asking about pay, filing a claim, or talking with coworkers about wages. If retaliation happens, that becomes a separate legal claim with its own penalties. Your immigration status does not change your right to be paid for work you performed.',
                es: 'Es ilegal que un empleador despida, ponga en lista negra, amenace con consecuencias migratorias o tome represalias en su contra por preguntar sobre el pago, presentar un reclamo o hablar con compañeros sobre salarios. Si ocurren represalias, eso se convierte en un reclamo legal separado con sus propias penalidades. Su estatus migratorio no cambia su derecho a ser pagado por el trabajo que realizó.',
            },
        },
    ],
};
