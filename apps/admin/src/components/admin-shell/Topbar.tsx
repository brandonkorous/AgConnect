import { UserButton } from '@clerk/nextjs';
import { TenantSwitcher, type TenantOption } from './TenantSwitcher';
import { CommandPalette } from './CommandPalette';

type Props = {
    user: { fullName: string | null; email: string | null };
    tenants: TenantOption[];
    activeTenantId: string | null;
};

export function Topbar({ user, tenants, activeTenantId }: Props) {
    return (
        <header className="bg-base-100 border-base-300 sticky top-0 z-10 border-b">
            <div className="flex items-center gap-3 px-5 py-3 md:px-8">
                <div className="md:hidden">
                    <div className="bg-primary text-primary-content flex h-7 w-7 items-center justify-center rounded font-serif text-sm font-semibold">
                        A
                    </div>
                </div>
                <div className="flex-1" />
                <CommandPalette tenants={tenants} />
                <TenantSwitcher tenants={tenants} activeTenantId={activeTenantId} />
                <div className="border-base-300 ml-2 hidden border-l pl-3 md:flex md:flex-col md:items-end md:leading-tight">
                    <span className="text-sm font-medium">{user.fullName ?? 'Admin'}</span>
                    {user.email && (
                        <span className="text-base-content/60 text-xs">{user.email}</span>
                    )}
                </div>
                <UserButton appearance={{ elements: { userButtonAvatarBox: 'h-8 w-8' } }} />
            </div>
        </header>
    );
}
