import { UserRole } from '@agconn/db';

export { UserRole };

export {
    ensureClerkUserByPhone,
    type EnsureClerkUserResult,
} from './clerk-provision.js';

// Where each role's home lives within the locale tree. Unknown roles fall
// back to the marketing root.
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

export type ResolvedRole = {
    userId: string;
    role: UserRole;
};
