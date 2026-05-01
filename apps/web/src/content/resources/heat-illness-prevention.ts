import type { ResourceArticle } from '../types';

export const heatIllnessPrevention: ResourceArticle = {
    slug: 'heat-illness-prevention',
    category: 'workers_rights',
    publishedAt: '2026-04-12',
    readingMinutes: 6,
    title: {
        en: 'Heat illness prevention: what California growers must provide',
        es: 'Prevención de enfermedades por calor: lo que los agricultores de California deben proveer',
    },
    summary: {
        en: 'Cal/OSHA standard 3395 sets the rules for shade, water, rest, and acclimatization. Here is what every farmworker should expect on the job.',
        es: 'La norma 3395 de Cal/OSHA establece las reglas sobre sombra, agua, descansos y aclimatación. Esto es lo que cada trabajador agrícola debe esperar en el trabajo.',
    },
    sections: [
        {
            heading: {
                en: 'Water that is fresh, cool, and free',
                es: 'Agua fresca, fría y gratuita',
            },
            body: {
                en: 'Employers must provide enough drinking water for at least one quart per worker per hour for the entire shift. Water has to be located as close as practicable to where workers are working. If you ever run out, that is a violation.',
                es: 'Los empleadores deben proporcionar suficiente agua potable para al menos un cuarto de galón por trabajador por hora durante todo el turno. El agua debe estar ubicada lo más cerca posible de donde los trabajadores están trabajando. Si alguna vez se queda sin agua, eso es una violación.',
            },
        },
        {
            heading: {
                en: 'Shade when temperatures hit 80°F',
                es: 'Sombra cuando la temperatura llega a 80°F',
            },
            body: {
                en: 'Once outdoor temperatures reach 80 degrees Fahrenheit, the employer must have shade structures up and accessible. Shade must be enough to fit all workers on recovery breaks at the same time without forcing physical contact. You have the right to a cool-down rest in the shade for at least five minutes whenever you feel you need it, with no questions asked and no penalty.',
                es: 'Una vez que las temperaturas exteriores alcanzan los 80 grados Fahrenheit, el empleador debe tener estructuras de sombra disponibles y accesibles. La sombra debe ser suficiente para acomodar a todos los trabajadores en descansos de recuperación al mismo tiempo sin forzar contacto físico. Usted tiene derecho a un descanso para refrescarse en la sombra de al menos cinco minutos cuando sienta que lo necesita, sin preguntas y sin penalización.',
            },
        },
        {
            heading: {
                en: 'High-heat procedures above 95°F',
                es: 'Procedimientos de alto calor por encima de 95°F',
            },
            body: {
                en: 'When temperatures hit 95°F, additional rules kick in. Pre-shift meetings must cover heat illness prevention. The employer must observe workers for warning signs, designate someone to call for help in an emergency, and provide a mandatory ten-minute cool-down rest every two hours.',
                es: 'Cuando las temperaturas alcanzan 95°F, entran en vigor reglas adicionales. Las reuniones previas al turno deben cubrir la prevención de enfermedades por calor. El empleador debe observar a los trabajadores en busca de señales de advertencia, designar a alguien para llamar por ayuda en una emergencia y proporcionar un descanso obligatorio de diez minutos para refrescarse cada dos horas.',
            },
        },
        {
            heading: {
                en: 'Acclimatization for new workers',
                es: 'Aclimatación para trabajadores nuevos',
            },
            body: {
                en: 'New workers and any worker returning to high heat after a week or more away must be closely observed for the first 14 days. The body needs time to adjust. If you are new on a crew, your supervisor should ease you in, not push you to match veteran pace.',
                es: 'Los trabajadores nuevos y cualquier trabajador que regrese al calor alto después de una semana o más fuera deben ser observados de cerca durante los primeros 14 días. El cuerpo necesita tiempo para ajustarse. Si es nuevo en una cuadrilla, su supervisor debe integrarlo gradualmente, no presionarlo para igualar el ritmo de los veteranos.',
            },
        },
        {
            heading: {
                en: 'How to report a violation',
                es: 'Cómo reportar una violación',
            },
            body: {
                en: 'Cal/OSHA accepts complaints in Spanish or English by phone, online, or in person. You can stay anonymous. Retaliation against a worker who reports is illegal. If a coworker shows signs of heat illness — confusion, stopped sweating, vomiting — that is a medical emergency. Call 911 first, then report.',
                es: 'Cal/OSHA acepta quejas en español o en inglés por teléfono, en línea o en persona. Puede permanecer anónimo. La represalia contra un trabajador que reporta es ilegal. Si un compañero de trabajo muestra signos de enfermedad por calor — confusión, deja de sudar, vómitos — eso es una emergencia médica. Llame al 911 primero, luego reporte.',
            },
        },
    ],
};
