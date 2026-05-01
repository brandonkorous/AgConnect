import type { ResourceArticle } from '../types';

export const postingJobsThatFill: ResourceArticle = {
    slug: 'posting-jobs-that-fill',
    category: 'employer_guides',
    publishedAt: '2026-04-25',
    readingMinutes: 4,
    title: {
        en: 'Posting jobs that actually fill: lessons from 200 farmworker applications',
        es: 'Publicar trabajos que realmente se llenen: lecciones de 200 solicitudes de trabajadores agrícolas',
    },
    summary: {
        en: 'Wage transparency, transport, and start date specifics drive the largest application-rate differences in our pilot data. Here is what to keep, what to drop.',
        es: 'La transparencia salarial, el transporte y los detalles de la fecha de inicio impulsan las mayores diferencias en la tasa de solicitudes en nuestros datos piloto. Esto es lo que debe mantener y lo que debe eliminar.',
    },
    sections: [
        {
            heading: {
                en: 'Wage range or hourly, never "competitive"',
                es: 'Rango salarial u hora, nunca "competitivo"',
            },
            body: {
                en: 'Listings that include a specific hourly wage or piece rate received 3.4x more applications in pilot data than listings that said "competitive" or omitted wages. Workers calculate quickly: gas, transport time, and time away from family are real costs. A vague wage signals you are not ready to commit, and the application rates reflect that.',
                es: 'Las publicaciones que incluyen un salario por hora específico o tarifa de pago a destajo recibieron 3.4x más solicitudes en datos piloto que las publicaciones que decían "competitivo" u omitían salarios. Los trabajadores calculan rápido: gasolina, tiempo de transporte y tiempo fuera de la familia son costos reales. Un salario vago señala que no está listo para comprometerse, y las tasas de solicitud lo reflejan.',
            },
        },
        {
            heading: {
                en: 'Transport: yes, no, or pickup point',
                es: 'Transporte: sí, no o punto de recogida',
            },
            body: {
                en: 'For workers without reliable transport, "no transport provided" is not a deal-breaker if you state a specific pickup or meeting point near a population center. The deal-breaker is uncertainty. Listings that name a Tulare or Fresno meeting location, plus the time, fill 60% faster than listings that just give a field GPS coordinate.',
                es: 'Para los trabajadores sin transporte confiable, "no se proporciona transporte" no es un factor decisivo si establece un punto de recogida o encuentro específico cerca de un centro poblacional. El factor decisivo es la incertidumbre. Las publicaciones que nombran una ubicación de encuentro en Tulare o Fresno, más la hora, se llenan 60% más rápido que las publicaciones que solo dan una coordenada GPS de campo.',
            },
        },
        {
            heading: {
                en: 'Specific start dates beat ranges',
                es: 'Las fechas de inicio específicas vencen a los rangos',
            },
            body: {
                en: '"Starts April 22" outperforms "starts in late April" by a wide margin. Workers plan around exact dates. They have other work to confirm or decline, family logistics, and often a tight window between seasons. A specific date is a commitment they can plan around. A range reads as "we are not sure".',
                es: '"Comienza el 22 de abril" supera a "comienza a finales de abril" por un amplio margen. Los trabajadores planean alrededor de fechas exactas. Tienen otro trabajo que confirmar o rechazar, logística familiar y a menudo una ventana ajustada entre temporadas. Una fecha específica es un compromiso alrededor del cual pueden planear. Un rango se lee como "no estamos seguros".',
            },
        },
        {
            heading: {
                en: 'Bilingual posting beats English-only',
                es: 'Publicación bilingüe vence a solo inglés',
            },
            body: {
                en: 'Spanish-only listings outperform English-only listings in California Central Valley applications by 5x. Bilingual listings outperform Spanish-only by another 25%, mostly from second-generation workers who scan in English first. AgConn auto-generates the Spanish version of any English posting, so this is no longer a content lift.',
                es: 'Las publicaciones solo en español superan a las publicaciones solo en inglés en las solicitudes del Valle Central de California por 5x. Las publicaciones bilingües superan a las solo en español por otro 25%, principalmente de trabajadores de segunda generación que escanean primero en inglés. AgConn genera automáticamente la versión en español de cualquier publicación en inglés, por lo que esto ya no es una carga de contenido.',
            },
        },
    ],
};
