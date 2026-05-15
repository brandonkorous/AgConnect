import Link from 'next/link';
import type { Route } from 'next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faUsersLine } from '@fortawesome/free-solid-svg-icons';
import { listOrgPrograms, type ProgramCardView } from '@/lib/api/training-org';

type Props = { params: Promise<{ locale: string }> };

const STATUS_LABEL_EN: Record<ProgramCardView['status'], string> = {
  draft: 'Draft',
  active: 'Active',
  full: 'Full',
  closed: 'Closed',
  canceled: 'Canceled',
};
const STATUS_LABEL_ES: Record<ProgramCardView['status'], string> = {
  draft: 'Borrador',
  active: 'Activo',
  full: 'Lleno',
  closed: 'Cerrado',
  canceled: 'Cancelado',
};
const STATUS_TONE: Record<ProgramCardView['status'], string> = {
  draft: 'badge-ghost',
  active: 'badge-success',
  full: 'badge-warning',
  closed: 'badge-neutral',
  canceled: 'badge-error',
};

export default async function ProgramsListPage({ params }: Props) {
  const { locale } = await params;
  const isEs = locale === 'es';
  const programs = await listOrgPrograms();

  return (
    <div className="px-6 pb-16 pt-8 lg:px-8">
      <header className="mb-6">
        <p className="text-base-content/55 font-mono text-xs uppercase tracking-[0.18em]">
          {isEs ? 'Capacitación' : 'Training'}
        </p>
        <h1 className="font-serif mt-2 text-[28px] font-normal leading-tight tracking-[-0.025em] sm:text-[36px]">
          {isEs ? 'Tus programas' : 'Your programs'}
        </h1>
        <p className="text-base-content/70 mt-2 text-[14.5px]">
          {isEs
            ? 'Edita la descripción, gestiona la lista de inscritos o cancela un programa.'
            : 'Edit descriptions, manage the roster, or cancel a program.'}
        </p>
      </header>

      {programs.length === 0 ? (
        <div className="border-base-300 bg-base-100 rounded-2xl border p-8 text-center">
          <p className="text-base-content/70 text-[14px]">
            {isEs ? 'Todavía no tienes programas.' : 'No programs yet.'}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {programs.map((p) => (
            <li
              key={p.id}
              className="border-base-300 bg-base-100 rounded-2xl border p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span
                      className={`badge ${STATUS_TONE[p.status]} badge-sm font-mono tracking-wider uppercase`}
                    >
                      {(isEs ? STATUS_LABEL_ES : STATUS_LABEL_EN)[p.status]}
                    </span>
                    <span className="text-base-content/55 font-mono text-xs uppercase tracking-[0.14em]">
                      {p.county}
                    </span>
                  </div>
                  <h2 className="text-[18px] font-semibold leading-tight">
                    {isEs ? p.titleEs : p.titleEn}
                  </h2>
                  <p className="text-base-content/65 mt-1 text-[13px]">
                    {new Date(p.startDate).toLocaleDateString(locale, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    · {p.enrolledCount}/{p.capacity}{' '}
                    {isEs ? 'inscritos' : 'enrolled'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={
                      `/${locale}/training-org/programs/${p.id}/roster` as Route
                    }
                    className="btn btn-sm btn-ghost rounded-full"
                  >
                    <FontAwesomeIcon icon={faUsersLine} className="h-3.5 w-3.5" />
                    {isEs ? 'Lista' : 'Roster'}
                  </Link>
                  {p.status !== 'canceled' && p.status !== 'closed' && (
                    <Link
                      href={
                        `/${locale}/training-org/programs/${p.id}/edit` as Route
                      }
                      className="btn btn-sm btn-primary rounded-full"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} className="h-3.5 w-3.5" />
                      {isEs ? 'Editar' : 'Edit'}
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
