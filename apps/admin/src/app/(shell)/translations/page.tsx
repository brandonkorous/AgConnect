import { TranslationFilters } from './TranslationFilters';
import { TranslationCellEditor } from './TranslationCellEditor';
import { AddPairRow } from './AddPairRow';
import {
    fetchNamespaces,
    fetchTranslations,
    type TranslationPair,
} from '@/lib/translations-api';

export const metadata = { title: 'Translations — AGCONN Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function TranslationsPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const sp = await searchParams;
    const namespace = typeof sp['namespace'] === 'string' ? sp['namespace'] : undefined;
    const search = typeof sp['search'] === 'string' ? sp['search'] : undefined;
    const status = typeof sp['status'] === 'string' ? sp['status'] : undefined;
    const missingOnly = sp['missingOnly'] === 'true';

    const [namespacesRes, listRes] = await Promise.all([
        fetchNamespaces('platform', null),
        fetchTranslations(
            {
                namespace,
                search,
                status: status as undefined,
                missingOnly,
                limit: 200,
            },
            null,
        ),
    ]);

    const namespaces = namespacesRes.ok ? namespacesRes.data.namespaces : [];

    return (
        <div className="space-y-4">
            <div>
                <p className="eyebrow text-base-content/60">Platform</p>
                <h1 className="font-serif text-2xl font-medium tracking-tight">Translations</h1>
                <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
                    DB-backed UI copy. Edits save on blur and publish immediately; the web app
                    revalidates within seconds via the internal hook.
                </p>
            </div>

            <TranslationFilters namespaces={namespaces} />

            {!listRes.ok ? (
                <div role="alert" className="alert alert-error">
                    <span>
                        {listRes.error.code} — {listRes.error.message}
                    </span>
                </div>
            ) : (
                <>
                    <TranslationTable pairs={listRes.data.pairs} />
                    <AddPairRow scope="platform" tenantId={null} defaultNamespace={namespace} />
                </>
            )}
        </div>
    );
}

function TranslationTable({ pairs }: { pairs: TranslationPair[] }) {
    if (pairs.length === 0) {
        return (
            <div className="bg-base-100 border-base-300 text-base-content/70 rounded-box border p-8 text-center text-sm">
                No translation keys match these filters.
            </div>
        );
    }

    // Group by namespace for readable scanning.
    const groups = new Map<string, TranslationPair[]>();
    for (const p of pairs) {
        const arr = groups.get(p.namespace) ?? [];
        arr.push(p);
        groups.set(p.namespace, arr);
    }

    return (
        <div className="space-y-6">
            {Array.from(groups.entries()).map(([namespace, items]) => (
                <section
                    key={namespace}
                    className="bg-base-100 border-base-300 overflow-hidden rounded-box border"
                >
                    <header className="bg-base-200 border-base-300 flex items-baseline justify-between border-b px-4 py-2.5">
                        <h2 className="font-mono text-xs font-semibold tracking-tight">{namespace}</h2>
                        <span className="text-base-content/60 font-mono text-xs tabular-nums">
                            {items.length} {items.length === 1 ? 'key' : 'keys'}
                        </span>
                    </header>
                    <table className="w-full table-fixed">
                        <colgroup>
                            <col className="w-[26%]" />
                            <col className="w-[37%]" />
                            <col className="w-[37%]" />
                        </colgroup>
                        <thead>
                            <tr className="border-base-300 border-b">
                                <th className="text-base-content/60 px-4 py-2 text-left text-xs font-medium uppercase tracking-wide">
                                    Key
                                </th>
                                <th className="text-base-content/60 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide">
                                    EN
                                </th>
                                <th className="text-base-content/60 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide">
                                    ES
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((p) => (
                                <tr key={`${namespace}|${p.key}`} className="border-base-200 border-b align-top">
                                    <td className="px-4 py-2">
                                        <div className="font-mono text-xs leading-relaxed">{p.key}</div>
                                        <div className="text-base-content/50 mt-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-wide">
                                            {p.en === null && <span className="text-warning">missing EN</span>}
                                            {p.es === null && <span className="text-warning">missing ES</span>}
                                            {p.en && p.es && p.en.status !== 'published' && (
                                                <span>EN: {p.en.status}</span>
                                            )}
                                            {p.es && p.es.status !== 'published' && (
                                                <span>ES: {p.es.status}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <TranslationCellEditor
                                            id={p.en?.id ?? null}
                                            locale="en"
                                            initialValue={p.en?.value ?? ''}
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <TranslationCellEditor
                                            id={p.es?.id ?? null}
                                            locale="es"
                                            initialValue={p.es?.value ?? ''}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            ))}
        </div>
    );
}
