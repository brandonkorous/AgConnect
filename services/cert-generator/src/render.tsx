import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    pdf,
    type DocumentProps,
} from '@react-pdf/renderer';
import React from 'react';

// Bilingual cert renderer. Returns a PDF Buffer.
//
// Font strategy: ship with the PDF built-in Helvetica family rather than
// embedding Inter/Fraunces. The brand calls for those typefaces but each
// custom font subset would add 100-200KB; the spec's < 500KB output budget
// is tight enough that the v1 cert leans on built-ins. The visual stays
// recognizably Tierra via palette + spacing + uppercase eyebrow tracking.
// TODO: subset-embed Inter when the storage budget grows.

const PALETTE = {
    ink: '#3A3120',
    inkSoft: '#736245',
    primary: '#5B6E2E',
    accent: '#D9B441',
    line: '#E6DDC9',
    paper: '#FFFFFF',
    bg: '#F8F2E2',
} as const;

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: PALETTE.bg,
        padding: 56,
        fontFamily: 'Helvetica',
        color: PALETTE.ink,
    },
    card: {
        backgroundColor: PALETTE.paper,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: PALETTE.line,
        padding: 48,
        flexGrow: 1,
    },
    eyebrow: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 9,
        letterSpacing: 2,
        color: PALETTE.primary,
        textTransform: 'uppercase',
    },
    h1: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 26,
        marginTop: 8,
        marginBottom: 4,
        color: PALETTE.ink,
    },
    h2: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 20,
        marginTop: 4,
        marginBottom: 4,
        color: PALETTE.ink,
    },
    meta: {
        fontSize: 11,
        color: PALETTE.inkSoft,
    },
    name: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 22,
        color: PALETTE.primary,
        marginTop: 20,
        marginBottom: 4,
    },
    accentRule: {
        marginTop: 24,
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: PALETTE.accent,
        width: 64,
    },
    esBlock: {
        marginTop: 28,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: PALETTE.line,
    },
    footer: {
        marginTop: 'auto',
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: PALETTE.line,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerCol: {
        flexDirection: 'column',
    },
    footerLabel: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 8,
        letterSpacing: 1.8,
        color: PALETTE.inkSoft,
        textTransform: 'uppercase',
    },
    footerValue: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 11,
        marginTop: 4,
        color: PALETTE.ink,
    },
    footerCertId: {
        fontFamily: 'Courier-Bold',
        fontSize: 11,
        marginTop: 4,
        color: PALETTE.ink,
    },
});

export type CertArgs = {
    workerFirstName: string;
    workerLastName: string;
    programTitleEn: string;
    programTitleEs: string;
    funder: string;
    orgName: string;
    completedAt: Date;
    certificateId: string;
};

function CertDocument(a: CertArgs): React.ReactElement<DocumentProps> {
    const issued = a.completedAt.toISOString().slice(0, 10);
    const workerName = `${a.workerFirstName} ${a.workerLastName}`.trim();
    return (
        <Document
            title={`${a.programTitleEn} — AGCONN Certificate`}
            author="AGCONN"
            subject="Certificate of Completion"
        >
            <Page size="LETTER" style={styles.page}>
                <View style={styles.card}>
                    <Text style={styles.eyebrow}>AGCONN · Certificate of Completion</Text>
                    <Text style={styles.h1}>{a.programTitleEn}</Text>
                    <Text style={styles.meta}>
                        Funded by {a.funder} · Issued by {a.orgName}
                    </Text>

                    <Text style={styles.name}>{workerName || '—'}</Text>
                    <Text style={styles.meta}>has successfully completed the program above.</Text>

                    <View style={styles.accentRule} />

                    <View style={styles.esBlock}>
                        <Text style={styles.eyebrow}>Certificado de Finalización</Text>
                        <Text style={styles.h2}>{a.programTitleEs}</Text>
                        <Text style={styles.meta}>ha completado exitosamente este programa.</Text>
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.footerCol}>
                            <Text style={styles.footerLabel}>Issued · Emitido</Text>
                            <Text style={styles.footerValue}>{issued}</Text>
                        </View>
                        <View style={styles.footerCol}>
                            <Text style={styles.footerLabel}>Cert ID</Text>
                            <Text style={styles.footerCertId}>{a.certificateId}</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
}

export const MAX_CERT_BYTES = 500_000;

export async function renderCertPdf(a: CertArgs): Promise<Buffer> {
    const instance = pdf(CertDocument(a));
    const blob = await instance.toBlob();
    const buf = Buffer.from(await blob.arrayBuffer());
    if (buf.length > MAX_CERT_BYTES) {
        console.warn('[cert-generator] cert.size_exceeds_budget', {
            certificateId: a.certificateId,
            bytes: buf.length,
            budget: MAX_CERT_BYTES,
        });
    }
    return buf;
}
