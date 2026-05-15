import type { ResourceArticle } from '../types';

export const flcLicenseBasics: ResourceArticle = {
    slug: 'flc-license-basics',
    category: 'employer_guides',
    publishedAt: '2026-04-18',
    readingMinutes: 7,
    title: {
        en: 'Farm Labor Contractor licensing in California: a current operator\'s checklist',
        es: 'Licencia de Contratista de Trabajo Agrícola en California: lista de verificación para operadores actuales',
    },
    summary: {
        en: 'California requires both a state FLC license and federal MSPA registration. Here is what to renew, when, and what fails an audit fastest.',
        es: 'California requiere tanto una licencia estatal de FLC como registro federal MSPA. Esto es lo que se debe renovar, cuándo y qué reprueba una auditoría más rápido.',
    },
    sections: [
        {
            heading: {
                en: 'Two licenses, not one',
                es: 'Dos licencias, no una',
            },
            body: {
                en: 'California Labor Code 1682 requires every farm labor contractor operating in the state to hold a valid CA FLC license. If you transport workers across state lines or contract for crops moving in interstate commerce, you also need federal MSPA Farm Labor Contractor registration from the U.S. Department of Labor. Most California operators need both.',
                es: 'El Código Laboral de California 1682 requiere que todo contratista de trabajo agrícola que opere en el estado tenga una licencia FLC de CA válida. Si transporta trabajadores a través de líneas estatales o contrata para cultivos que se mueven en comercio interestatal, también necesita registro federal MSPA de Contratista de Trabajo Agrícola del Departamento de Trabajo de EE. UU. La mayoría de los operadores de California necesitan ambos.',
            },
        },
        {
            heading: {
                en: 'Annual renewal mechanics',
                es: 'Mecánica de renovación anual',
            },
            body: {
                en: 'The CA FLC license expires one year from the issue date. Renewal requires a written exam (Spanish or English), proof of a $25,000 surety bond, current workers\' comp coverage for every employee, and a clean wage record. Late renewals carry a $100 fee plus the risk of operating unlicensed, which is a misdemeanor and exposes you and the grower you contract with to joint liability.',
                es: 'La licencia FLC de CA expira un año después de la fecha de emisión. La renovación requiere un examen escrito (español o inglés), prueba de fianza de $25,000, cobertura actual de compensación laboral para cada empleado y un registro salarial limpio. Las renovaciones tardías conllevan una tarifa de $100 más el riesgo de operar sin licencia, lo cual es un delito menor y lo expone a usted y al agricultor con quien contrata a responsabilidad conjunta.',
            },
        },
        {
            heading: {
                en: 'What fails the audit fastest',
                es: 'Qué reprueba la auditoría más rápido',
            },
            body: {
                en: 'In our review of recent enforcement actions, the top three audit failures are: incomplete itemized wage statements (no piece-rate breakdown, missing crew or field identifier), gaps in vehicle registration or driver licensing for crew transport, and missing or expired pesticide handler training certificates for crews working in treated fields. Each of these is a deficiency you can fix today before an inspector ever shows up.',
                es: 'En nuestra revisión de acciones de cumplimiento recientes, las tres principales fallas de auditoría son: declaraciones de salarios desglosadas incompletas (sin desglose de pago a destajo, falta de identificador de cuadrilla o campo), brechas en el registro de vehículos o licencias de conducir para transporte de cuadrillas, y certificados de capacitación de manejo de pesticidas faltantes o vencidos para cuadrillas que trabajan en campos tratados. Cada uno de estos es una deficiencia que puede corregir hoy antes de que un inspector aparezca.',
            },
        },
        {
            heading: {
                en: 'Joint liability with the grower',
                es: 'Responsabilidad conjunta con el agricultor',
            },
            body: {
                en: 'California Labor Code 2810.3 makes growers jointly liable for wage and workers\' comp violations by their FLCs. That means growers screen contractors closely. Showing your license number, MSPA registration, and current bond on a tenant profile makes you easier to engage and harder to skip over. Hiding any of those signals risk.',
                es: 'El Código Laboral de California 2810.3 hace que los agricultores sean responsables conjuntamente de violaciones salariales y de compensación laboral por parte de sus FLCs. Eso significa que los agricultores examinan a los contratistas de cerca. Mostrar su número de licencia, registro MSPA y fianza actual en un perfil de inquilino lo hace más fácil de contratar y más difícil de pasar por alto. Ocultar cualquiera de estos señaliza riesgo.',
            },
        },
        {
            heading: {
                en: 'How AGCONN handles verification',
                es: 'Cómo AGCONN maneja la verificación',
            },
            body: {
                en: 'When you create an employer tenant on AGCONN, we verify your CA FLC license number against the Division of Labor Standards Enforcement public registry and check MSPA status with the U.S. Department of Labor. Verified employers display a badge to job seekers, which materially improves application rates. We re-verify annually.',
                es: 'Cuando crea un inquilino empleador en AGCONN, verificamos su número de licencia FLC de CA contra el registro público de la División de Cumplimiento de Estándares Laborales y verificamos el estado MSPA con el Departamento de Trabajo de EE. UU. Los empleadores verificados muestran una insignia a los solicitantes de empleo, lo que mejora materialmente las tasas de solicitud. Re-verificamos anualmente.',
            },
        },
    ],
};
