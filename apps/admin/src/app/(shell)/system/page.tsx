import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faToggleOn,
    faListCheck,
    faHeartPulse,
    faTable,
    faCoins,
} from '@fortawesome/free-solid-svg-icons';

export const metadata = { title: 'System — AGCONN Admin' };

const SECTIONS = [
    {
        href: '/system/flags',
        label: 'Feature flags',
        icon: faToggleOn,
        summary: 'Platform-default and per-tenant overrides for code-defined flags.',
    },
    {
        href: '/system/jobs',
        label: 'Job queues',
        icon: faListCheck,
        summary: 'pg-boss queue depth, recent failures, replay.',
    },
    {
        href: '/system/health',
        label: 'Service health',
        icon: faHeartPulse,
        summary: 'Ping board, last activity per service, current git sha.',
    },
    {
        href: '/system/lookups',
        label: 'Lookup tables',
        icon: faTable,
        summary: 'Crops, role types, skill tags — bilingual labels.',
    },
    {
        href: '/system/aewr',
        label: 'AEWR rates',
        icon: faCoins,
        summary: 'USDOL Adverse Effect Wage Rate by state and effective date.',
    },
];

export default function SystemIndexPage() {
    return (
        <div className="space-y-6">
            <div>
                <p className="eyebrow text-base-content/60">Platform</p>
                <h1 className="font-serif text-2xl font-medium tracking-tight">System</h1>
                <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
                    Low-level operational controls. Most actions here mutate platform-wide state — be
                    deliberate.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {SECTIONS.map((s) => (
                    <Link
                        key={s.href}
                        href={s.href}
                        className="bg-base-100 border-base-300 hover:border-primary/40 rounded-box flex items-start gap-4 border p-5 transition-colors"
                    >
                        <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                            <FontAwesomeIcon icon={s.icon} className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="font-serif text-base font-medium">{s.label}</h2>
                            <p className="text-base-content/70 mt-1 text-sm">{s.summary}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
