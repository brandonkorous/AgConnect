# 07 — Resume Parser: Edge Cases & Risks

## LLM hallucination

The LLM may invent experience, skills, or dates not in the source.

**Mitigations:**

- Confidence scoring flags low-confidence fields for the worker to verify.
- The original blob URL is preserved (`resume_raw_url`) for admin audit.
- The worker reviews every field before save; nothing auto-applies to their public profile without their explicit Continue press.
- Eval set includes "trick" resumes with sparse data; we measure the parser's tendency to fabricate.

> **Inferred:** Anti-hallucination prompt instructions ("if information is not present, omit the field; do not infer") help but don't eliminate. The UI-level review is the durable safeguard.

## Schema drift

We change `ResumeSchema` (e.g., add a `salary_history` field). Existing parsed resumes don't have the new field.

**Mitigation:**

- All fields except `contact.first_name` / `contact.last_name` are optional or have defaults.
- A migration job can re-parse old resumes when major schema changes are needed (out of scope for MVP).
- Schema changes require updating the system prompt at the same time.

## OCR quality

Tesseract OCR on low-quality scans produces garbage text that the LLM either fails on or hallucinates from.

**Mitigations:**

- If post-OCR text length is < 50 chars, fail with `too_little_text`.
- If post-OCR text contains > 50% non-alphanumeric characters, treat as junk and fail.
- For better-quality OCR, consider Azure Document Intelligence post-MVP (more expensive, much better).

## Anthropic API outage

Claude API is down or rate-limited.

**Behavior:**

- pg-boss retries 2× with backoff (more conservative than other queues; LLM calls are expensive).
- On exhaust, the parse job is marked `failed`; the user's UI falls back to manual entry.
- Anthropic 429 (rate limit) → exponential backoff up to 30 minutes; logged separately.

> **Inferred:** No multi-provider failover for parsing in MVP. If parsing becomes critical-path (it shouldn't — manual entry is always available), add OpenAI as a backup.

## Cost runaway

A bug causes the parser to be invoked in a loop, or a malicious user uploads many large resumes.

**Mitigations:**

- pg-boss `singletonKey: parse-resume-{userId}` prevents per-user duplicates.
- Rate limit on `POST /v1/onboarding/resume`: max 5 uploads per user per hour.
- Daily budget alarm: if total `cost_usd` from `resume_parse_jobs` in a day exceeds $50, page on-call.

## PII leakage in LLM provider

Resumes contain phone, email, full address, work history.

**Mitigations:**

- Anthropic enterprise data-retention is OFF for our account (per Anthropic data-handling addendum).
- We do not log raw resume text in our own systems; only token counts.
- Sentry breadcrumbs do not include resume text.

## Worker uploads a resume that's not theirs

E.g., a coach helping a worker uses their own template; or a worker shares a friend's resume.

**Behavior:** parser doesn't validate identity — that's not its job. The downstream profile review is the worker's chance to correct. We do not treat the resume as authoritative for identity (Clerk's phone OTP is).

## Multi-page resumes

Long resumes can exceed the LLM's input token budget.

**Mitigation:**

- Truncate text input to ~50,000 characters (well within Claude's context window) with a warning logged.
- For exceptionally long resumes, the parser emphasizes the first page (usually contact + summary + recent work) and degrades gracefully on older history.

## Tables and columns in resumes

Many resume templates use multi-column layouts that text extractors flatten badly.

**Mitigations:**

- pdfjs's text extraction respects positional ordering reasonably well in most cases.
- The LLM is robust to mild text-order issues thanks to surrounding context.
- Eval set includes multi-column templates to catch regressions.

## Privacy: re-uploads after PII change

If a worker re-uploads after correcting their phone, the old object remains in Supabase Storage (audit trail). The old `worker_profiles.resume` is overwritten.

**Risk:** if compelled by legal request, the audit trail must be readable.

**Mitigation:** old objects retained for 13 months; admin can hard-delete on data deletion request after that.

## Bilingual resumes

Spanish resumes are common in this user population.

**Behavior:** the LLM translates structure (keys) to English while preserving Spanish content in values (e.g., `experience[0].title = "Cosechador de fresas"`). The UI displays the values verbatim. This works because the keys are stable IDs, not displayed.

> **Inferred:** Don't re-translate values to English. Workers will recognize their own job titles in their language. The UI handles bilingual rendering at display time, not at parse time.

## Eval drift

The eval set ages: real resumes evolve (new templates, new skills tags), and what we call "ground truth" gets stale.

**Mitigation:**

- Refresh eval set annually with 5-10 new resumes per year.
- Track field-level agreement; if a field's agreement rate drops 10pp YoY, investigate.

## Open questions

1. Should we support image upload (photo of a paper resume taken with a phone)? Likely yes for this user base, requires better OCR. Phase 2.
2. Resume versioning — should `worker_profiles.resume` keep history? Out of scope for MVP. Phase 2 if employers want to see "first impression".
3. Re-parse on demand from the editor — should workers be able to upload a new file later that overwrites the structured data? Yes (Resume Editor §02). Confirm UX.
