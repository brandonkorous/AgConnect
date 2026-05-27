import { UserRole } from '@agconn/auth';

export { UserRole };

export function homePathForRole(locale: string, role: UserRole): string {
  switch (role) {
    case UserRole.worker:
      return `/${locale}/worker`;
    case UserRole.employer:
      return `/${locale}/employer`;
    case UserRole.admin:
    case UserRole.training_org:
    default:
      return `/${locale}`;
  }
}
