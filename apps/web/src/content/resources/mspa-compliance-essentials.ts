import type { ResourceArticle } from '../types';

export const mspaComplianceEssentials: ResourceArticle = {
    slug: 'mspa-compliance-essentials',
    category: 'employer_guides',
    publishedAt: '2026-04-14',
    readingMinutes: 6,
    title: {
        en: 'MSPA in plain language: disclosure, recordkeeping, and the things growers miss',
        es: 'MSPA en lenguaje claro: divulgación, mantenimiento de registros y las cosas que los agricultores pasan por alto',
    },
    summary: {
        en: 'The Migrant and Seasonal Agricultural Worker Protection Act sets federal minimums for wage disclosure, housing, transport, and recordkeeping. Most penalties trace back to one of three gaps.',
        es: 'La Ley de Protección al Trabajador Agrícola Migrante y Estacional establece mínimos federales para divulgación salarial, vivienda, transporte y mantenimiento de registros. La mayoría de las multas se remontan a una de tres brechas.',
    },
    sections: [
        {
            heading: {
                en: 'Required disclosures, in writing, in the worker\'s language',
                es: 'Divulgaciones requeridas, por escrito, en el idioma del trabajador',
            },
            body: {
                en: 'Before recruitment, MSPA requires you to disclose in writing: wage rates, the kind of work, the period of employment, transportation and housing costs, the existence of any strike at the worksite, and any commission paid by the employer to the contractor for hiring. The disclosure must be in a language the worker reads. For most California crews, that means Spanish.',
                es: 'Antes del reclutamiento, MSPA requiere que divulgue por escrito: tarifas salariales, el tipo de trabajo, el período de empleo, costos de transporte y vivienda, la existencia de cualquier huelga en el lugar de trabajo y cualquier comisión pagada por el empleador al contratista por contratar. La divulgación debe estar en un idioma que el trabajador lea. Para la mayoría de las cuadrillas de California, eso significa español.',
            },
        },
        {
            heading: {
                en: 'Recordkeeping for three years',
                es: 'Mantenimiento de registros por tres años',
            },
            body: {
                en: 'For each worker, you must keep: full name and permanent address, basis on which wages are paid, number of piecework units earned, hours worked, total pay each pay period, and itemized deductions. These records must be kept for three years. Federal investigators show up unannounced and the first thing they request is your wage records. Missing records are presumed to favor the worker.',
                es: 'Para cada trabajador, debe mantener: nombre completo y dirección permanente, base sobre la cual se pagan los salarios, número de unidades de pago a destajo ganadas, horas trabajadas, pago total en cada período de pago y deducciones desglosadas. Estos registros deben mantenerse por tres años. Los investigadores federales aparecen sin previo aviso y lo primero que solicitan son sus registros salariales. Los registros faltantes se presumen a favor del trabajador.',
            },
        },
        {
            heading: {
                en: 'Vehicle and driver standards',
                es: 'Estándares de vehículos y conductores',
            },
            body: {
                en: 'If you transport workers, the vehicle must meet federal and state safety standards: a valid registration, current insurance at MSPA limits, proper passenger seating with seat belts where required, and a driver with the appropriate California license class. A van that fails inspection is a per-trip violation. Many penalties stack here because every transport day is a separate offense.',
                es: 'Si transporta trabajadores, el vehículo debe cumplir con los estándares federales y estatales de seguridad: un registro válido, seguro actual en los límites de MSPA, asientos de pasajeros adecuados con cinturones de seguridad donde se requiera y un conductor con la clase de licencia de California apropiada. Una camioneta que reprueba la inspección es una violación por viaje. Muchas multas se acumulan aquí porque cada día de transporte es una ofensa separada.',
            },
        },
        {
            heading: {
                en: 'Housing standards if you provide it',
                es: 'Estándares de vivienda si la proporciona',
            },
            body: {
                en: 'If you house workers, the unit must meet federal MSPA housing standards plus any stricter state or local rules. Common failures: insufficient toilets and showers per occupant, lack of food storage and cooking facilities, vector control issues, and insufficient ventilation in sleeping rooms. Cal/OSHA also requires a written certificate of inspection before occupancy.',
                es: 'Si aloja a trabajadores, la unidad debe cumplir con los estándares federales de vivienda MSPA más cualquier regla estatal o local más estricta. Fallas comunes: insuficientes inodoros y duchas por ocupante, falta de almacenamiento y cocción de alimentos, problemas de control de vectores y ventilación insuficiente en dormitorios. Cal/OSHA también requiere un certificado escrito de inspección antes de la ocupación.',
            },
        },
        {
            heading: {
                en: 'The three audit gaps that cost the most',
                es: 'Las tres brechas de auditoría que más cuestan',
            },
            body: {
                en: 'In wage and hour enforcement data, the highest-cost MSPA violations are: failure to provide written disclosures in Spanish, failure to keep complete payroll records, and failure to maintain transportation insurance at MSPA-required levels. Each is a paperwork issue you can close before any inspector arrives. AgConn\'s employer dashboard prompts you when each of these is approaching expiry.',
                es: 'En los datos de cumplimiento de salarios y horas, las violaciones MSPA de mayor costo son: no proporcionar divulgaciones escritas en español, no mantener registros de nómina completos y no mantener el seguro de transporte en los niveles requeridos por MSPA. Cada una es un problema de papeleo que puede cerrar antes de que llegue cualquier inspector. El panel del empleador de AgConn le avisa cuando cada uno de estos se acerca a su vencimiento.',
            },
        },
    ],
};
