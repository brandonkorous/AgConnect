import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { getOrgProgram } from '@/lib/api/training-org';
import { ProgramEditForm } from '@/components/training-org/ProgramEditForm';
import { CancelProgramButton } from '@/components/training-org/CancelProgramButton';

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function ProgramEditPage({ params }: Props) {
  const { locale, id } = await params;
  const isEs = locale === 'es';
  const program = await getOrgProgram(id);
  if (!program) notFound();

  return (
    <div className="px-6 pb-16 pt-8 lg:px-8">
      <Link
        href={`/${locale}/training-org/programs`}
        className="text-base-content/70 hover:text-base-content mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
        {isEs ? 'Todos los programas' : 'All programs'}
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base-content/55 font-mono text-xs uppercase tracking-[0.18em]">
            {isEs ? 'Editar' : 'Edit'}
          </p>
          <h1 className="font-serif mt-2 text-[26px] font-normal leading-tight tracking-[-0.025em] sm:text-[32px]">
            {isEs ? program.titleEs : program.titleEn}
          </h1>
        </div>
        <CancelProgramButton
          programId={program.id}
          enrolledCount={program.enrolledCount}
          locale={locale}
        />
      </header>

      <ProgramEditForm program={program} locale={locale} />
    </div>
  );
}
