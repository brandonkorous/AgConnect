import { notFound } from 'next/navigation';
import { getEmployerJob } from '@/lib/api/employer';
import { JobForm } from '@/components/employer/JobForm';

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function EditJobPage({ params }: Props) {
  const { locale, id } = await params;
  const job = await getEmployerJob(id);
  if (!job) notFound();

  return (
    <div className="px-8 pb-16 pt-8">
      <JobForm
        locale={locale}
        mode="edit"
        initial={{
          id: job.id,
          titleEn: job.titleEn,
          titleEs: job.titleEs,
          descriptionEn: '',
          descriptionEs: '',
          county: job.county,
          wageMin: job.wageMin,
          wageMax: job.wageMax,
          startDate: job.startDate,
          endDate: job.endDate,
          skills: job.skills,
          positionsTotal: job.positionsTotal,
        }}
      />
    </div>
  );
}
