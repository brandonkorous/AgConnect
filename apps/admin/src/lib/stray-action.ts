// Import-free so node:test can load it. Server actions only exist on pages, never under /api.
export function isStrayAction(pathname: string, nextAction: string | null): boolean {
  if (!nextAction) return false;
  return pathname === '/api' || pathname.startsWith('/api/');
}
