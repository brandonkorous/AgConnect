# 07 — Resume Parser: Acceptance Criteria

## Functional

- [ ] Parser accepts PDF and DOCX up to 10 MB.
- [ ] Parser produces output that validates against `ResumeSchema` for ≥ 90% of valid resumes.
- [ ] Spanish-language resumes parse correctly into ResumeSchema (English keys, original-language values).
- [ ] Image-only PDFs (scanned) trigger OCR fallback automatically.
- [ ] Resumes with too little text (< 50 chars after extraction) fail with `parse_failed:too_little_text` and the UI falls back to manual entry.
- [ ] Phone numbers in extracted text are normalized to E.164 when possible.
- [ ] Parser is idempotent: re-parsing the same blob produces identical-shaped output (LLM nondeterminism aside; structure stable).
- [ ] On schema validation failure, parser re-prompts once with a repair prompt; if it fails again, the job is marked `failed`.

## Non-functional

- [ ] Median parse latency < 12 seconds.
- [ ] P99 parse latency < 60 seconds (UI's max-wait threshold).
- [ ] Cost per parse < $0.05 (with prompt caching active).
- [ ] Prompt cache hit rate ≥ 80% after warm-up (system prompt + few-shots cached).
- [ ] No PII leaks into LLM logs: Anthropic API has data-retention disabled for our org per business agreement.

## Quality benchmarks

- [ ] Eval set: 50 farmworker resumes (mix EN/ES, mix PDF/DOCX, mix high-quality + scanned). Refresh annually.
- [ ] On the eval set: ≥ 95% schema-valid parses, ≥ 80% field-level agreement with hand-labeled ground truth.
- [ ] Confidence scoring: low-confidence flag has ≥ 70% precision (most low-confidence fields really do need editing).

## Test scenarios

### Unit

1. Text extraction: PDF text-layer, DOCX, image-only PDF (OCR fallback) — all return non-empty text for valid inputs.
2. JSON extraction from LLM response: handles JSON with surrounding prose, handles JSON in code fences.
3. Schema validation: invalid output triggers repair prompt.
4. Cost computation: matches Anthropic pricing for known token counts.

### Integration

1. **Full parse path:** upload a sample resume to test Blob, enqueue parse job, wait → `worker_profiles.resume` populated, `resume_parse_jobs` row complete.
2. **Bad file:** upload an image (.jpg) → `parse-resume` job fails with `unsupported_format`, error surfaced via `/v1/onboarding/resume/status`.
3. **Empty text:** upload a blank PDF → fails with `too_little_text` → UI shows manual fallback.
4. **Cost cap:** parse 10 resumes, sum cost from `resume_parse_jobs.cost_usd`, assert < $0.50.

### Eval

1. Run the 50-resume eval set quarterly. Track: schema-valid rate, field agreement rate, latency P50/P99, cost per parse. Regressions block release.

## Definition of done

- Eval set committed to `packages/resume-parser/eval/` with ground-truth JSON.
- Eval runner script: `pnpm --filter resume-parser eval` produces a report with aggregate metrics.
- Anthropic data retention confirmed disabled (signed via Anthropic enterprise/data-handling addendum).
- Sentry captures every parse failure with token usage and (scrubbed) input length.
- Admin runbook: how to re-parse a resume manually, how to inspect a failed parse.
