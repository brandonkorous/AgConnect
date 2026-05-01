import { renderPwaIcon, pwaIconCacheHeaders } from '@/lib/pwa-icon';

export const dynamic = 'force-static';

export function GET() {
  const res = renderPwaIcon({ size: 512, maskable: false });
  for (const [k, v] of Object.entries(pwaIconCacheHeaders)) res.headers.set(k, v);
  return res;
}
