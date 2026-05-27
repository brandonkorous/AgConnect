import type { Metadata } from 'next';
import { JobDetailClient } from './JobDetailClient';

type Props = { params: Promise<{ locale: string; slug: string }> };

// Server entry stays thin. Metadata is generated from a brief server-side
// fetch via the existing server fetcher (we want SEO + share titles); the
// rendered UI is fully client-driven inside JobDetailClient.

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const { fetchJob } = await import('@/lib/api/jobs');
  const job = await fetchJob(slug);
  if (!job) return { title: 'Job' };
  if (job === 'gone') {
    return {
      title: locale === 'es' ? 'Vacante cerrada · AGCONN' : 'Listing closed · AGCONN',
      robots: { index: false, follow: false },
    };
  }
  return { title: locale === 'es' ? job.titleEs : job.titleEn };
}

export default async function JobDetailPage({ params }: Props) {
  const { slug } = await params;
  return <JobDetailClient slug={slug} />;
}
