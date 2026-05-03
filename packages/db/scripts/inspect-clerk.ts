// Inspect the Clerk instance: list users, list sign-up attempts (if exposed),
// and print key instance configuration. Helps diagnose "verification succeeded
// but no user was created" cases.
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '../../.env' });

const KEY = process.env.CLERK_SECRET_KEY;
if (!KEY) {
    console.error('CLERK_SECRET_KEY not set in .env');
    process.exit(1);
}

async function clerk(path: string): Promise<unknown> {
    const res = await fetch(`https://api.clerk.com${path}`, {
        headers: { Authorization: `Bearer ${KEY}` },
    });
    const text = await res.text();
    if (!res.ok) {
        return { __status: res.status, __body: tryParse(text) };
    }
    return tryParse(text);
}

function tryParse(text: string): unknown {
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

async function main() {
    console.log('='.repeat(60));
    console.log('CLERK INSTANCE DIAGNOSTIC');
    console.log('='.repeat(60));

    // 1. Instance / domain info
    console.log('\n[domains]');
    console.log(JSON.stringify(await clerk('/v1/domains'), null, 2));

    // 2. JWT templates (for inspection)
    console.log('\n[jwt_templates]');
    console.log(JSON.stringify(await clerk('/v1/jwt_templates'), null, 2));

    // 3. Sign-in attempts (recent)
    console.log('\n[sign_in_tokens] (recent 5)');
    console.log(JSON.stringify(await clerk('/v1/sign_in_tokens?limit=5'), null, 2));

    // 4. Users — full list with all relevant flags
    console.log('\n[users] (recent 10)');
    const users = await clerk('/v1/users?limit=10&order_by=-created_at') as Array<{
        id: string;
        email_addresses: Array<{ email_address: string; id: string; verification: { status: string } | null }>;
        phone_numbers: Array<{ phone_number: string; id: string; verification: { status: string } | null }>;
        password_enabled: boolean;
        primary_email_address_id: string | null;
        primary_phone_number_id: string | null;
        unsafe_metadata: Record<string, unknown>;
        public_metadata: Record<string, unknown>;
        created_at: number;
    }> | { __status: number };

    if (Array.isArray(users)) {
        users.forEach((u) => {
            const primaryEmail = u.email_addresses.find((e) => e.id === u.primary_email_address_id);
            const primaryPhone = u.phone_numbers.find((p) => p.id === u.primary_phone_number_id);
            console.log({
                id: u.id,
                created: new Date(u.created_at).toISOString(),
                email: primaryEmail?.email_address ?? null,
                emailVerified: primaryEmail?.verification?.status ?? null,
                phone: primaryPhone?.phone_number ?? null,
                phoneVerified: primaryPhone?.verification?.status ?? null,
                passwordEnabled: u.password_enabled,
                role: u.unsafe_metadata?.role ?? null,
                allUnsafeMetadata: u.unsafe_metadata,
            });
        });
    } else {
        console.log(JSON.stringify(users, null, 2));
    }

    // 5. Total user count
    console.log('\n[users_count]');
    console.log(JSON.stringify(await clerk('/v1/users/count'), null, 2));

    console.log('\nDone. If you saw a verification "success" in the form but no user');
    console.log('appears above, the SignUp resource never finalized — check the form');
    console.log('console for [signup] state logs to see where the chain broke.');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
