# Resume parser eval harness

Measures whether the parser meets its acceptance bar:

- **schema-valid rate** ≥ 90% (parser returned a `ResumeSchema`-conforming object)
- **field-agreement rate** ≥ 80% (key fields match the golden output)
- **median latency** < 12s
- **P99 latency** < 60s
- **cost per parse** < $0.05
- **cache hit rate** ≥ 80% (after warmup, on system prompt input tokens)

## Layout

```
eval/
  fixtures/       — raw resume text (.txt) or PDFs (.pdf)
  golden/         — expected ResumeSchema JSON for each fixture; filename matches
  run.ts          — runner script
  README.md
```

Each fixture pairs by basename: `fixtures/01-juan-perez.txt` ↔ `golden/01-juan-perez.json`. Plain-text fixtures hit the same code path as `extractPlaintext()` so the LLM exercise is identical. PDF fixtures additionally exercise the text-layer / OCR-fallback split.

## Adding fixtures

1. Drop the source file into `fixtures/`.
2. Run `pnpm eval --update <basename>` to capture the parser's current output as the golden file. Review it carefully — anything in the golden is what we'll measure against.
3. Commit fixture + golden together.

Bias toward agricultural resumes, EN + ES, varied formality (formal CVs, scribbled phone-photos of paper resumes), and edge cases the spec calls out (image-only PDFs, all-caps names, partial dates, multi-page).

Target: 50 fixtures (spec §07-acceptance.md). Launch set ships small (5–10) and grows from real worker traffic the operations team flags as misparses.

## Running

```sh
# all fixtures, default model (Haiku)
pnpm --filter @agconn/resume-parser eval

# single fixture
pnpm --filter @agconn/resume-parser eval -- --only 01-juan-perez

# capture current output as golden
pnpm --filter @agconn/resume-parser eval -- --update 01-juan-perez

# override model
LLM_RESUME_PARSER_MODEL=claude-sonnet-4-7-20251101 pnpm --filter @agconn/resume-parser eval
```

Exit code is 0 when all thresholds pass, 1 when any threshold fails — CI uses that as the merge gate.

## Field-agreement metric

For each fixture × field path, we score:

- **exact match** (string ===) → 1.0
- **normalized match** (trim, lowercase, strip diacritics for names; E.164 for phones) → 0.8
- **mismatch** → 0.0

The score is the average across all comparable fields in the golden. Array fields (`experience`, `education`, `skills`, `certifications`, `languages`) compare by length + member set inclusion to avoid penalizing reorderings.

## Cost guard

The runner sums all `costUsd` returned by the parser and asserts the mean is under $0.05. If a single fixture costs > $0.20 it's logged as a hot spot — usually a multi-page PDF that wants paring down before publication.
