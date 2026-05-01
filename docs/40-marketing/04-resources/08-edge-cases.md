# 04 — Resources: Edge Cases & Risks

## Empty-state fights brand credibility

`/[locale]/resources` shipping as empty-state on launch day looks weak compared to a fully populated competitor surface.

**Mitigation:**

- Empty-state copy is honest and forward-looking ("articles rolling out shortly") — not "no content yet" defeatism.
- Subscribe form converts visitors into Phase 1 readers — turns the negative into capture.
- Fast follow-up: target 1 article live within two weeks of launch (v1.5), not full v2.

> **Inferred:** A small "coming soon" landing is better than hiding the route entirely. Hidden routes 404; empty-states convert.

## v2 article slug collisions across locales

`flc-verification-explained` (EN) and `verificacion-flc-explicada` (ES) share a logical concept. If an editor accidentally uses the same slug for both, hreflang breaks.

**Mitigation:**

- Frontmatter `slug` field is the *concept slug* (logical identifier shared across locales).
- Frontmatter `slugLocale` is the actual URL slug for this locale's article.
- Build-time lint: assert `slug` matches across paired articles, `slugLocale` is unique per locale.

## v2 article published in EN before ES is ready

An editor wants to publish an EN article immediately; ES translation is a week out.

**Decision:** **Block publish.** Bilingual parity is a brand invariant (per [feedback memory](../../../CLAUDE.md)).

**Mitigation:**

- CI lint blocks merge when an EN MDX file lands without a paired ES file (matched by `slug` frontmatter).
- Editorial workflow: write EN, send to ES translator, ship together.

> **Inferred:** A future workflow could allow time-staggered publish (EN ships, ES queued for next sprint) but that erodes the "bilingual from byte zero" promise. Not worth the convenience.

## v2 MDX runtime exceeds JS budget

`next-mdx-remote` and supporting libraries (rehype, remark, shiki) can balloon client JS.

**Mitigation:**

- All MDX rendering happens server-side; client gets static HTML + optional ToC scroll-spy.
- Shiki runs at build time, not client.
- Per-article client JS budget: < 20 KB gzipped — enforced in CI.

## Hero images blow LCP budget

Article hero images at 1280×720 are heavy.

**Mitigation:**

- `next/image` with `priority` and AVIF/WebP fallbacks.
- Source images max 200 KB after optimization.
- Lighthouse CI gates LCP < 2.0s.

## Comments and engagement requests

Readers (especially employers) ask for comment threads or article reactions.

**Decision:** **Out of scope** for v2. Email feedback to editorial@agconn.com.

**Rationale:** Comment moderation is a labor cost the platform shouldn't take on for a small editorial output. Revisit if article cadence reaches weekly.

## Translation quality drift

An ES article translated too literally from EN reads as machine-translated.

**Mitigation:**

- Native Mexican-Spanish reviewer signs off on every article (mandatory CI gate before publish).
- Bilingual editor (post-launch hire) writes natively in both languages where possible.
- Tone aligned to [brand/05-voice-tone.md](../../brand/05-voice-tone.md).

## Article retraction

A factual error ships in an article. Sources change. Need to retract or correct.

**Mitigation:**

- Edit the MDX file in place, bump `updatedAt` frontmatter, ship.
- For major corrections: add a `<Correction>` MDX component at top of the article noting what changed and when.
- For full retraction: leave the slug live with a "This article has been retracted" notice + link to the corrected piece. Don't 404.

## SEO cannibalization between landing FAQ and resources article on same topic

Landing FAQ "What does FLC verification actually check?" and a resources article "What FLC verification actually checks" both target the same query.

**Mitigation:**

- FAQ is short-form (under 200 words); article is long-form (1500+ words).
- Cross-link: FAQ answer ends with "→ Read the full guide" linking to the article.
- Article title differs slightly to avoid exact duplication.
- Schema-org separation: FAQ uses `FAQPage`, article uses `Article` — Google handles the distinction.

## Footer "Resources" link visibility on launch

If the empty-state page reads as broken, the link in the footer makes the platform look unfinished.

**Mitigation:**

- Visual review on launch-eve: if the empty-state lands well, ship the link visible.
- If it lands poorly, hide the link until v2 lands content; reroute "Resources" footer text to remove the click affordance.

## RSS feed for v2

Some readers (and some AI agents) prefer RSS for content discovery.

**Decision:** Ship `/[locale]/resources/feed.xml` in v2 as RSS 2.0 + Atom-style.

**Mitigation:**

- Auto-generated from the article manifest.
- Listed in `<head>` of every article and the index page.

## Open questions

1. **Editorial cadence target** — weekly is too aggressive for a 1-person editorial post; quarterly is too sparse. Initial target: monthly, scaling with traffic.
2. **Author bylines** — single voice ("AgConn editorial") for v2; multi-author with author pages if a contributor program launches.
3. **Sponsorship / underwriting tags** — articles supported by grant funders (e.g., "Underwritten by CDFA") — out of scope MVP, revisit when grant relationships shift to multi-year support.
4. **Translation provenance** — should articles disclose which language was the source (EN-original vs ES-original)? Aligns with editorial transparency. Decide before v2 launch.
5. **Print stylesheet** — articles may benefit from a print-friendly CSS for offline distribution at workforce-board events. Out of scope MVP; revisit if requested.
