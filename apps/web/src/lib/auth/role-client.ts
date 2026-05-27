export const UserRole = {
  worker: 'worker',
  employer: 'employer',
  training_org: 'training_org',
  admin: 'admin',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

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
