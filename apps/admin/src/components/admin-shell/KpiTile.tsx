import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowTrendUp, faArrowTrendDown, faMinus } from '@fortawesome/free-solid-svg-icons';

type Props = {
  label: string;
  value: string;
  sublabel?: string;
  trendPct?: number | null;
  href?: string;
};

export function KpiTile({ label, value, sublabel, trendPct, href }: Props) {
  const direction = trendPct == null ? 'flat' : trendPct > 0 ? 'up' : trendPct < 0 ? 'down' : 'flat';
  const tone =
    direction === 'up'
      ? 'text-success'
      : direction === 'down'
        ? 'text-error'
        : 'text-base-content/40';

  const inner = (
    <div className="bg-base-100 border-base-300 hover:border-primary group h-full rounded-box border p-5 transition-colors">
      <div className="text-base-content/60 text-xs uppercase tracking-wide">{label}</div>
      <div className="mt-2 font-serif text-3xl tabular-nums leading-none">{value}</div>
      {sublabel && (
        <div className="text-base-content/50 mt-2 text-xs leading-relaxed">{sublabel}</div>
      )}
      {trendPct !== undefined && (
        <div className={`mt-3 flex items-center gap-1.5 text-xs ${tone}`}>
          <FontAwesomeIcon
            icon={
              direction === 'up' ? faArrowTrendUp : direction === 'down' ? faArrowTrendDown : faMinus
            }
            className="h-3 w-3"
          />
          <span className="tabular-nums">
            {trendPct == null ? '—' : `${trendPct >= 0 ? '+' : ''}${trendPct.toFixed(1)}%`}
          </span>
          <span className="text-base-content/40">vs prior period</span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
