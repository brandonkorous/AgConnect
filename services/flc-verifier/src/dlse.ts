import { load as loadHtml } from 'cheerio';
import type { CheerioAPI } from 'cheerio';

// CA DIR/DLSE Farm Labor Contractor license search.
//
// Migrated from the legacy permits.dir.ca.gov form to a Salesforce Sites
// Visualforce page in 2024. The DLSE FLC topic page (dir.ca.gov/dlse/flc.htm)
// links here as the public source of truth.
//
// Why server-side HTTP instead of Playwright:
//   - The page is server-rendered HTML (Apex, not Lightning, not LWC).
//   - reCAPTCHA v2 is loaded but not currently enforced on the submit path.
//     If enforcement turns on we detect the marker and return a typed result
//     instead of attempting to solve — the admin handles those manually.
//   - Visualforce ViewState is required in every POST, so we GET the form
//     first to mint one. The dynamic `j_id14` field-name prefix is parsed
//     out of the rendered form rather than hardcoded.
//
// All field names below come from inspecting the live form. If DLSE rotates
// the j_id prefix on a redeploy, the form-skeleton parse below will pick up
// the new names automatically; the search field labels in the markup are
// stable.

const SEARCH_URL = 'https://cadir.my.salesforce-sites.com/RegistrationSearch';

const USER_AGENT = 'AgConn-FlcVerifier/1.0 (+https://agconn.com/about; ops@agconn.com)';
const FETCH_TIMEOUT_MS = 20_000;

export type DlseScrapeResult =
  | {
      kind: 'active' | 'expired' | 'suspended';
      registrationNumber: string;
      legalName: string;
      dbaName: string | null;
      effectiveDate: string | null;
      expirationDate: string | null;
      address: string | null;
    }
  | { kind: 'not_found' }
  | { kind: 'captcha_blocked' }
  | { kind: 'error'; message: string };

type FormSkeleton = {
  cookie: string;
  fields: Record<string, string>;
  inputName: (label: 'registrationNumberStr' | 'selectedRecordType' | 'selectedStatus' | 'searchbt') => string | null;
};

export async function checkDlseLicense(licenseNumber: string): Promise<DlseScrapeResult> {
  if (!licenseNumber || licenseNumber.trim().length === 0) {
    return { kind: 'error', message: 'license_number_empty' };
  }

  let skeleton: FormSkeleton;
  try {
    skeleton = await fetchFormSkeleton();
  } catch (err) {
    return { kind: 'error', message: `form_fetch_failed:${describe(err)}` };
  }

  const submitName = skeleton.inputName('searchbt');
  const recordTypeName = skeleton.inputName('selectedRecordType');
  const statusName = skeleton.inputName('selectedStatus');
  const numberName = skeleton.inputName('registrationNumberStr');
  if (!submitName || !recordTypeName || !statusName || !numberName) {
    return { kind: 'error', message: 'form_field_names_missing' };
  }

  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(skeleton.fields)) body.append(k, v);
  body.set(recordTypeName, 'Farm Labor Contractor');
  body.set(statusName, 'ALL');
  body.set(numberName, licenseNumber.trim());
  body.set(submitName, 'Search');

  let html: string;
  try {
    const res = await fetchWithTimeout(SEARCH_URL, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: skeleton.cookie,
        Referer: SEARCH_URL,
      },
      body: body.toString(),
    });
    if (!res.ok) return { kind: 'error', message: `submit_status_${res.status}` };
    html = await res.text();
  } catch (err) {
    return { kind: 'error', message: `submit_failed:${describe(err)}` };
  }

  if (looksLikeCaptchaChallenge(html)) return { kind: 'captcha_blocked' };

  return parseResultPage(html, licenseNumber);
}

async function fetchFormSkeleton(): Promise<FormSkeleton> {
  const res = await fetchWithTimeout(SEARCH_URL, {
    method: 'GET',
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
  });
  if (!res.ok) throw new Error(`form_get_status_${res.status}`);
  const cookie = collectCookies(res.headers);
  const html = await res.text();

  const $ = loadHtml(html);
  const fields: Record<string, string> = {};
  $('form input[type="hidden"]').each((_, el) => {
    const name = $(el).attr('name');
    const value = $(el).attr('value') ?? '';
    if (name) fields[name] = value;
  });

  const fieldFor = buildFieldNameLookup($);
  return {
    cookie,
    fields,
    inputName: (label) => fieldFor[label] ?? null,
  };
}

// The Visualforce form rotates a `j_id<N>:` prefix on every release. We never
// want to hardcode it. Map the labels we care about to whatever Salesforce
// emitted this build by walking the DOM:
//   - registrationNumberStr/selectedRecordType/selectedStatus are exact suffix
//     matches on the input `name=`.
//   - "searchbt" is the submit input by id suffix.
function buildFieldNameLookup($: CheerioAPI): Record<string, string> {
  const map: Record<string, string> = {};
  const SUFFIXES = ['registrationNumberStr', 'selectedRecordType', 'selectedStatus'] as const;
  $('form input, form select').each((_, el) => {
    const name = $(el).attr('name');
    if (!name) return;
    for (const suffix of SUFFIXES) {
      if (name.endsWith(`:${suffix}`)) map[suffix] = name;
    }
  });
  $('form input[type="submit"]').each((_, el) => {
    const id = $(el).attr('id') ?? '';
    const name = $(el).attr('name');
    if (id.endsWith(':searchbt') && name) map.searchbt = name;
  });
  return map;
}

function looksLikeCaptchaChallenge(html: string): boolean {
  // Only treat reCAPTCHA as a *block* when the page actively asks for a token.
  // The script tag is loaded on every render — that's the unenforced state we
  // want to allow. Enforcement looks like an empty `g-recaptcha-response`
  // input being echoed back as required, or the form being replaced by a
  // CAPTCHA challenge container.
  if (/name="g-recaptcha-response"\s+required/i.test(html)) return true;
  if (/please verify you are human/i.test(html)) return true;
  if (/captcha challenge/i.test(html)) return true;
  return false;
}

function parseResultPage(html: string, expectedNumber: string): DlseScrapeResult {
  const $ = loadHtml(html);

  // The result page renders a table with a header row and zero or more body
  // rows. We look for a row whose first column contains the registration
  // number we searched for (Salesforce sometimes returns multiple matches
  // when the user supplies a partial number — we only honor an exact match).
  const target = expectedNumber.trim().toUpperCase();
  let match: ReturnType<typeof rowToResult> | null = null;

  $('table tbody tr').each((_, row) => {
    const cells = $(row)
      .find('td')
      .map((__, td) => $(td).text().trim())
      .get();
    if (cells.length < 4) return;
    const num = (cells[0] ?? '').toUpperCase();
    if (num !== target) return;
    match = rowToResult(cells);
  });

  if (!match) return { kind: 'not_found' };
  return match;
}

function rowToResult(cells: string[]): DlseScrapeResult {
  // Column order on the DLSE results table (observed):
  //   0: registration number
  //   1: legal name
  //   2: DBA name (often empty)
  //   3: status (Active, Expired, Suspended, ...)
  //   4: effective date  (mm/dd/yyyy)
  //   5: expiration date (mm/dd/yyyy)
  //   6: address (single cell, comma-separated)
  const [registrationNumber, legalName, dbaName, statusRaw, effectiveDate, expirationDate, address] =
    cells;

  if (!registrationNumber || !legalName || !statusRaw) {
    return { kind: 'error', message: 'result_row_missing_required_columns' };
  }

  const kind = classifyStatus(statusRaw);
  if (kind === 'unknown') {
    return { kind: 'error', message: `unknown_status:${statusRaw}` };
  }

  return {
    kind,
    registrationNumber,
    legalName,
    dbaName: dbaName?.trim() ? dbaName.trim() : null,
    effectiveDate: parseUsDate(effectiveDate),
    expirationDate: parseUsDate(expirationDate),
    address: address?.trim() ? address.trim() : null,
  };
}

function classifyStatus(raw: string): 'active' | 'expired' | 'suspended' | 'unknown' {
  const v = raw.toLowerCase();
  if (v.includes('active')) return 'active';
  if (v.includes('expired')) return 'expired';
  if (v.includes('suspend') || v.includes('revok')) return 'suspended';
  return 'unknown';
}

function parseUsDate(input: string | undefined): string | null {
  if (!input) return null;
  const m = input.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, mm, dd, yyyy] = m;
  return `${yyyy}-${mm!.padStart(2, '0')}-${dd!.padStart(2, '0')}`;
}

function collectCookies(headers: Headers): string {
  const raw = headers.get('set-cookie');
  if (!raw) return '';
  // fetch's Headers normally folds multiple Set-Cookie into one comma-joined
  // string, which is unsafe to split because cookie values may contain commas.
  // For our purposes we only need the session cookie that Salesforce sets,
  // and the only commas in those are inside Expires=, which we strip.
  return raw
    .split(/,(?=[^ ]+=)/)
    .map((c) => c.split(';')[0]!.trim())
    .filter(Boolean)
    .join('; ');
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

function describe(err: unknown): string {
  if (err instanceof Error) return err.message.slice(0, 200);
  return String(err).slice(0, 200);
}
