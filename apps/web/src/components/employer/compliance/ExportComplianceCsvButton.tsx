'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { downloadFromApi } from '@/lib/export/client-download';

export function ExportComplianceCsvButton() {
  const t = useTranslations('employer.compliance');
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await downloadFromApi(
            '/v1/employer/compliance/export.csv',
            'agconn-compliance.csv',
          );
        } finally {
          setPending(false);
        }
      }}
      className="btn btn-ghost rounded-full"
    >
      <FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5" />
      {t('export_csv')}
    </button>
  );
}
