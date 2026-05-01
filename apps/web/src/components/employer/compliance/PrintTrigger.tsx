'use client';

import { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';

type Props = { label: string; autoOpen?: boolean };

export function PrintTrigger({ label, autoOpen }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (autoOpen && !fired.current) {
      fired.current = true;
      const timer = setTimeout(() => window.print(), 400);
      return () => clearTimeout(timer);
    }
  }, [autoOpen]);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="bg-base-content text-base-100 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
    >
      <FontAwesomeIcon icon={faPrint} className="h-3 w-3" />
      {label}
    </button>
  );
}
