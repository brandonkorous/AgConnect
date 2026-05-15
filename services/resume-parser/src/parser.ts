import { llm, isProviderConfigured } from '@agconn/llm';
import { ResumeSchema, type Resume } from '@agconn/schemas';

export type ParseResult =
    | { status: 'parsed'; resume: Resume }
    | { status: 'failed'; reason: 'no_provider' | 'fetch_failed' | 'parser_error' | 'schema_mismatch' };

export type ParseArgs = {
    resumeRawUrl: string;
    rawText?: string;
};

const SYSTEM_PROMPT = `You extract a worker's resume into a strict JSON schema. Output JSON only — no prose, no markdown.
Rules:
- The "experience" array lists farm/agriculture jobs first, with most recent first.
- "skills" is a flat array of plain-language tags (e.g. "Pruning", "Tractor", "Pesticide handling"). Translate from Spanish if needed.
- Dates use YYYY-MM. If only a year is given, use YYYY-01.
- If a field is unknown, omit it. Don't invent.`;

export async function parseResume(args: ParseArgs): Promise<ParseResult> {
    if (!isProviderConfigured()) {
        return { status: 'failed', reason: 'no_provider' };
    }

    let text = args.rawText;
    if (!text) {
        try {
            text = await fetchAsText(args.resumeRawUrl);
        } catch (e) {
            console.error('[resume-parser] fetch failed', {
                url: args.resumeRawUrl,
                err: e instanceof Error ? e.message : String(e),
            });
            return { status: 'failed', reason: 'fetch_failed' };
        }
    }

    if (!text || text.trim().length === 0) {
        return { status: 'failed', reason: 'fetch_failed' };
    }

    let raw: string;
    try {
        const result = await llm.complete({
            model: 'resume-parser',
            system: SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: `Extract this resume into the AGCONN ResumeSchema:\n\n${text.slice(0, 20000)}`,
                },
            ],
            maxTokens: 4000,
            temperature: 0,
        });
        raw = result.text;
    } catch (e) {
        console.error('[resume-parser] llm threw', {
            err: e instanceof Error ? e.message : String(e),
        });
        return { status: 'failed', reason: 'parser_error' };
    }

    const json = extractJson(raw);
    if (!json) return { status: 'failed', reason: 'parser_error' };

    const parsed = ResumeSchema.safeParse(json);
    if (!parsed.success) {
        console.warn('[resume-parser] schema mismatch', {
            issues: parsed.error.issues.slice(0, 3),
        });
        return { status: 'failed', reason: 'schema_mismatch' };
    }
    return { status: 'parsed', resume: parsed.data };
}

async function fetchAsText(url: string): Promise<string> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
    // Best-effort text extraction for plain text or HTML uploads. Real PDF
    // parsing should hit a textract step before this service — we don't ship a
    // PDF parser here.
    return await res.text();
}

function extractJson(raw: string): unknown | null {
    // The model usually returns `{...}` directly. Tolerate code-fenced output
    // (```json\n...\n```) just in case.
    const trimmed = raw.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const candidate = fenced?.[1] ?? trimmed;
    try {
        return JSON.parse(candidate);
    } catch {
        return null;
    }
}
