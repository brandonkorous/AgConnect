# 07 — Resume Parser: Internal API & Worker

The parser is invoked by the onboarding flow via `pg-boss` job `parse-resume`. There is no HTTP API exposed externally — clients only see the onboarding endpoints in [10-worker/01-onboarding/03-api.md](../../10-worker/01-onboarding/03-api.md).

## Internal interface

```ts
// packages/resume-parser/src/index.ts
export interface ParseResumeArgs {
  tenantId: string;
  userId: string;
  blobPath: string;     // Azure Blob path; must be in resumes/{tenantId}/{userId}/...
}

export interface ParseResumeResult {
  resume: Resume;
  confidence: Confidence;
  warnings: string[];
  rawTextLength: number;
  modelUsed: string;
  parseDurationMs: number;
}

export async function parseResume(args: ParseResumeArgs): Promise<ParseResumeResult>;
```

Callers always invoke via `pg-boss`:

```ts
await pgBoss.send('parse-resume', { tenantId, userId, blobPath }, { retryLimit: 2, retryBackoff: true });
```

## Worker

```ts
// apps/api/src/workers/parse-resume.ts
pgBoss.work<ParseResumeArgs>('parse-resume', { teamSize: 3 }, async (job) => {
  const { tenantId, userId, blobPath } = job.data;

  const parseJob = await db.resumeParseJob.create({
    data: { tenantId, userId, blobPath, status: 'running' },
  });
  const startedAt = Date.now();

  try {
    const buffer = await azureBlob.download(blobPath);
    const text = await extractText(buffer, blobPath);
    if (text.length < 50) throw new Error('parse_failed:too_little_text');

    const result = await callClaudeWithRetry(text);
    const validated = ResumeSchema.parse(result.resume);
    const normalized = normalize(validated);     // E.164 phones, capitalized names

    await db.workerProfile.update({
      where: { id: userId },
      data: { resume: normalized, resumeRawUrl: blobPath },
    });

    await db.resumeParseJob.update({
      where: { id: parseJob.id },
      data: {
        status: 'succeeded',
        modelUsed: result.modelUsed,
        inputTokens: result.usage.input_tokens,
        outputTokens: result.usage.output_tokens,
        cacheReadTokens: result.usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: result.usage.cache_creation_input_tokens ?? 0,
        costUsd: computeCost(result.usage, result.modelUsed),
        parseDurationMs: Date.now() - startedAt,
        completedAt: new Date(),
      },
    });
  } catch (err: any) {
    await db.resumeParseJob.update({
      where: { id: parseJob.id },
      data: { status: 'failed', errorMsg: String(err), completedAt: new Date() },
    });
    throw err;
  }
});
```

## Text extraction

```ts
// packages/resume-parser/src/extract.ts
export async function extractText(buffer: Buffer, path: string): Promise<string> {
  if (path.endsWith('.docx')) return extractDocx(buffer);
  if (path.endsWith('.pdf'))  return extractPdf(buffer);     // tries text-layer; falls back to OCR
  throw new Error('unsupported_format');
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const text = await extractPdfTextLayer(buffer);
  if (text.trim().length > 50) return text;
  return await ocrPdf(buffer);    // tesseract fallback
}
```

## Claude API call (with prompt caching)

```ts
// packages/resume-parser/src/llm.ts
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic();

export async function callClaude(text: string) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: [
      { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: FEW_SHOT_EXAMPLES, cache_control: { type: 'ephemeral' } },
    ],
    messages: [
      { role: 'user', content: `Resume text:\n\n${text}\n\nReturn JSON only, matching the schema in the system prompt.` },
    ],
  });

  const json = extractJson(response.content);
  return {
    resume: json,
    modelUsed: 'claude-sonnet-4-6',
    usage: response.usage,
  };
}

export async function callClaudeWithRetry(text: string) {
  try {
    const r = await callClaude(text);
    ResumeSchema.parse(r.resume);   // throws on invalid
    return r;
  } catch (err) {
    // Retry once with explicit re-prompt + Haiku for cost
    return await callClaudeRepair(text, err);
  }
}
```

## System prompt (sketch)

The system prompt is the cached portion. Lives in `packages/resume-parser/src/prompts/system.ts`:

```text
You are a resume parser. Given a raw resume in English or Spanish, extract the structured JSON described below.

Output rules:
- Return ONLY valid JSON. No prose, no code fences.
- Match this exact schema:
  {
    "contact": { "first_name": str, "last_name": str, "phone": str?, "email": str?, "city": str?, "zip": str? },
    "summary": str?,
    "experience": [{ "employer": str, "title": str, "start_date": "YYYY-MM" or "YYYY", "end_date": "YYYY-MM" or "YYYY" or null, "current": bool, "bullets": [str], "location": str? }],
    "education": [{ "institution": str, "degree": str?, "field": str?, "year": int? }],
    "skills": [str],
    "certifications": [{ "name": str, "issuer": str?, "issued_at": "YYYY-MM-DD"?, "expires_at": "YYYY-MM-DD"? }],
    "languages": [str]
  }
- Translate Spanish content to keep keys consistent. Preserve original wording in the values.
- For dates that are partially specified ("Junio 2023"), prefer "2023-06". For unspecified end dates of current jobs, set "current": true and omit "end_date".
- Empty arrays for absent sections, not null.
- For agricultural/farm resumes, prefer skills from this canonical set when applicable: harvesting, pruning, irrigation, tractor_operation, forklift, crew_lead, bilingual_communication, packing, equipment_repair, pesticide_application. Map paraphrases to these tags. Keep additional skills verbatim.
```

## Few-shot examples

A handful of agricultural resumes (English + Spanish) with their expected JSON outputs, included in the cached system prompt. Refresh quarterly based on parser failure analysis.

## Cost computation

```ts
// packages/resume-parser/src/cost.ts
const PRICES_PER_M_TOKENS: Record<string, { input: number; output: number; cache_read: number; cache_write: number }> = {
  'claude-sonnet-4-6': { input: 3, output: 15, cache_read: 0.30, cache_write: 3.75 },
  'claude-haiku-4-5':  { input: 1, output: 5,  cache_read: 0.10, cache_write: 1.25 },
};

export function computeCost(usage: Usage, model: string) {
  const p = PRICES_PER_M_TOKENS[model];
  return (
    (usage.input_tokens / 1e6) * p.input +
    (usage.output_tokens / 1e6) * p.output +
    ((usage.cache_read_input_tokens ?? 0) / 1e6) * p.cache_read +
    ((usage.cache_creation_input_tokens ?? 0) / 1e6) * p.cache_write
  );
}
```

## Confidence scoring

```ts
// packages/resume-parser/src/confidence.ts
export function scoreConfidence(resume: Resume, rawText: string): Confidence {
  // Heuristics:
  // - field present in raw text (case-insensitive substring) → high
  // - field inferred but reasonable (e.g., zip looks valid) → medium
  // - field generated without source-text support → low
  // ...
}
```

The system prompt also asks the LLM to flag low-confidence inferences explicitly; we combine LLM self-report + heuristics.
