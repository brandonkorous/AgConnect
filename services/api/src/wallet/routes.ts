import { Hono } from 'hono';
import { ok, err } from '@agconn/api-client/server';
import { EnrollmentStatus, type Tx } from '@agconn/db';
import { requireAuth, requireRole, type AuthVars } from '../middleware/authContext.js';
import type { AuditCtxVars } from '../middleware/audit.js';

export const walletRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();

walletRoutes.use('*', requireAuth('wallet'));
walletRoutes.use('*', requireRole('worker'));

walletRoutes.get('/', async (c) => {
    const userId = c.var.userId;

    const enrollments = await c.var.db.enrollment.findMany({
        where: {
            workerId: userId,
            status: EnrollmentStatus.completed,
            deletedAt: null,
        },
        include: { program: { include: { org: true } } },
        orderBy: { completedAt: 'desc' },
    });

    const profile = await c.var.db.workerProfile.findUnique({ where: { id: userId } });
    const manualCerts = Array.isArray(profile?.certifications)
        ? (profile?.certifications as Array<Record<string, unknown>>)
        : [];

    const enrollmentItems = enrollments.map((e) => ({
        source: 'enrollment' as const,
        id: e.id,
        certificateId: e.certificateId,
        programTitleEn: e.program.titleEn,
        programTitleEs: e.program.titleEs,
        funder: e.program.funder,
        orgName: e.program.org?.email ?? 'Training organization',
        completedAt: e.completedAt?.toISOString().slice(0, 10) ?? '',
        certUrl: e.certUrl, // signed-URL generation deferred to 08-cert-generation
        issuedAt: e.completedAt?.toISOString().slice(0, 10) ?? '',
        expiresAt: null,
    }));

    const manualItems = manualCerts.map((cert, i) => ({
        source: 'manual' as const,
        id: typeof cert.certId === 'string' ? cert.certId : `manual-${i}`,
        name: typeof cert.name === 'string' ? cert.name : 'Certification',
        issuer: typeof cert.issuer === 'string' ? cert.issuer : null,
        issuedAt: typeof cert.issuedAt === 'string' ? cert.issuedAt : null,
        expiresAt: typeof cert.expiresAt === 'string' ? cert.expiresAt : null,
    }));

    const items = [...enrollmentItems, ...manualItems].sort((a, b) =>
        (b.issuedAt ?? '').localeCompare(a.issuedAt ?? ''),
    );

    return ok(c, { items });
});

walletRoutes.get('/cert/:enrollmentId', async (c) => {
    const id = c.req.param('enrollmentId');
    const enrollment = await c.var.db.enrollment.findFirst({
        where: { id, workerId: c.var.userId, deletedAt: null },
        include: { program: { include: { org: true } } },
    });
    if (!enrollment) return err(c, 404, 'not_found');

    return ok(c, {
        certificateId: enrollment.certificateId,
        programTitleEn: enrollment.program.titleEn,
        programTitleEs: enrollment.program.titleEs,
        org: {
            name: enrollment.program.org?.email ?? 'Training organization',
            email: enrollment.program.org?.email ?? null,
        },
        funder: enrollment.program.funder,
        completedAt: enrollment.completedAt?.toISOString().slice(0, 10) ?? null,
        signedUrl: enrollment.certUrl, // 24h signed url generation deferred
    });
});

walletRoutes.post('/cert/:enrollmentId/share', async (c) => {
    const id = c.req.param('enrollmentId');
    const enrollment = await c.var.db.enrollment.findFirst({
        where: { id, workerId: c.var.userId, deletedAt: null },
        include: { program: true },
    });
    if (!enrollment) return err(c, 404, 'not_found');

    const baseUrl =
        process.env.PUBLIC_WEB_URL?.replace(/\/$/, '') ?? 'https://agconn.com';
    const shareUrl = `${baseUrl}/wallet/cert/${id}`;
    return ok(c, {
        shareUrl,
        shareTextEn: `I earned a certificate in ${enrollment.program.titleEn} via AGCONN. View it: ${shareUrl}`,
        shareTextEs: `Obtuve un certificado en ${enrollment.program.titleEs} con AGCONN. Velo aquí: ${shareUrl}`,
    });
});

export type _Tx = Tx;
