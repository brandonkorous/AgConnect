import { runWithRlsContext, serviceDb } from '@agconn/db';
import { downloadResource, resolveResourceUrl } from './mspa-source.js';
import { parseRegistry } from './mspa-parse.js';
import { ingest } from './mspa-ingest.js';

// Syncs the DOL MSPA Farm Labor Contractor registry into mspa_flc_registry so verification is a local lookup.
// Skips when the file's Last-Modified has not advanced since the last good sync. Runs as app.role = 'service'.

export type MspaSyncOutcome = {
    status: 'completed' | 'skipped_unchanged' | 'failed';
    rowsAdded: number;
    rowsUpdated: number;
    rowsRemoved: number;
    sourceUrl: string | null;
    sourceUpdatedAt: Date | null;
    errorMessage: string | null;
};

type Resource = { url: string; lastModified: Date | null };
const NO_ROWS = { rowsAdded: 0, rowsUpdated: 0, rowsRemoved: 0 };

export function runMspaSync(): Promise<MspaSyncOutcome> {
    return runWithRlsContext({ role: 'service' }, syncAsService);
}

async function syncAsService(): Promise<MspaSyncOutcome> {
    const run = await serviceDb.mspaSyncRun.create({ data: { status: 'running' } });
    try {
        const resource = await resolveResourceUrl();
        if (!resource) throw new Error('mspa_resource_url_not_found');
        const outcome = (await unchanged(resource)) ? skipped(resource) : await syncFile(resource);
        await finishRun(run.id, outcome);
        return outcome;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await serviceDb.mspaSyncRun.update({
            where: { id: run.id },
            data: { finishedAt: new Date(), status: 'failed', errorMessage: message.slice(0, 500) },
        });
        return { status: 'failed', ...NO_ROWS, sourceUrl: null, sourceUpdatedAt: null, errorMessage: message };
    }
}

async function unchanged(resource: Resource): Promise<boolean> {
    const lastSuccess = await serviceDb.mspaSyncRun.findFirst({
        where: { status: 'completed', sourceUpdatedAt: { not: null } },
        orderBy: { startedAt: 'desc' },
    });
    const last = lastSuccess?.sourceUpdatedAt;
    return !!(last && resource.lastModified && resource.lastModified <= last);
}

function skipped(resource: Resource): MspaSyncOutcome {
    const source = { sourceUrl: resource.url, sourceUpdatedAt: resource.lastModified };
    return { status: 'skipped_unchanged', ...NO_ROWS, ...source, errorMessage: null };
}

async function syncFile(resource: Resource): Promise<MspaSyncOutcome> {
    const counts = await ingest(parseRegistry(await downloadResource(resource.url)));
    return {
        status: 'completed',
        rowsAdded: counts.added,
        rowsUpdated: counts.updated,
        rowsRemoved: counts.removed,
        sourceUrl: resource.url,
        sourceUpdatedAt: resource.lastModified,
        errorMessage: null,
    };
}

async function finishRun(runId: string, o: MspaSyncOutcome): Promise<void> {
    const counts = o.status === 'completed'
        ? { rowsAdded: o.rowsAdded, rowsUpdated: o.rowsUpdated, rowsRemoved: o.rowsRemoved }
        : {};
    await serviceDb.mspaSyncRun.update({
        where: { id: runId },
        data: { finishedAt: new Date(), status: o.status, sourceUrl: o.sourceUrl, sourceUpdatedAt: o.sourceUpdatedAt, ...counts },
    });
}
