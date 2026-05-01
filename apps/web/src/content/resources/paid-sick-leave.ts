import type { ResourceArticle } from '../types';

export const paidSickLeave: ResourceArticle = {
    slug: 'paid-sick-leave',
    category: 'workers_rights',
    publishedAt: '2026-04-03',
    readingMinutes: 4,
    title: {
        en: 'Paid sick leave for farmworkers: how California law protects you',
        es: 'Licencia por enfermedad pagada para trabajadores agrícolas: cómo lo protege la ley de California',
    },
    summary: {
        en: 'Five days or 40 hours of paid sick leave per year. It accrues from day one, applies to seasonal work, and cannot be used as a reason to fire you.',
        es: 'Cinco días o 40 horas de licencia por enfermedad pagada por año. Se acumula desde el primer día, aplica al trabajo de temporada y no puede usarse como motivo para despedirlo.',
    },
    sections: [
        {
            heading: {
                en: 'Who qualifies',
                es: 'Quién califica',
            },
            body: {
                en: 'Every employee who works at least 30 days in California in a year for the same employer qualifies. That includes farmworkers paid by the hour, by piece rate, or by the day. It includes workers hired through a labor contractor. It includes you whether you have legal status or not.',
                es: 'Todo empleado que trabaje al menos 30 días en California en un año para el mismo empleador califica. Eso incluye a trabajadores agrícolas pagados por hora, por destajo o por día. Incluye a trabajadores contratados por un contratista de trabajo. Lo incluye a usted, tenga estatus legal o no.',
            },
        },
        {
            heading: {
                en: 'How it accrues',
                es: 'Cómo se acumula',
            },
            body: {
                en: 'You earn one hour of sick leave for every 30 hours worked, starting on your first day. Your employer can let you start using it after 90 days. They can cap your annual use at 40 hours or five days, whichever is more for your schedule. Unused hours roll over, though they can cap the bank at 80 hours.',
                es: 'Gana una hora de licencia por enfermedad por cada 30 horas trabajadas, comenzando el primer día. Su empleador puede permitirle comenzar a usarla después de 90 días. Pueden limitar su uso anual a 40 horas o cinco días, lo que sea más para su horario. Las horas no usadas se acumulan, aunque pueden limitar el banco a 80 horas.',
            },
        },
        {
            heading: {
                en: 'What you can use it for',
                es: 'Para qué puede usarla',
            },
            body: {
                en: 'Sick leave covers your own illness, preventive care like a doctor visit, caring for a sick family member (including spouse, child, parent, sibling, or grandparent), and time related to domestic violence, sexual assault, or stalking. The employer cannot require a doctor\'s note for short absences and cannot make you find a replacement worker.',
                es: 'La licencia por enfermedad cubre su propia enfermedad, cuidado preventivo como una visita al médico, cuidar a un familiar enfermo (incluyendo cónyuge, hijo, padre, hermano o abuelo) y tiempo relacionado con violencia doméstica, asalto sexual o acoso. El empleador no puede exigir nota médica por ausencias cortas y no puede obligarlo a encontrar un trabajador de reemplazo.',
            },
        },
        {
            heading: {
                en: 'What protected absence means',
                es: 'Qué significa ausencia protegida',
            },
            body: {
                en: 'When you use sick leave properly, the absence is protected. Your employer cannot count it against you, fire you over it, or refuse to rehire you next season because of it. If they do, you have a retaliation claim with the Labor Commissioner. Save your records — pay stubs, schedules, the date and reason you called out.',
                es: 'Cuando usa la licencia por enfermedad correctamente, la ausencia está protegida. Su empleador no puede tomarla en su contra, despedirlo por ella ni negarse a recontratarlo la próxima temporada por su causa. Si lo hacen, tiene un reclamo de represalia con el Comisionado del Trabajo. Guarde sus registros — talones de pago, horarios, la fecha y el motivo por el que llamó.',
            },
        },
    ],
};
