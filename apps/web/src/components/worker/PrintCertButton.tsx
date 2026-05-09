'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

type Props = { label: string };

export function PrintCertButton({ label }: Props) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="mt-8 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-4 py-2.5 text-[13px] font-semibold no-underline hover:bg-white/25 print:hidden"
    >
      <FontAwesomeIcon icon={faDownload} className="h-3 w-3" />
      <span>{label}</span>
    </button>
  );
}
