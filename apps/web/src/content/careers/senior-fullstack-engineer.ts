import type { CareerRole } from '../types';

export const seniorFullstackEngineer: CareerRole = {
    slug: 'senior-fullstack-engineer',
    team: 'engineering',
    location: 'Fresno, CA / Remote (US)',
    employmentType: 'full_time',
    salaryRange: '$165,000 – $205,000',
    postedAt: '2026-04-15',
    title: {
        en: 'Senior Full-Stack Engineer',
        es: 'Ingeniera o Ingeniero Full-Stack Senior',
    },
    summary: {
        en: 'Own end-to-end features across the AGCONN worker app, employer dashboard, and public API. TypeScript, Next.js, Postgres, and a multi-tenant architecture with row-level security throughout.',
        es: 'Tome propiedad de funciones de extremo a extremo en la aplicación de trabajadores de AGCONN, el panel del empleador y la API pública. TypeScript, Next.js, Postgres y una arquitectura multi-inquilino con seguridad a nivel de fila en todo.',
    },
    responsibilities: [
        {
            en: 'Ship features across the worker PWA, employer dashboard, and Hono REST API. We do not silo by stack; you will work in TypeScript across all three.',
            es: 'Entregue funciones en la PWA del trabajador, el panel del empleador y la API REST de Hono. No silenciamos por stack; trabajará en TypeScript en los tres.',
        },
        {
            en: 'Design Postgres schemas with row-level security policies for multi-tenant data isolation. Every table has a tenant_id; you will write the migrations, the policies, and the application-level checks.',
            es: 'Diseñe esquemas de Postgres con políticas de seguridad a nivel de fila para el aislamiento de datos multi-inquilino. Cada tabla tiene un tenant_id; escribirá las migraciones, las políticas y las verificaciones a nivel de aplicación.',
        },
        {
            en: 'Improve performance and reliability across the worker-facing experience, which runs on low-end Android devices over patchy cellular connectivity.',
            es: 'Mejore el rendimiento y la confiabilidad en la experiencia orientada al trabajador, que se ejecuta en dispositivos Android de gama baja sobre conectividad celular irregular.',
        },
        {
            en: 'Pair regularly with our Spanish-speaking design and content reviewers; bilingual delivery is a feature, not an afterthought.',
            es: 'Empareje regularmente con nuestros revisores de diseño y contenido de habla hispana; la entrega bilingüe es una característica, no una idea de último momento.',
        },
    ],
    qualifications: [
        {
            en: '6+ years of production experience shipping web applications with TypeScript or another typed language.',
            es: '6+ años de experiencia en producción enviando aplicaciones web con TypeScript u otro lenguaje tipado.',
        },
        {
            en: 'Comfort with relational databases, including writing migrations, indexing for query performance, and reasoning about transaction isolation.',
            es: 'Comodidad con bases de datos relacionales, incluyendo escribir migraciones, indexar para el rendimiento de consultas y razonar sobre el aislamiento de transacciones.',
        },
        {
            en: 'Track record of owning features through the full lifecycle — research, design, implementation, observability, support.',
            es: 'Historial de tomar propiedad de funciones a través del ciclo de vida completo — investigación, diseño, implementación, observabilidad, soporte.',
        },
        {
            en: 'Genuine interest in the AGCONN mission. We want engineers who are curious about why farmworker turnover is high and what software can actually do about it.',
            es: 'Interés genuino en la misión de AGCONN. Queremos ingenieros curiosos sobre por qué la rotación de trabajadores agrícolas es alta y qué puede hacer realmente el software al respecto.',
        },
    ],
    niceToHave: [
        {
            en: 'Spanish proficiency, especially conversational ability with workers in the Central Valley.',
            es: 'Dominio del español, especialmente la capacidad conversacional con trabajadores del Valle Central.',
        },
        {
            en: 'Experience with Clerk, Stripe, Twilio, or similar API-driven service integrations.',
            es: 'Experiencia con Clerk, Stripe, Twilio o integraciones similares de servicios impulsadas por API.',
        },
        {
            en: 'Background in workforce, civic, or public-interest technology.',
            es: 'Antecedentes en tecnología laboral, cívica o de interés público.',
        },
    ],
};
