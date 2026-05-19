# 09 — SMS Standardization Layer

Severity: P1, cross-cutting. Follow-up from the Phase 3/4 work (the "should we
treat SMS like email?" question). Scope-bounded on purpose.

## Decision

**No.** SMS does not get email's machinery — no React components, no
subject/html/text dual-render, no `List-Unsubscribe` headers. That is all
wrong-medium for a 160-char channel. What SMS *does* adopt is email's
**discipline**: the two invariants email enforces structurally
(unsubscribe/suppression, payload awareness) get SMS analogs, enforced by code
instead of author memory.

Two gaps were closed:

### 1. Opt-out compliance — enforced, not remembered

`packages/sms/src/templates/index.ts` now requires a `category` on every entry
(the TS shape makes it a compile error to omit):

- `transactional` — direct reply to a user action or a status update on a
  thing the user engaged. Opt-out language not required per message.
- `promotional` — unsolicited / recurring outreach (`job.alert`,
  `worker.invitation`, `job.match.invitation`, `welcome`,
  `employer.broadcast`). MUST carry the `STOP` token in **both** locales.
- `compliance` — the consent flow itself (`sms.optin.confirm`,
  `sms.optin.invalid`). MUST carry `STOP`.

`scripts/check-sms.mjs` fails CI if a `promotional`/`compliance` template lacks
`STOP` in en or es. Chosen mechanism: **categorize + lint**, not auto-append —
the copy stays in the literals (auto-appending would relocate compliance copy
catalog-wide and could shift segment boundaries). The lint surfaced three
promotional templates that were missing opt-out language —
`job.alert`, `worker.invitation`, `job.match.invitation` — and a concise
bilingual `STOP` line was added to each (the only copy change; the targeted
remediation the lint exists to force, not the rejected catalog-wide rewrite).

### 2. Segment / encoding budget — visible, not silent

`packages/sms/src/segments.ts` adds `segmentInfo(text)` →
`{ encoding: 'gsm7' | 'ucs2', units, segments }` (3GPP TS 23.038: a single
non-GSM-7 char — common in ES accents/inverted punctuation — drops the message
from 160 to 70 chars/segment).

- **Runtime:** `packages/sms/src/worker.ts` computes `segmentInfo` on the
  fully-rendered body and records `{ encoding, segments }` in the
  `system.sms.sent` audit metadata (real, post-expansion cost — observability
  the build-time check cannot give since it only sees skeletons).
- **Build-time:** `check-sms.mjs` computes the skeleton segment count for en
  and es and fails if it exceeds `DEFAULT_MAX_SEGMENTS` (3). A template that
  legitimately exceeds it (a mandated long disclosure) declares
  `maxSegments` on the entry — an explicit, reviewed exception, never silent.
  Current declared exceptions: `sms.optin.confirm` (5, ES is UCS-2),
  `sms.onboard.ask_skills` (4), `sms.optin.welcome` (3).

## Status — IMPLEMENTED 2026-05-18 (typecheck + check:conventions clean)

- `segments.ts` + `segmentInfo` exported from `@agconn/sms`.
- `TemplateDef` gains required `category` + optional `maxSegments`; all 29
  templates categorized; opt-out added to the three promotional gaps (EN+ES).
- `worker.ts` logs encoding/segments in the sent audit.
- `scripts/check-sms.mjs` added to the `check:conventions` chain (and a
  standalone `pnpm check:sms`). `check-sms: ok (29 templates)`.

Deferred: none. Tests deferred per owner — when added: assert a promotional
template without `STOP` fails the lint; assert a UCS-2 ES body reports the
right segment count; assert `maxSegments` overrides the default.

## Done when

Adding a new SMS template forces a category choice at compile time, opt-out on
promotional/compliance copy is CI-enforced bilingually, and any template that
structurally blows the segment budget either gets shortened or declares the
exception in code. (Met as of 2026-05-18; runtime verification pending tests.)
