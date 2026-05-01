# 07 — Resume Parser: Overview

## Purpose

Convert an uploaded resume file (PDF or DOCX) into structured `ResumeSchema` JSON that powers the worker profile. The parsed JSON — not the original file — is the source of truth. Workers edit the JSON directly; employers see the rendered JSON.

This decision is from kickoff §6: workers should never need to re-upload to fix a typo or add a skill.

## Inputs and outputs

- **Input:** raw PDF or DOCX file in Supabase Storage (`resumes/{tenantId}/{userId}/<timestamp>.<ext>`).
- **Output:** `ResumeSchema` JSON saved to `worker_profiles.resume`.
- **Confidence metadata:** per-field confidence (`low | medium | high`) returned alongside, used by UI to badge uncertain fields.

## Approach

1. Extract raw text from the file:
   - PDF: `pdfjs-dist` for text-layer PDFs; `tesseract.js` (OCR) fallback for image-only PDFs.
   - DOCX: `mammoth` for text extraction.
2. Send the extracted text to **Claude API** (`claude-sonnet-4-6` for cost/latency balance, fallback to `claude-haiku-4-5` for retry) with a structured-output prompt that asks for `ResumeSchema`-shaped JSON.
3. Validate the LLM output against the Zod `ResumeSchema`. Re-prompt once if invalid.
4. Compute confidence per field using the LLM's self-reported confidence + heuristics (e.g., if a date couldn't be parsed, that field is low-confidence).
5. Save to `worker_profiles.resume` and `worker_profiles.resume_raw_url`.

> **Inferred:** Claude over OpenAI because the codebase has Anthropic billing/SDKs available (per the system context skills) and Claude's structured output adherence is strong. Both work; either should be wrapped behind a `ResumeParser` interface so the choice can change without touching callers.

## Stack

- **`@anthropic-ai/sdk`** — Claude API client
- **`pdfjs-dist`** — PDF text extraction
- **`mammoth`** — DOCX text extraction
- **`tesseract.js`** — OCR fallback for image PDFs
- **`zod`** — output validation

## Scope

In scope:

- File text extraction
- LLM-based structured parsing
- Output validation + re-prompt on failure
- Confidence scoring
- Result persistence
- Prompt caching (Anthropic prompt-cache to save cost on system prompt + few-shot examples)

Out of scope:

- Multi-language detection per section (we accept Spanish or English resumes; LLM handles translation seamlessly to ResumeSchema's English-keyed fields)
- Image / photo extraction from resumes
- Cover letter parsing
- Live editing of the original file (file is audit-trail only)

## Success criteria

- ≥ 90% of valid resumes parse successfully (no schema validation failure).
- ≥ 80% of fields on parsed resumes need no manual edit (worker accepts as-is).
- Median parse latency < 12 seconds.
- P99 parse latency < 60 seconds (the UI's max-wait threshold).
- Cost per parse < $0.05 with prompt caching.

## Dependencies

- [10-worker/01-onboarding](../../10-worker/01-onboarding/) — caller
- [10-worker/02-resume-editor](../../10-worker/02-resume-editor/) — consumer of parsed JSON
- [03-database](../03-database/) — `worker_profiles.resume` JSONB column
- Supabase Storage — file storage
- Anthropic API — LLM
