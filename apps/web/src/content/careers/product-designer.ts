import type { CareerRole } from '../types';

export const productDesigner: CareerRole = {
    slug: 'product-designer',
    team: 'design',
    location: 'Remote (US)',
    employmentType: 'full_time',
    salaryRange: '$135,000 – $170,000',
    postedAt: '2026-04-22',
    title: {
        en: 'Product Designer (Bilingual UI)',
        es: 'Diseñador o Diseñadora de Producto (UI Bilingüe)',
    },
    summary: {
        en: 'Lead product design across worker, employer, and admin surfaces. The interface is bilingual by default; you will design with both Spanish and English text in view at every step, not as an afterthought localization pass.',
        es: 'Lidere el diseño de producto en las superficies de trabajadores, empleadores y administradores. La interfaz es bilingüe por defecto; diseñará con texto tanto en español como en inglés a la vista en cada paso, no como un pase de localización de último momento.',
    },
    responsibilities: [
        {
            en: 'Design the worker dashboard, job search, and skills wallet experience for low-end Android devices and patchy cellular connectivity.',
            es: 'Diseñe el panel del trabajador, la búsqueda de empleo y la experiencia de la cartera de habilidades para dispositivos Android de gama baja y conectividad celular irregular.',
        },
        {
            en: 'Maintain and extend the Tierra design system — bilingual typography, civic-utilitarian voice, daisyUI + Tailwind. We share this work openly with workforce-board partners.',
            es: 'Mantenga y extienda el sistema de diseño Tierra — tipografía bilingüe, voz cívico-utilitaria, daisyUI + Tailwind. Compartimos este trabajo abiertamente con socios de juntas laborales.',
        },
        {
            en: 'Run usability sessions with farmworkers in Spanish-language settings; bring back synthesized findings and design changes.',
            es: 'Realice sesiones de usabilidad con trabajadores agrícolas en entornos de habla hispana; traiga de vuelta hallazgos sintetizados y cambios de diseño.',
        },
        {
            en: 'Pair with engineers daily. Design specs are made to be implemented, not admired in Figma.',
            es: 'Empareje con ingenieros diariamente. Las especificaciones de diseño están hechas para ser implementadas, no admiradas en Figma.',
        },
    ],
    qualifications: [
        {
            en: '5+ years of product design experience shipping consumer or enterprise software with strong typography and information-density tradeoffs.',
            es: '5+ años de experiencia en diseño de producto enviando software para consumidores o empresas con fuertes compensaciones de tipografía y densidad de información.',
        },
        {
            en: 'Demonstrated ability to design for low-bandwidth, low-cost devices, and not just for high-end iOS.',
            es: 'Capacidad demostrada para diseñar para dispositivos de bajo ancho de banda y bajo costo, y no solo para iOS de gama alta.',
        },
        {
            en: 'Comfort designing in two languages simultaneously (Spanish and English). Extra weight if you are a fluent Spanish speaker.',
            es: 'Comodidad diseñando en dos idiomas simultáneamente (español e inglés). Peso adicional si es un hablante fluido de español.',
        },
        {
            en: 'Portfolio that shows production work, including final shipped UI and the constraints you navigated.',
            es: 'Portafolio que muestra trabajo de producción, incluyendo la interfaz de usuario final entregada y las limitaciones que navegó.',
        },
    ],
    niceToHave: [
        {
            en: 'Background in civic technology, public benefits, or workforce systems.',
            es: 'Antecedentes en tecnología cívica, beneficios públicos o sistemas laborales.',
        },
    ],
};
