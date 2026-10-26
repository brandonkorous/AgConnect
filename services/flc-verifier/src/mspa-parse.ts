import { parse as parseCsv } from 'csv-parse/sync';

export type ParsedRow = {
    certificateNumber: string;
    legalName: string;
    streetAddress: string | null;
    city: string | null;
    stateCode: string | null;
    postalCode: string | null;
    expirationDate: Date;
    authHousing: boolean;
    authTransport: boolean;
    authDriving: boolean;
};

export function parseRegistry(csv: string): ParsedRow[] {
    const rows = parseCsv(csv, {
        columns: (header: string[]) => header.map(normalizeHeader),
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        bom: true,
    }) as Record<string, string>[];

    const out: ParsedRow[] = [];
    for (const row of rows) {
        const cert = pick(row, ['certificate_number', 'cert_number', 'flc_number']);
        const name = pick(row, ['legal_name', 'name', 'flc_name', 'farm_labor_contractor_name']);
        const expRaw = pick(row, ['expiration_date', 'exp_date', 'expires']);
        if (!cert || !name || !expRaw) continue;
        const exp = parseFlexibleDate(expRaw);
        if (!exp) continue;

        out.push({
            certificateNumber: cert.toUpperCase(),
            legalName: name,
            streetAddress: pick(row, ['address', 'street', 'street_address']) || null,
            city: pick(row, ['city']) || null,
            stateCode: pick(row, ['state', 'state_code']) || null,
            postalCode: pick(row, ['zip', 'zip_code', 'postal_code']) || null,
            expirationDate: exp,
            authHousing: parseBoolean(pick(row, ['housing', 'authorized_to_house', 'auth_housing'])),
            authTransport: parseBoolean(pick(row, ['transport', 'authorized_to_transport', 'auth_transport'])),
            authDriving: parseBoolean(pick(row, ['driving', 'authorized_to_drive', 'auth_driving'])),
        });
    }
    return out;
}

function normalizeHeader(raw: string): string {
    return raw
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

function pick(row: Record<string, string>, keys: string[]): string {
    for (const k of keys) {
        const v = row[k];
        if (v !== undefined && v !== null && String(v).trim().length > 0) return String(v).trim();
    }
    return '';
}

function parseBoolean(v: string): boolean {
    if (!v) return false;
    const s = v.toLowerCase();
    return s === 'y' || s === 'yes' || s === 'true' || s === '1' || s === 'x';
}

function parseFlexibleDate(raw: string): Date | null {
    // DOL publishes mm/dd/yyyy; data.gov sometimes normalizes to ISO.
    const us = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (us) {
        const [, mm, dd, yyyy] = us;
        const d = new Date(`${yyyy}-${mm!.padStart(2, '0')}-${dd!.padStart(2, '0')}`);
        return Number.isFinite(d.getTime()) ? d : null;
    }
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
        const d = new Date(raw);
        return Number.isFinite(d.getTime()) ? d : null;
    }
    return null;
}
