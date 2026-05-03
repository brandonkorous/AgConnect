import { config as loadEnv } from 'dotenv';
loadEnv({ path: '../../.env' });

async function main() {
    const key = process.env.CLERK_SECRET_KEY;
    if (!key) {
        console.error('CLERK_SECRET_KEY not set in .env');
        process.exit(1);
    }
    const res = await fetch('https://api.clerk.com/v1/users?limit=20&order_by=-created_at', {
        headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
        console.error('Clerk API error', res.status, await res.text());
        process.exit(1);
    }
    const users = (await res.json()) as Array<{
        id: string;
        email_addresses: Array<{ email_address: string; id: string }>;
        primary_email_address_id: string | null;
        phone_numbers: Array<{ phone_number: string; id: string }>;
        primary_phone_number_id: string | null;
        unsafe_metadata: Record<string, unknown>;
        created_at: number;
    }>;
    const summary = users.map((u) => ({
        id: u.id,
        email: u.email_addresses.find((e) => e.id === u.primary_email_address_id)?.email_address ?? null,
        phone: u.phone_numbers.find((p) => p.id === u.primary_phone_number_id)?.phone_number ?? null,
        unsafeMetadata: u.unsafe_metadata,
        createdAt: new Date(u.created_at).toISOString(),
    }));
    console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
