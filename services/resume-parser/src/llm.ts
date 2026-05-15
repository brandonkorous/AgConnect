import { llm, type CompletionResponse } from '@agconn/llm';
import { ParserError } from './errors.js';
import {
    SYSTEM_PROMPT,
    userMessageForText,
    USER_MESSAGE_FOR_PDF,
    repairUserMessage,
} from './prompts.js';
import type { Usage } from './cost.js';

// All paths route through llm-harness (v0.3+). The `cacheable: true` flag
// translates to Anthropic's `cache_control: ephemeral` on the system block,
// so the ≥80% cache-hit target after warmup still holds. OpenAI ignores the
// flag — its prompt cache is automatic on supported models.
//
// Document inputs (image-only PDFs) land as DocumentContent blocks; the
// Anthropic adapter renders them as native `document` blocks. If the active
// model is OpenAI and on Chat Completions only, the harness throws a clear
// `unsupported document input` error — caught here and surfaced as the
// parser's `unsupported_format` failure code.

const MAX_TOKENS = 4000;

export type LlmResult = {
    rawJson: string;
    usage: Usage;
    model: string;
};

export async function callForText(text: string): Promise<LlmResult> {
    let response: CompletionResponse;
    try {
        response = await llm.complete({
            model: 'resume-parser',
            system: SYSTEM_PROMPT,
            cacheable: true,
            messages: [{ role: 'user', content: userMessageForText(text) }],
            maxTokens: MAX_TOKENS,
            temperature: 0,
        });
    } catch (e) {
        throw new ParserError('llm_failed', 'llm.complete (text) failed', e);
    }
    return shape(response);
}

export async function callRepair(args: {
    previousJsonText: string;
    issues: string[];
    originalText: string;
}): Promise<LlmResult> {
    let response: CompletionResponse;
    try {
        response = await llm.complete({
            model: 'resume-parser',
            system: SYSTEM_PROMPT,
            cacheable: true,
            messages: [
                {
                    role: 'user',
                    content: repairUserMessage(
                        args.previousJsonText,
                        args.issues,
                        args.originalText,
                    ),
                },
            ],
            maxTokens: MAX_TOKENS,
            temperature: 0,
        });
    } catch (e) {
        throw new ParserError('llm_failed', 'llm.complete (repair) failed', e);
    }
    return shape(response);
}

export async function callForPdf(pdf: Buffer): Promise<LlmResult> {
    let response: CompletionResponse;
    try {
        response = await llm.complete({
            model: 'resume-parser',
            system: SYSTEM_PROMPT,
            cacheable: true,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'document',
                            source: {
                                type: 'base64',
                                mediaType: 'application/pdf',
                                data: pdf.toString('base64'),
                            },
                            filename: 'resume.pdf',
                        },
                        { type: 'text', text: USER_MESSAGE_FOR_PDF },
                    ],
                },
            ],
            maxTokens: MAX_TOKENS,
            temperature: 0,
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/document|unsupported|file/i.test(msg) && /support|input/i.test(msg)) {
            throw new ParserError(
                'unsupported_format',
                `active LLM provider does not support PDF document inputs: ${msg}`,
                e,
            );
        }
        throw new ParserError('llm_failed', 'llm.complete (pdf) failed', e);
    }
    return shape(response);
}

function shape(response: CompletionResponse): LlmResult {
    return {
        rawJson: response.text,
        model: response.model,
        usage: {
            inputTokens: response.usage?.inputTokens ?? 0,
            outputTokens: response.usage?.outputTokens ?? 0,
            cacheReadInputTokens: response.usage?.cacheReadTokens ?? 0,
            cacheCreationInputTokens: response.usage?.cacheCreationTokens ?? 0,
        },
    };
}

export function extractJson(raw: string): unknown | null {
    const trimmed = raw.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const candidate = fenced?.[1] ?? trimmed;
    try {
        return JSON.parse(candidate);
    } catch {
        return null;
    }
}
