import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });

const { prisma } = await import('../src/index.js');

const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: {
        id: true,
        role: true,
        tenantId: true,
        email: true,
        phone: true,
        createdAt: true,
    },
});
console.log('users:', JSON.stringify(users, null, 2));

const wp = await prisma.workerProfile.findMany({
    take: 5,
    select: {
        id: true,
        firstName: true,
        lastName: true,
        onboardedAt: true,
        county: true,
        skills: true,
    },
});
console.log('worker_profiles:', JSON.stringify(wp, null, 2));

const apps = await prisma.application.findMany({
    take: 10,
    orderBy: { appliedAt: 'desc' },
    select: {
        id: true,
        workerId: true,
        jobId: true,
        tenantId: true,
        status: true,
        countyAtApply: true,
        appliedAt: true,
    },
});
console.log('applications:', JSON.stringify(apps, null, 2));

process.exit(0);
