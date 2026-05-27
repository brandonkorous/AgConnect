import type { Metadata } from 'next';
import { ApplicantDetailClient } from './ApplicantDetailClient';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'AGCONN — Applicant' };
}

export default async function ApplicantDetailPage({ params }: Props) {
  const { id } = await params;
  return <ApplicantDetailClient id={id} />;
}
