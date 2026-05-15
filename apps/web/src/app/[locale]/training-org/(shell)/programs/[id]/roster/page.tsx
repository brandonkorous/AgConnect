import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { getOrgProgram, getOrgRoster } from '@/lib/api/training-org';
import { Roster } from '@/components/training-org/Roster';

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function ProgramRosterPage({ params }: Props) {
  const { locale, id } = await params;
  const isEs = locale === 'es';
  const [program, enrollments] = await Promise.all([
    getOrgProgram(id),
    getOrgRoster(id),
  ]);
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

      <header className="mb-6">
        <p className="text-base-content/55 font-mono text-xs uppercase tracking-[0.18em]">
          {isEs ? 'Lista de inscritos' : 'Roster'}
        </p>
        <h1 className="font-serif mt-2 text-[26px] font-normal leading-tight tracking-[-0.025em] sm:text-[32px]">
          {isEs ? program.titleEs : program.titleEn}
        </h1>
        <p className="text-base-content/65 mt-2 text-[13.5px]">
          {program.enrolledCount}/{program.capacity}{' '}
          {isEs ? 'inscritos' : 'enrolled'} ·{' '}
          {new Date(program.startDate).toLocaleDateString(locale, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </header>

      <Roster programId={program.id} enrollments={enrollments} locale={locale} />
    </div>
  );
}
