import { serviceDb } from '@agconn/db';
import type { ParsedRow } from './mspa-parse.js';

// Upserts the registry by certificate number and marks certs missing from the file as removed.
// Callers run it as app.role = 'service' (runMspaSync).
const CHUNK = 500;
const TX_OPTS = { timeout: 60_000, maxWait: 10_000 };

function registryFields(r: ParsedRow) {
    return {
        legalName: r.legalName,
        streetAddress: r.streetAddress,
        city: r.city,
        stateCode: r.stateCode,
        postalCode: r.postalCode,
        expirationDate: r.expirationDate,
        authHousing: r.authHousing,
        authTransport: r.authTransport,
        authDriving: r.authDriving,
        syncedAt: new Date(),
        removedAt: null,
    };
}

async function existingCerts(certs: string[]): Promise<Set<string>> {
    const rows = await serviceDb.mspaFlcRegistry.findMany({
        where: { certificateNumber: { in: certs } },
        select: { certificateNumber: true },
    });
    return new Set(rows.map((r) => r.certificateNumber));
}

// 500-row chunks keep each transaction well under a minute on a first sync (~12k rows).
async function upsertChunk(chunk: ParsedRow[]): Promise<void> {
    await serviceDb.$transaction(async (tx) => {
        for (const r of chunk) {
            const fields = registryFields(r);
            await tx.mspaFlcRegistry.upsert({
                where: { certificateNumber: r.certificateNumber },
                create: { certificateNumber: r.certificateNumber, ...fields },
                update: fields,
            });
        }
    }, TX_OPTS);
}

// DOL lists active certs only, so a cert missing from the file has lapsed or been revoked.
function markRemoved(seenCerts: string[]) {
    return serviceDb.$transaction((tx) => tx.mspaFlcRegistry.updateMany({
        where: { certificateNumber: { notIn: seenCerts }, removedAt: null },
        data: { removedAt: new Date() },
    }), TX_OPTS);
}

export async function ingest(rows: ParsedRow[]): Promise<{ added: number; updated: number; removed: number }> {
    // An empty download is almost certainly a parser regression; refuse to empty the table.
    if (rows.length === 0) throw new Error('mspa_parsed_zero_rows');
    const seenCerts = Array.from(new Set(rows.map((r) => r.certificateNumber)));
    const existing = await existingCerts(seenCerts);
    for (let i = 0; i < rows.length; i += CHUNK) await upsertChunk(rows.slice(i, i + CHUNK));
    const updated = rows.filter((r) => existing.has(r.certificateNumber)).length;
    const removed = await markRemoved(seenCerts);
    return { added: rows.length - updated, updated, removed: removed.count };
}
