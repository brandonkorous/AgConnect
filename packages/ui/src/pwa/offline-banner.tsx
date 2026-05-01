'use client';

import { useEffect, useState } from 'react';

export function OfflineBanner({ message }: { message: string }) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () =>
      setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-warning text-warning-content sticky top-0 z-40 px-4 py-2 text-center text-sm font-medium"
    >
      {message}
    </div>
  );
}
