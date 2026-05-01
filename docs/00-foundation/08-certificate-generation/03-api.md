# 08 — Certificate Generation: API & Worker

## Internal interface

```ts
// packages/pdf/src/index.ts
export interface GenerateCertArgs {
    enrollmentId: string;
}

export async function enqueueGenerateCertificate(args: GenerateCertArgs) {
    return pgBoss.send('generate-certificate', args, {
        singletonKey: `cert-${args.enrollmentId}`,
        retryLimit: 3,
        retryBackoff: true,
    });
}
```

## Worker

```ts
// apps/api/src/workers/generate-certificate.ts
pgBoss.work<GenerateCertArgs>('generate-certificate', { teamSize: 2 }, async (job) => {
    const { enrollmentId } = job.data;

    const enrollment = await db.enrollment.findUnique({
        where: { id: enrollmentId },
        include: {
            program: { include: { org: { include: { employerProfile: true } } } },
            worker: { include: { workerProfile: true } },
            tenant: true,
        },
    });
    if (!enrollment || enrollment.status !== 'completed') return;

    // Generate certificate ID if not set
    const certificateId = enrollment.certificateId ?? generateCertId();

    const pdfBuffer = await renderCertificatePdf({
        tenant: enrollment.tenant,
        program: enrollment.program,
        org: enrollment.program.org,
        worker: enrollment.worker,
        completedAt: enrollment.completedAt!,
        certificateId,
    });

    const objectPath = `certificates/${enrollment.tenantId}/${enrollment.id}.pdf`;
    await supabaseStorage.upload(objectPath, pdfBuffer, { contentType: 'application/pdf' });

    await db.enrollment.update({
        where: { id: enrollmentId },
        data: { certUrl: objectPath, certGeneratedAt: new Date(), certificateId },
    });

    // Trigger delivery
    await enqueueSms({
        tenantId: enrollment.tenantId,
        userId: enrollment.workerId,
        template: 'training.completed',
        vars: { programTitle: enrollment.program.titleEn, certUrl: await supabaseStorage.getSignedUrl(objectPath, '24h') },
        jobKey: `cert-sms-${enrollmentId}`,
    });
    if (enrollment.worker.email) {
        await enqueueEmail({
            tenantId: enrollment.tenantId,
            userId: enrollment.workerId,
            template: 'training.completed',
            vars: { programTitle: enrollment.program.titleEn },
            attachments: [{ filename: `${certificateId}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
            jobKey: `cert-email-${enrollmentId}`,
        });
    }
});

function generateCertId(): string {
    const year = new Date().getFullYear();
    const hash = randomBytes(3).toString('hex').toUpperCase();
    return `AC-${year}-${hash}`;
}
```

## React-PDF component (canonical layout)

```tsx
// packages/pdf/src/templates/Certificate.tsx
import { Document, Page, View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
    family: 'Inter',
    fonts: [{ src: 'https://fonts.gstatic.com/s/inter/...regular.ttf' }, { src: 'https://fonts.gstatic.com/s/inter/...bold.ttf', fontWeight: 'bold' }],
});

const styles = StyleSheet.create({
    page: { padding: 60, fontFamily: 'Inter', fontSize: 11 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    logo: { width: 80, height: 80 },
    certificateId: { fontSize: 9, color: '#666' },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginVertical: 30 },
    subtitle: { fontSize: 12, textAlign: 'center', color: '#444', marginBottom: 4 },
    workerName: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
    programName: { fontSize: 18, textAlign: 'center', marginVertical: 8 },
    date: { fontSize: 12, textAlign: 'center', color: '#444' },
    signatureBlock: { marginTop: 60, alignItems: 'flex-end' },
    signatureImage: { width: 160, height: 50, marginBottom: 4 },
    signatureName: { fontSize: 11, fontWeight: 'bold' },
    signatureTitle: { fontSize: 10, color: '#666' },
    footer: { position: 'absolute', bottom: 30, left: 60, right: 60, textAlign: 'center', fontSize: 9, color: '#888' },
});

export function CertificateDocument(props: CertificateProps) {
    const { tenant, program, org, worker, completedAt, certificateId } = props;
    return (
        <Document>
            <Page size='LETTER' orientation='landscape' style={styles.page}>
                <View style={styles.header}>
                    <Image src={tenant.settings?.branding?.logoUrl ?? DEFAULT_LOGO} style={styles.logo} />
                    <Text style={styles.certificateId}>Certificate ID / ID de certificado: {certificateId}</Text>
                </View>

                <Text style={styles.title}>Certificate of Completion</Text>
                <Text style={styles.subtitle}>Certificado de Finalización</Text>

                <Text style={styles.subtitle}>This certifies that / Esto certifica que</Text>
                <Text style={styles.workerName}>
                    {worker.workerProfile.firstName} {worker.workerProfile.lastName}
                </Text>

                <Text style={styles.subtitle}>has successfully completed / ha completado con éxito</Text>
                <Text style={styles.programName}>{program.titleEn}</Text>
                <Text style={styles.programName}>{program.titleEs}</Text>

                <Text style={styles.date}>
                    {fmtDateEn(completedAt)} / {fmtDateEs(completedAt)}
                </Text>

                <View style={styles.signatureBlock}>
                    {org.employerProfile.signatureImageUrl ? <Image src={org.employerProfile.signatureImageUrl} style={styles.signatureImage} /> : null}
                    <Text style={styles.signatureName}>{org.employerProfile.signatureName ?? org.employerProfile.businessName}</Text>
                    <Text style={styles.signatureTitle}>{org.employerProfile.signatureTitle ?? 'Authorized Signatory'}</Text>
                    <Text style={styles.signatureTitle}>{org.employerProfile.businessName}</Text>
                </View>

                <Text style={styles.footer}>
                    Issued by {tenant.name} via AgConn • agconn.com/verify/{certificateId} • Funded by {program.funder}
                </Text>
            </Page>
        </Document>
    );
}
```

## Render function

```ts
// packages/pdf/src/render.ts
import { renderToBuffer } from '@react-pdf/renderer';
export async function renderCertificatePdf(props: CertificateProps): Promise<Buffer> {
  return renderToBuffer(<CertificateDocument {...props} />);
}
```

## Public download endpoint

### GET /v1/enrollments/:id/certificate

Authenticated endpoint that returns a 302 redirect to a 24-hour-signed Supabase Storage URL.

```ts
api.get('/v1/enrollments/:id/certificate', async (c) => {
    const tx = c.get('db');
    const enrollment = await tx.enrollment.findUnique({ where: { id: c.req.param('id') } });
    if (!enrollment?.certUrl) throw new HTTPException(404);

    // RLS already filtered; we just need to generate the signed URL
    const url = await supabaseStorage.getSignedUrl(enrollment.certUrl, '24h');
    return c.redirect(url, 302);
});
```

## Admin re-generate

### POST /admin/v1/enrollments/:id/regenerate-cert

Re-generates with current data (e.g., if the org updated their signature image). Re-uses the same `certificateId` and overwrites the blob.
