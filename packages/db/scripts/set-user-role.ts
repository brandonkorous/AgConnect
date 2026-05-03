import { config as loadEnv } from 'dotenv';
loadEnv({ path: '../../.env' });

const userId = process.argv[2];
const role = process.argv[3];

if (!userId || !role) {
    console.error('Usage: tsx scripts/set-user-role.ts <userId> <role>');
    console.error('  role ∈ { worker | employer | training_org | admin }');
    process.exit(1);
}

async function main() {
    const { prisma } = await import('../src/index.js');
    const result = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
        return tx.user.update({
            where: { id: userId },
            data: { role: role as 'worker' | 'employer' | 'training_org' | 'admin' },
            select: { id: true, email: true, phone: true, role: true, tenantId: true },
        });
    });
    console.log('Updated:', JSON.stringify(result, null, 2));
    await prisma.$disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
