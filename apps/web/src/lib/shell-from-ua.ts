import 'server-only';
import { headers } from 'next/headers';

export type WorkerShell = 'field' | 'worker';

const MOBILE_UA_RE = /Mobi|Android|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i;
const TABLET_UA_RE = /iPad|Tablet|PlayBook/i;

export async function shellFromUA(): Promise<WorkerShell> {
  const h = await headers();
  const ua = h.get('user-agent') ?? '';
  if (TABLET_UA_RE.test(ua)) return 'worker';
  if (MOBILE_UA_RE.test(ua)) return 'field';
  return 'worker';
}
