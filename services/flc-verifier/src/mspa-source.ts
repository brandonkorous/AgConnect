// Finds and downloads the DOL MSPA registry file on data.gov (the file path rotates between revisions).
const DATA_GOV_PACKAGE_URL =
    'https://catalog.data.gov/api/3/action/package_show?id=registered-farm-labor-contractor-listing-5cd50';

const USER_AGENT = 'AGCONN-FlcVerifier/1.0 (+https://agconn.com/about; ops@agconn.com)';
const FETCH_TIMEOUT_MS = 60_000;

type DataGovResource = {
    url: string;
    format: string;
    last_modified?: string | null;
};

type DataGovPackageResponse = {
    success: boolean;
    result?: {
        resources?: DataGovResource[];
    };
};

export async function resolveResourceUrl(): Promise<{ url: string; lastModified: Date | null } | null> {
    const res = await fetchWithTimeout(DATA_GOV_PACKAGE_URL, {
        method: 'GET',
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`data_gov_package_status_${res.status}`);
    const body = (await res.json()) as DataGovPackageResponse;
    if (!body.success) throw new Error('data_gov_package_unsuccessful');

    const resources = body.result?.resources ?? [];
    // Prefer CSV; fall back to whatever's first if the format field is empty.
    const preferred =
        resources.find((r) => /csv/i.test(r.format ?? '')) ?? resources[0] ?? null;
    if (!preferred) return null;
    const last = preferred.last_modified ? new Date(preferred.last_modified) : null;
    return { url: preferred.url, lastModified: last && Number.isFinite(last.getTime()) ? last : null };
}

export async function downloadResource(url: string): Promise<string> {
    const res = await fetchWithTimeout(url, {
        method: 'GET',
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/csv,*/*' },
    });
    if (!res.ok) throw new Error(`mspa_download_status_${res.status}`);
    return await res.text();
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}
