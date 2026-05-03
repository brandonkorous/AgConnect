import { config as loadEnv } from 'dotenv';
loadEnv({ path: '../../.env' });

async function main() {
    const { prisma } = await import('../src/index.js');
    const users = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
        return tx.user.findMany({
            select: { id: true, email: true, phone: true, role: true, tenantId: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
    });
    console.log(JSON.stringify(users, null, 2));
    await prisma.$disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
