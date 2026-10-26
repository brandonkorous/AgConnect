import type { PrismaClient } from '@prisma/client';

type RoleRow = { rolname: string; rolsuper: boolean; rolbypassrls: boolean };
type Exit = (code: number) => never | void;

let checked = false;

// In production a superuser or BYPASSRLS connection would skip every policy, so the process refuses to run.
export async function checkRoleOnce(client: PrismaClient, env = process.env, exit: Exit = process.exit): Promise<void> {
  if (checked || env.APP_ENV !== 'production') return;
  checked = true;
  try {
    const [role] = await client.$queryRaw<RoleRow[]>`
      SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`;
    if (role && (role.rolsuper || role.rolbypassrls)) {
      console.error(`[db] ${role.rolname} is SUPERUSER or BYPASSRLS; row level security would not apply. Exiting.`);
      exit(1);
    }
  } catch (e) {
    console.error('[db] RLS role check failed', e);
  }
}

export function resetRoleCheckForTests(): void {
  checked = false;
}
