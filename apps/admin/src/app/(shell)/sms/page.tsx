import Link from 'next/link';
import { fetchSms, fetchSmsOptOuts } from '@/lib/ops-api';
import { SavedViews } from '@/components/SavedViews';

export const metadata = { title: 'SMS — AgConn Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;
const SMS_STATUSES = ['queued', 'sent', 'delivered', 'failed', 'undelivered'];

export default async function SmsPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const sp = await searchParams;
    const tab = sp['tab'] === 'opt-outs' ? 'opt-outs' : 'logs';
    const reveal = sp['reveal'] === 'true';
    const search = typeof sp['search'] === 'string' ? sp['search'] : undefined;
    const status = typeof sp['status'] === 'string' ? sp['status'] : undefined;
    const template = typeof sp['template'] === 'string' ? sp['template'] : undefined;

    const [logsRes, optOutsRes] = await Promise.all([
        tab === 'logs' ? fetchSms({ search, status, template, reveal }) : null,
        tab === 'opt-outs' ? fetchSmsOptOuts({ search, reveal }) : null,
    ]);

    const revealHref = (() => {
        const qs = new URLSearchParams();
        qs.set('tab', tab);
        if (search) qs.set('search', search);
        if (status) qs.set('status', status);
        if (template) qs.set('template', template);
        if (!reveal) qs.set('reveal', 'true');
        return `/sms?${qs.toString()}`;
    })();

    const exportHref = (() => {
        const qs = new URLSearchParams();
        if (search) qs.set('search', search);
        if (status) qs.set('status', status);
        if (template) qs.set('template', template);
        if (reveal) qs.set('reveal', 'true');
        return `/api/export/ops/sms/export.csv${qs.toString() ? `?${qs.toString()}` : ''}`;
    })();

    return (
        <div className="space-y-4">
            <div className="flex items-baseline justify-between">
                <div>
                    <p className="eyebrow text-base-content/60">Platform</p>
                    <h1 className="font-serif text-2xl font-medium tracking-tight">SMS</h1>
                    <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
                        Outbound SMS log, delivery status, and opt-out list. Phone numbers redacted
                        unless reveal is on.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {tab === 'logs' && (
                        <a href={exportHref} className="btn btn-ghost btn-sm rounded-full">
                            Export CSV
                        </a>
                    )}
                    <Link
                        href={revealHref}
                        className={`btn btn-sm rounded-full ${reveal ? 'btn-warning' : 'btn-ghost'}`}
                    >
                        {reveal ? 'Hide PII' : 'Reveal PII'}
                    </Link>
                </div>
            </div>

            <div role="tablist" className="tabs tabs-border">
                <Link
                    href={`/sms?tab=logs${reveal ? '&reveal=true' : ''}`}
                    role="tab"
                    className={`tab ${tab === 'logs' ? 'tab-active' : ''}`}
                >
                    Outbound log
                </Link>
                <Link
                    href={`/sms?tab=opt-outs${reveal ? '&reveal=true' : ''}`}
                    role="tab"
                    className={`tab ${tab === 'opt-outs' ? 'tab-active' : ''}`}
                >
                    Opt-outs
                </Link>
            </div>

            {tab === 'logs' && logsRes && (
                <>
                    <form className="bg-base-100 border-base-300 rounded-box flex flex-wrap gap-3 border p-3">
                        <input type="hidden" name="tab" value="logs" />
                        {reveal && <input type="hidden" name="reveal" value="true" />}
                        <input
                            type="text"
                            name="search"
                            defaultValue={search ?? ''}
                            placeholder="phone, provider sid, user id"
                            className="input input-sm min-w-64 flex-1"
                        />
                        <select name="status" defaultValue={status ?? ''} className="select select-sm">
                            <option value="">Any status</option>
                            {SMS_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            name="template"
                            defaultValue={template ?? ''}
                            placeholder="template"
                            className="input input-sm w-40"
                        />
                        <button type="submit" className="btn btn-sm rounded-full">
                            Search
                        </button>
                        {(search || status || template) && (
                            <Link href={`/sms?tab=logs${reveal ? '&reveal=true' : ''}`} className="btn btn-ghost btn-sm">
                                Reset
                            </Link>
                        )}
                    </form>

                    <SavedViews viewKey="sms.logs" alwaysInclude={['tab']} />

                    {!logsRes.ok ? (
                        <Err result={logsRes} />
                    ) : logsRes.data.sms.length === 0 ? (
                        <Empty msg="No SMS log entries match." />
                    ) : (
                        <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
                            <table className="table">
                                <thead className="bg-base-200">
                                    <tr>
                                        <th>Queued</th>
                                        <th>Template</th>
                                        <th>Lang</th>
                                        <th>To</th>
                                        <th>Status</th>
                                        <th>Body</th>
                                        <th>Provider</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logsRes.data.sms.map((s) => (
                                        <tr key={s.id}>
                                            <td className="font-mono text-xs">{s.queuedAt.replace('T', ' ').slice(0, 19)}</td>
                                            <td className="text-xs">{s.template}</td>
                                            <td className="text-xs uppercase">{s.locale}</td>
                                            <td className="font-mono text-xs">{s.toPhone}</td>
                                            <td>
                                                <SmsStatusBadge status={s.status} />
                                            </td>
                                            <td
                                                className={`max-w-[24ch] truncate text-xs ${reveal ? '' : 'text-base-content/40 italic'}`}
                                            >
                                                {s.body}
                                            </td>
                                            <td className="font-mono text-xs">
                                                {s.providerSid?.slice(0, 14) ?? '—'}
                                                {s.errorCode && (
                                                    <div className="text-error text-xs">err {s.errorCode}</div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {tab === 'opt-outs' && optOutsRes && (
                <>
                    <form className="bg-base-100 border-base-300 rounded-box flex flex-wrap gap-3 border p-3">
                        <input type="hidden" name="tab" value="opt-outs" />
                        {reveal && <input type="hidden" name="reveal" value="true" />}
                        <input
                            type="text"
                            name="search"
                            defaultValue={search ?? ''}
                            placeholder="phone substring"
                            className="input input-sm min-w-64 flex-1"
                        />
                        <button type="submit" className="btn btn-sm rounded-full">
                            Search
                        </button>
                        {search && (
                            <Link href={`/sms?tab=opt-outs${reveal ? '&reveal=true' : ''}`} className="btn btn-ghost btn-sm">
                                Reset
                            </Link>
                        )}
                    </form>

                    <SavedViews viewKey="sms.optouts" alwaysInclude={['tab']} />

                    {!optOutsRes.ok ? (
                        <Err result={optOutsRes} />
                    ) : optOutsRes.data.optOuts.length === 0 ? (
                        <Empty msg="No opt-outs recorded." />
                    ) : (
                        <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
                            <table className="table">
                                <thead className="bg-base-200">
                                    <tr>
                                        <th>Phone</th>
                                        <th>Source</th>
                                        <th>Opted out</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {optOutsRes.data.optOuts.map((o, i) => (
                                        <tr key={i}>
                                            <td className="font-mono text-xs">{o.phone}</td>
                                            <td className="text-xs">{o.source}</td>
                                            <td className="font-mono text-xs">
                                                {o.optedOutAt.replace('T', ' ').slice(0, 19)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function SmsStatusBadge({ status }: { status: string }) {
    const cls =
        status === 'delivered'
            ? 'badge-success'
            : status === 'sent'
                ? 'badge-info'
                : status === 'queued'
                    ? 'badge-warning'
                    : 'badge-error';
    return <span className={`badge ${cls} badge-sm`}>{status}</span>;
}

function Err({ result }: { result: { ok: false; error: { code: string; message: string } } }) {
    return (
        <div role="alert" className="alert alert-error">
            <span>
                {result.error.code} — {result.error.message}
            </span>
        </div>
    );
}

function Empty({ msg }: { msg: string }) {
    return (
        <div className="bg-base-100 border-base-300 text-base-content/70 rounded-box border p-8 text-center text-sm">
            {msg}
        </div>
    );
}
