import { isProviderConfigured } from '@agconn/llm';
import { ResumeSchema, type Resume } from '@agconn/schemas';
import { extract, type ExtractKind } from './extract.js';
import { normalize } from './normalize.js';
import { ParserError, type ParserErrorCode } from './errors.js';
import {
    callForPdf,
    callForText,
    callRepair,
    extractJson,
    type LlmResult,
} from './llm.js';
import { computeCostUsd, type Usage } from './cost.js';

// Orchestrator: extract → call LLM (router) → schema validate → repair-reprompt
// once if invalid → normalize. Text+repair route through llm-harness; image-
// only PDFs go straight to Claude until the harness supports document inputs.
// Returns a discriminated result the queue consumer (index.ts) persists.
//
// Spec: docs/00-foundation/07-resume-parser/

const MIN_TEXT_LENGTH = 50;

export type ParseSuccess = {
    status: 'parsed';
    resume: Resume;
    extractKind: ExtractKind;
    rawTextLength: number;
    modelUsed: string;
    usage: Usage;
    costUsd: number;
    repairAttempted: boolean;
    parseDurationMs: number;
};

export type ParseFailure = {
    status: 'failed';
    code: ParserErrorCode;
    message: string;
    extractKind: ExtractKind | null;
    rawTextLength: number;
    modelUsed: string | null;
    usage: Usage | null;
    costUsd: number;
    repairAttempted: boolean;
    parseDurationMs: number;
};

export type ParseResult = ParseSuccess | ParseFailure;

export type ParseArgs = {
    resumeRawUrl: string;
    // Optional pre-extracted text — bypasses fetch+extract when the upload
    // path already produced clean text synchronously.
    rawText?: string;
};

export async function parseResume(args: ParseArgs): Promise<ParseResult> {
    const startedAt = Date.now();
    let extractKind: ExtractKind | null = null;
    let rawTextLength = 0;
    let repairAttempted = false;
    let cumUsage: Usage = { inputTokens: 0, outputTokens: 0, cacheReadInputTokens: 0, cacheCreationInputTokens: 0 };
    let cumCost = 0;
    let modelUsed: string | null = null;

    const fail = (code: ParserErrorCode, message: string): ParseFailure => ({
        status: 'failed',
        code,
        message,
        extractKind,
        rawTextLength,
        modelUsed,
        usage: cumUsage.inputTokens > 0 ? cumUsage : null,
        costUsd: cumCost,
        repairAttempted,
        parseDurationMs: Date.now() - startedAt,
    });

    if (!isProviderConfigured()) {
        return fail('no_provider', 'no LLM provider configured');
    }

    // Step 1 — extract text, or hand the PDF directly to the Claude path
    let llmCall: () => Promise<LlmResult>;
    let sourceTextForRepair = '';
    try {
        if (args.rawText !== undefined) {
            extractKind = 'plaintext';
            rawTextLength = args.rawText.length;
            if (args.rawText.trim().length < MIN_TEXT_LENGTH) {
                return fail('too_little_text', `pre-extracted text is ${args.rawText.length} chars`);
            }
            sourceTextForRepair = args.rawText;
            llmCall = () => callForText(args.rawText!);
        } else {
            const extracted = await extract({ url: args.resumeRawUrl });
            extractKind = extracted.kind;
            if (extracted.kind === 'pdf_ocr') {
                // Image-only PDF — Claude reads the document directly. We
                // don't have source text for the repair prompt, so it falls
                // back to an empty placeholder; the LLM still has its prior
                // JSON output to anchor on.
                rawTextLength = 0;
                llmCall = () => callForPdf(extracted.pdf);
            } else {
                rawTextLength = extracted.text.length;
                if (extracted.text.trim().length < MIN_TEXT_LENGTH) {
                    return fail('too_little_text', `${extracted.kind} produced ${extracted.text.length} chars`);
                }
                sourceTextForRepair = extracted.text;
                llmCall = () => callForText(extracted.text);
            }
        }
    } catch (e) {
        if (e instanceof ParserError) return fail(e.code, e.message);
        return fail('fetch_failed', e instanceof Error ? e.message : String(e));
    }

    // Step 2 — first LLM call
    let result: LlmResult;
    try {
        result = await llmCall();
    } catch (e) {
        if (e instanceof ParserError) return fail(e.code, e.message);
        return fail('llm_failed', e instanceof Error ? e.message : String(e));
    }
    modelUsed = result.model;
    cumUsage = sumUsage(cumUsage, result.usage);
    cumCost += computeCostUsd(result.model, result.usage);

    let json = extractJson(result.rawJson);
    if (json === null) {
        // Empty output / non-JSON / fenced gibberish — repair once.
        repairAttempted = true;
        try {
            const repair = await callRepair({
                previousJsonText: result.rawJson,
                issues: ['Response was not valid JSON. Return JSON only.'],
                originalText: sourceTextForRepair,
            });
            cumUsage = sumUsage(cumUsage, repair.usage);
            cumCost += computeCostUsd(repair.model, repair.usage);
            json = extractJson(repair.rawJson);
            if (json === null) {
                return fail('invalid_json', 'LLM returned non-JSON twice');
            }
            result = repair;
            modelUsed = repair.model;
        } catch (e) {
            if (e instanceof ParserError) return fail(e.code, e.message);
            return fail('llm_failed', e instanceof Error ? e.message : String(e));
        }
    }

    let parsed = ResumeSchema.safeParse(json);
    if (!parsed.success && !repairAttempted) {
        // Step 3 — schema mismatch: one repair re-prompt with the specific issues
        repairAttempted = true;
        const issues = parsed.error.issues.slice(0, 8).map(formatIssue);
        try {
            const repair = await callRepair({
                previousJsonText: result.rawJson,
                issues,
                originalText: sourceTextForRepair,
            });
            cumUsage = sumUsage(cumUsage, repair.usage);
            cumCost += computeCostUsd(repair.model, repair.usage);
            const repairJson = extractJson(repair.rawJson);
            if (repairJson !== null) {
                parsed = ResumeSchema.safeParse(repairJson);
            }
            modelUsed = repair.model;
        } catch (e) {
            // Repair call failed — surface as schema_mismatch since we have
            // a valid-but-wrong response in hand.
            if (e instanceof ParserError) return fail(e.code, e.message);
            return fail('llm_failed', e instanceof Error ? e.message : String(e));
        }
    }

    if (!parsed.success) {
        return fail('schema_mismatch', summarizeIssues(parsed.error.issues));
    }

    const normalized = normalize(parsed.data);
    return {
        status: 'parsed',
        resume: normalized,
        extractKind: extractKind!,
        rawTextLength,
        modelUsed: modelUsed ?? 'unknown',
        usage: cumUsage,
        costUsd: cumCost,
        repairAttempted,
        parseDurationMs: Date.now() - startedAt,
    };
}

function formatIssue(issue: { path: ReadonlyArray<PropertyKey>; message: string }): string {
    const path = issue.path.length > 0 ? issue.path.map(String).join('.') : '(root)';
    return `${path}: ${issue.message}`;
}

function summarizeIssues(
    issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): string {
    return issues.slice(0, 3).map(formatIssue).join(' | ');
}

function sumUsage(a: Usage, b: Usage): Usage {
    return {
        inputTokens: a.inputTokens + b.inputTokens,
        outputTokens: a.outputTokens + b.outputTokens,
        cacheReadInputTokens: (a.cacheReadInputTokens ?? 0) + (b.cacheReadInputTokens ?? 0),
        cacheCreationInputTokens:
            (a.cacheCreationInputTokens ?? 0) + (b.cacheCreationInputTokens ?? 0),
    };
}
