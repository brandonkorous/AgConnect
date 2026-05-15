// Anthropic price list, USD per million tokens. Refresh quarterly; mismatch
// shows up in the monthly cost rollup as drift, not as an outage.
// Source: https://www.anthropic.com/pricing (as of 2026-05)

type Prices = {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
};

const PRICES: Record<string, Prices> = {
    'claude-sonnet-4-6-20250514': {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75,
    },
    'claude-sonnet-4-7-20251101': {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75,
    },
    'claude-haiku-4-5-20251001': {
        input: 1,
        output: 5,
        cacheRead: 0.1,
        cacheWrite: 1.25,
    },
};

export type Usage = {
    inputTokens: number;
    outputTokens: number;
    cacheReadInputTokens?: number;
    cacheCreationInputTokens?: number;
};

export function computeCostUsd(model: string, usage: Usage): number {
    const p = PRICES[model];
    if (!p) {
        // Unknown model — return 0 so the column isn't lied to. A separate log
        // line surfaces the gap so we know to backfill the table above.
        console.warn('[resume-parser] cost.unknown_model', { model });
        return 0;
    }
    return (
        (usage.inputTokens / 1e6) * p.input +
        (usage.outputTokens / 1e6) * p.output +
        ((usage.cacheReadInputTokens ?? 0) / 1e6) * p.cacheRead +
        ((usage.cacheCreationInputTokens ?? 0) / 1e6) * p.cacheWrite
    );
}
