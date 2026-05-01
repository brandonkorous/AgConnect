import 'server-only';
import { unstable_cache } from 'next/cache';
import { prisma, Lang, TranslationStatus } from '@agconn/db';

export type Locale = 'en' | 'es';
export type Messages = Record<string, unknown>;

interface Row {
    namespace: string;
    key: string;
    value: string;
}

function assemble(rows: Row[]): Messages {
    const root: Messages = {};
    for (const row of rows) {
        const path = [...row.namespace.split('.'), ...row.key.split('.')];
        let cursor: Messages = root;
        for (let i = 0; i < path.length - 1; i++) {
            const segment = path[i];
            if (!segment) continue;
            const next = cursor[segment];
            if (typeof next !== 'object' || next === null || Array.isArray(next)) {
                cursor[segment] = {};
            }
            cursor = cursor[segment] as Messages;
        }
        const leaf = path[path.length - 1];
        if (leaf) cursor[leaf] = row.value;
    }
    return root;
}

async function loadFromDb(locale: Locale, tenantId: string | null): Promise<Messages> {
    const rows = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
        if (tenantId === null) {
            return tx.translationKey.findMany({
                where: { locale: locale as Lang, tenantId: null, status: TranslationStatus.published },
                select: { namespace: true, key: true, value: true },
            });
        }
        return tx.translationKey.findMany({
            where: {
                locale: locale as Lang,
                status: TranslationStatus.published,
                OR: [{ tenantId }, { tenantId: null }],
            },
            orderBy: [{ tenantId: 'asc' }],
            select: { namespace: true, key: true, value: true, tenantId: true },
        });
    });

    if (tenantId === null) return assemble(rows);

    const globals = rows.filter((r) => 'tenantId' in r && (r as { tenantId: string | null }).tenantId === null);
    const overrides = rows.filter((r) => 'tenantId' in r && (r as { tenantId: string | null }).tenantId !== null);
    return { ...assemble(globals), ...assembleDeepMerge(globals, overrides) };
}

function assembleDeepMerge(globals: Row[], overrides: Row[]): Messages {
    const merged = new Map<string, Row>();
    for (const r of globals) merged.set(`${r.namespace}|${r.key}`, r);
    for (const r of overrides) merged.set(`${r.namespace}|${r.key}`, r);
    return assemble(Array.from(merged.values()));
}

export async function getMessages(locale: Locale, tenantId: string | null = null): Promise<Messages> {
    const cached = unstable_cache(
        async () => loadFromDb(locale, tenantId),
        ['messages', locale, tenantId ?? 'global', 'v2'],
        {
            revalidate: 300,
            tags: ['messages', `messages:${tenantId ?? 'global'}`, `messages:${tenantId ?? 'global'}:${locale}`],
        },
    );
    return cached();
}
