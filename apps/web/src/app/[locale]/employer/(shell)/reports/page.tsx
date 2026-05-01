import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { getReportsOverview } from '@/lib/api/employer-ops';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.reports' });
  return { title: `AgConn — ${t('title')}` };
}

export default async function ReportsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.reports' });
  const data = await getReportsOverview();
  const year = 2026;
  const months = ['Mar 1', 'Apr', 'May', 'Jun', 'Jul', 'Aug 8'];

  return (
    <div className="px-8 pb-16 pt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
            {t('eyebrow', { year })}
          </p>
          <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
            {t('title_a')} <em className="text-primary not-italic font-light">{t('title_b')}</em>
          </h1>
          <div className="text-base-content/70 mt-2 text-sm">{t('summary')}</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-sm bg-base-100 border-base-300 rounded-full border font-medium"
          >
            {t('this_season')}
          </button>
          <button
            type="button"
            className="bg-base-content text-base-100 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
          >
            <FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5" />
            {t('export_csv')}
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {data.kpis.map((k) => (
          <div key={k.label} className="bg-base-100 border-base-300 rounded-2xl border p-5">
            <div className="text-base-content/60 font-mono text-[11px] font-semibold uppercase tracking-wider">
              {k.label}
            </div>
            <div className="text-primary font-display mt-2 text-4xl font-light leading-none tracking-tight">
              {k.value}
            </div>
            <div className="text-success mt-2 font-mono text-xs font-bold">{k.delta}</div>
            <div className="text-base-content/60 mt-1 text-xs">{k.sub}</div>
          </div>
        ))}
      </div>

      <section className="bg-base-100 border-base-300 mb-6 rounded-2xl border p-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div className="font-display text-xl font-light tracking-tight">
              {t('applicant_flow.title')}
            </div>
            <div className="text-base-content/60 mt-0.5 text-xs">
              {t('applicant_flow.sub', { year, jobTypes: 8 })}
            </div>
          </div>
          <div className="flex gap-3 text-xs">
            <div className="inline-flex items-center gap-1.5">
              <div className="bg-primary h-3 w-3 rounded-sm" />
              {t('applicant_flow.applicants')}
            </div>
            <div className="inline-flex items-center gap-1.5">
              <div className="bg-accent h-3 w-3 rounded-sm" />
              {t('applicant_flow.hired')}
            </div>
          </div>
        </div>
        <FlowChart points={data.seasonFlow} />
        <div className="text-base-content/60 mt-2 flex justify-between font-mono text-[10px]">
          {months.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-base-100 border-base-300 rounded-2xl border p-6">
          <div className="font-display mb-4 text-lg font-light tracking-tight">
            {t('by_job_type')}
          </div>
          {data.byJobType.map((j, i) => (
            <div
              key={j.label}
              className={[
                'grid grid-cols-[180px_1fr_60px] items-center gap-3 py-2.5 text-sm',
                i < data.byJobType.length - 1 ? 'border-base-300 border-b border-dashed' : '',
              ].join(' ')}
            >
              <span className="font-semibold">{j.label}</span>
              <div>
                <div className="text-base-content/60 flex justify-between font-mono text-[10px]">
                  <span>
                    {j.applied} applied · {j.hired} hired
                  </span>
                  <span>{j.fillPct}% filled</span>
                </div>
                <div className="bg-base-200 mt-1 h-1.5 overflow-hidden rounded-full">
                  <div
                    className={[
                      'h-full',
                      j.fillPct === 100
                        ? 'bg-success'
                        : j.fillPct > 50
                          ? 'bg-accent'
                          : 'bg-error',
                    ].join(' ')}
                    style={{ width: `${j.fillPct}%` }}
                  />
                </div>
              </div>
              <span className="text-primary text-right font-mono text-base font-bold">
                {j.hired}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-base-100 border-base-300 rounded-2xl border p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <div className="font-display text-lg font-light tracking-tight">{t('top_workers')}</div>
            <span className="text-base-content/60 text-xs">{t('top_workers_sub')}</span>
          </div>
          {data.topWorkers.map((p, i) => (
            <div
              key={p.rank}
              className={[
                'flex items-center gap-3 py-2.5',
                i < data.topWorkers.length - 1 ? 'border-base-300 border-b border-dashed' : '',
              ].join(' ')}
            >
              <div className="text-base-content/60 w-5 font-mono text-xs font-bold">{p.rank}</div>
              <div
                className={[
                  'grid h-8 w-8 place-items-center rounded-full font-mono text-[11px] font-bold',
                  p.rank === 1 ? 'bg-accent text-accent-content' : 'bg-base-content text-base-100',
                ].join(' ')}
              >
                {p.initials}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="text-base-content/60 text-[11px]">{p.role}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-xs font-bold">{p.metric}</div>
                <div className="text-primary text-[11px] font-bold">{p.delta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FlowChart({
  points,
}: {
  points: { week: number; applied: number; hired: number }[];
}) {
  const maxV = 200;
  const w = 1100;
  const h = 240;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-60 w-full">
      {[0, 60, 120, 180, 240].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2={w}
          y2={y}
          stroke="var(--color-base-300)"
          strokeWidth="1"
        />
      ))}
      {points.map((p, i) => {
        const x = (i / (points.length - 1)) * (w - 20) + 10;
        const next = points[i + 1];
        if (!next) return null;
        const x2 = ((i + 1) / (points.length - 1)) * (w - 20) + 10;
        const y = h - (p.applied / maxV) * h;
        const y2 = h - (next.applied / maxV) * h;
        return (
          <line
            key={`l-${i}`}
            x1={x}
            y1={y}
            x2={x2}
            y2={y2}
            stroke="var(--color-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        );
      })}
      {points.map((p, i) => {
        const x = (i / (points.length - 1)) * (w - 20) + 10;
        const colW = (w - 20) / points.length - 4;
        const barH = (p.hired / maxV) * h;
        return (
          <rect
            key={`b-${i}`}
            x={x - colW / 2}
            y={h - barH}
            width={colW}
            height={barH}
            fill="var(--color-accent)"
            opacity="0.65"
            rx="2"
          />
        );
      })}
      {points.map((p, i) => {
        const x = (i / (points.length - 1)) * (w - 20) + 10;
        const y = h - (p.applied / maxV) * h;
        return <circle key={`c-${i}`} cx={x} cy={y} r="3" fill="var(--color-primary)" />;
      })}
    </svg>
  );
}
