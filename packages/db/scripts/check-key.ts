import { config as loadEnv } from 'dotenv';
loadEnv({ path: '../../.env' });

async function main() {
    const { prisma } = await import('../src/index.js');
    const rows = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
        return tx.translationKey.findMany({
            where: {
                namespace: 'employer',
                key: { startsWith: 'onboarding.programs.h2a' },
            },
            select: {
                namespace: true,
                key: true,
                locale: true,
                value: true,
                status: true,
                tenantId: true,
                publishedAt: true,
            },
            orderBy: [{ key: 'asc' }, { locale: 'asc' }],
        });
    });
    console.log(JSON.stringify(rows, null, 2));
    await prisma.$disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
