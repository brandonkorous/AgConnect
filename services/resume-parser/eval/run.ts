/* eslint-disable no-console */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseResume, type ParseResult } from '../src/parser.js';

// Eval runner: walks `eval/fixtures/`, runs each through the parser, scores
// the output against the matching golden, and reports pass/fail against the
// resume-parser acceptance thresholds. Exit code 1 on threshold breach so
// CI can gate merges.

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(HERE, 'fixtures');
const GOLDEN_DIR = path.join(HERE, 'golden');

const THRESHOLDS = {
    schemaValidRate: 0.9,
    fieldAgreement: 0.8,
    medianLatencyMs: 12_000,
    p99LatencyMs: 60_000,
    meanCostUsd: 0.05,
} as const;

type Mode = { only?: string; update?: string };

async function main(): Promise<void> {
    const mode = parseArgs(process.argv.slice(2));
    const fixtures = await listFixtures();
    const filtered = mode.only ? fixtures.filter((f) => f.basename === mode.only) : fixtures;
    if (filtered.length === 0) {
        console.error(`no fixtures matched ${mode.only ?? '*'}`);
        process.exit(1);
    }

    if (mode.update) {
        await updateGolden(mode.update);
        return;
    }

    const results: Array<{
        basename: string;
        parseResult: ParseResult;
        agreement: number;
        expectFailure: string | null;
    }> = [];

    for (const fx of filtered) {
        const text = await fs.readFile(fx.fixturePath, 'utf8');
        const golden = await readGolden(fx.basename);
        const expectFailure =
            golden && typeof golden === 'object' && '__expectFailure' in golden
                ? String((golden as { __expectFailure: unknown }).__expectFailure)
                : null;
        const parseResult = await parseResume({ resumeRawUrl: fx.basename, rawText: text });
        let agreement = 0;
        if (parseResult.status === 'parsed' && golden && expectFailure === null) {
            agreement = scoreAgreement(parseResult.resume, golden as Record<string, unknown>);
        }
        results.push({ basename: fx.basename, parseResult, agreement, expectFailure });
        printRow(fx.basename, parseResult, agreement, expectFailure);
    }

    const stats = summarize(results);
    printStats(stats);
    const pass = checkThresholds(stats);
    process.exit(pass ? 0 : 1);
}

function parseArgs(argv: string[]): Mode {
    const out: Mode = {};
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--only') out.only = argv[++i];
        else if (a === '--update') out.update = argv[++i];
    }
    return out;
}

async function listFixtures(): Promise<Array<{ basename: string; fixturePath: string }>> {
    const entries = await fs.readdir(FIXTURES_DIR);
    return entries
        .filter((e) => e.endsWith('.txt'))
        .sort()
        .map((e) => ({
            basename: e.replace(/\.txt$/, ''),
            fixturePath: path.join(FIXTURES_DIR, e),
        }));
}

async function readGolden(basename: string): Promise<unknown | null> {
    try {
        const raw = await fs.readFile(path.join(GOLDEN_DIR, `${basename}.json`), 'utf8');
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

async function updateGolden(basename: string): Promise<void> {
    const fxPath = path.join(FIXTURES_DIR, `${basename}.txt`);
    const text = await fs.readFile(fxPath, 'utf8');
    const r = await parseResume({ resumeRawUrl: basename, rawText: text });
    if (r.status !== 'parsed') {
        console.error(`update aborted — parse failed: ${r.code} ${r.message}`);
        process.exit(1);
    }
    const out = path.join(GOLDEN_DIR, `${basename}.json`);
    await fs.writeFile(out, JSON.stringify(r.resume, null, 2) + '\n', 'utf8');
    console.log(`wrote ${out}`);
}

// Field-agreement scoring — see eval/README.md for rules.
function scoreAgreement(got: Record<string, unknown>, want: Record<string, unknown>): number {
    const pairs: Array<{ value: number; weight: number }> = [];
    compare(got, want, '', pairs);
    if (pairs.length === 0) return 0;
    const total = pairs.reduce((a, p) => a + p.weight * p.value, 0);
    const weight = pairs.reduce((a, p) => a + p.weight, 0);
    return weight > 0 ? total / weight : 0;
}

function compare(
    got: unknown,
    want: unknown,
    pathLabel: string,
    out: Array<{ value: number; weight: number }>,
): void {
    if (typeof want === 'string') {
        const v = typeof got === 'string' ? scoreString(got, want, pathLabel) : 0;
        out.push({ value: v, weight: 1 });
        return;
    }
    if (typeof want === 'number') {
        out.push({ value: got === want ? 1 : 0, weight: 1 });
        return;
    }
    if (Array.isArray(want)) {
        const arrGot = Array.isArray(got) ? got : [];
        // Length parity
        out.push({
            value: arrGot.length === want.length ? 1 : 0,
            weight: 0.5,
        });
        // For each expected member, find the best-matching item in got
        for (let i = 0; i < want.length; i++) {
            const w = want[i];
            const bestIdx = findBestMatch(arrGot, w);
            if (bestIdx < 0) {
                out.push({ value: 0, weight: 1 });
                continue;
            }
            compare(arrGot[bestIdx], w, `${pathLabel}[${i}]`, out);
        }
        return;
    }
    if (want && typeof want === 'object') {
        const wObj = want as Record<string, unknown>;
        const gObj = (got as Record<string, unknown>) ?? {};
        for (const [k, v] of Object.entries(wObj)) {
            if (k.startsWith('__')) continue;
            compare(gObj[k], v, pathLabel ? `${pathLabel}.${k}` : k, out);
        }
    }
}

function scoreString(got: string, want: string, pathLabel: string): number {
    if (got === want) return 1;
    const a = normalizeForCompare(got, pathLabel);
    const b = normalizeForCompare(want, pathLabel);
    if (a === b) return 0.8;
    if (a.length > 0 && b.length > 0 && (a.includes(b) || b.includes(a))) return 0.5;
    return 0;
}

function normalizeForCompare(s: string, pathLabel: string): string {
    const lower = s.trim().toLowerCase();
    if (pathLabel.endsWith('.phone')) return lower.replace(/[^0-9+]/g, '');
    return lower
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/\s+/g, ' ');
}

function findBestMatch(haystack: unknown[], needle: unknown): number {
    if (haystack.length === 0) return -1;
    if (typeof needle === 'string') {
        for (let i = 0; i < haystack.length; i++) {
            const h = haystack[i];
            if (typeof h === 'string' && scoreString(h, needle, '') > 0.6) return i;
        }
        return -1;
    }
    if (needle && typeof needle === 'object' && 'employer' in needle) {
        const targetEmp = String((needle as Record<string, unknown>).employer ?? '').toLowerCase();
        for (let i = 0; i < haystack.length; i++) {
            const h = haystack[i] as Record<string, unknown> | null;
            const emp = String(h?.employer ?? '').toLowerCase();
            if (emp && targetEmp && (emp.includes(targetEmp) || targetEmp.includes(emp))) {
                return i;
            }
        }
    }
    if (needle && typeof needle === 'object' && 'institution' in needle) {
        const target = String((needle as Record<string, unknown>).institution ?? '').toLowerCase();
        for (let i = 0; i < haystack.length; i++) {
            const h = haystack[i] as Record<string, unknown> | null;
            const inst = String(h?.institution ?? '').toLowerCase();
            if (inst && target && (inst.includes(target) || target.includes(inst))) return i;
        }
    }
    if (needle && typeof needle === 'object' && 'name' in needle) {
        const target = String((needle as Record<string, unknown>).name ?? '').toLowerCase();
        for (let i = 0; i < haystack.length; i++) {
            const h = haystack[i] as Record<string, unknown> | null;
            const name = String(h?.name ?? '').toLowerCase();
            if (name && target && (name.includes(target) || target.includes(name))) return i;
        }
    }
    return haystack.length > 0 ? 0 : -1;
}

type RunResults = ReturnType<typeof emptyResults>;
function emptyResults() {
    return {
        n: 0,
        schemaValid: 0,
        agreementSum: 0,
        agreementN: 0,
        latencies: [] as number[],
        costs: [] as number[],
        cacheReads: 0,
        cacheCreations: 0,
        inputTokens: 0,
    };
}

function summarize(
    rows: Array<{
        basename: string;
        parseResult: ParseResult;
        agreement: number;
        expectFailure: string | null;
    }>,
): RunResults {
    const r = emptyResults();
    for (const row of rows) {
        r.n += 1;
        const expectsFailure = row.expectFailure !== null;
        if (row.parseResult.status === 'parsed') {
            if (!expectsFailure) {
                r.schemaValid += 1;
                r.agreementSum += row.agreement;
                r.agreementN += 1;
            }
            r.latencies.push(row.parseResult.parseDurationMs);
            r.costs.push(row.parseResult.costUsd);
            r.cacheReads += row.parseResult.usage.cacheReadInputTokens ?? 0;
            r.cacheCreations += row.parseResult.usage.cacheCreationInputTokens ?? 0;
            r.inputTokens += row.parseResult.usage.inputTokens;
        } else if (expectsFailure && row.parseResult.code === row.expectFailure) {
            r.schemaValid += 1;
        }
    }
    return r;
}

function printRow(
    basename: string,
    r: ParseResult,
    agreement: number,
    expectFailure: string | null,
): void {
    if (r.status === 'parsed') {
        const flag = expectFailure ? ' (EXPECTED FAIL — got parse)' : '';
        console.log(
            `  ${basename.padEnd(28)} ok    ${r.parseDurationMs}ms  $${r.costUsd.toFixed(5)}  agree=${(agreement * 100).toFixed(0)}%${flag}`,
        );
    } else {
        const flag =
            expectFailure === r.code ? ' (expected)' : expectFailure ? ' (wrong failure)' : '';
        console.log(
            `  ${basename.padEnd(28)} FAIL  ${r.parseDurationMs}ms  ${r.code}${flag}`,
        );
    }
}

function printStats(r: RunResults): void {
    const sortedLatency = [...r.latencies].sort((a, b) => a - b);
    const median = pct(sortedLatency, 0.5);
    const p99 = pct(sortedLatency, 0.99);
    const sumCost = r.costs.reduce((a, b) => a + b, 0);
    const meanCost = r.costs.length > 0 ? sumCost / r.costs.length : 0;
    const cacheTotal = r.cacheReads + r.cacheCreations;
    const cacheRate = cacheTotal > 0 ? r.cacheReads / cacheTotal : 0;
    const schemaRate = r.n > 0 ? r.schemaValid / r.n : 0;
    const agreement = r.agreementN > 0 ? r.agreementSum / r.agreementN : 0;

    console.log('\nSummary');
    console.log(`  fixtures:        ${r.n}`);
    console.log(`  schema-valid:    ${(schemaRate * 100).toFixed(1)}%   threshold ≥ ${THRESHOLDS.schemaValidRate * 100}%`);
    console.log(`  field-agreement: ${(agreement * 100).toFixed(1)}%   threshold ≥ ${THRESHOLDS.fieldAgreement * 100}%`);
    console.log(`  median latency:  ${median}ms   threshold < ${THRESHOLDS.medianLatencyMs}ms`);
    console.log(`  p99 latency:     ${p99}ms   threshold < ${THRESHOLDS.p99LatencyMs}ms`);
    console.log(`  mean cost:       $${meanCost.toFixed(5)}   threshold < $${THRESHOLDS.meanCostUsd}`);
    console.log(`  cache hit rate:  ${(cacheRate * 100).toFixed(1)}%  (read=${r.cacheReads}, create=${r.cacheCreations})`);
}

function pct(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
    return sorted[idx] ?? 0;
}

function checkThresholds(r: RunResults): boolean {
    const sortedLatency = [...r.latencies].sort((a, b) => a - b);
    const median = pct(sortedLatency, 0.5);
    const p99 = pct(sortedLatency, 0.99);
    const meanCost = r.costs.length > 0 ? r.costs.reduce((a, b) => a + b, 0) / r.costs.length : 0;
    const schemaRate = r.n > 0 ? r.schemaValid / r.n : 0;
    const agreement = r.agreementN > 0 ? r.agreementSum / r.agreementN : 0;

    let pass = true;
    const fail = (label: string, got: string, want: string) => {
        console.error(`  ✗ ${label}: ${got}, threshold ${want}`);
        pass = false;
    };
    if (schemaRate < THRESHOLDS.schemaValidRate) {
        fail('schema-valid', `${(schemaRate * 100).toFixed(1)}%`, `≥ ${THRESHOLDS.schemaValidRate * 100}%`);
    }
    if (r.agreementN > 0 && agreement < THRESHOLDS.fieldAgreement) {
        fail('field-agreement', `${(agreement * 100).toFixed(1)}%`, `≥ ${THRESHOLDS.fieldAgreement * 100}%`);
    }
    if (median > THRESHOLDS.medianLatencyMs) {
        fail('median latency', `${median}ms`, `< ${THRESHOLDS.medianLatencyMs}ms`);
    }
    if (p99 > THRESHOLDS.p99LatencyMs) {
        fail('p99 latency', `${p99}ms`, `< ${THRESHOLDS.p99LatencyMs}ms`);
    }
    if (meanCost > THRESHOLDS.meanCostUsd) {
        fail('mean cost', `$${meanCost.toFixed(5)}`, `< $${THRESHOLDS.meanCostUsd}`);
    }
    return pass;
}

void main().catch((e) => {
    console.error(e);
    process.exit(2);
});
