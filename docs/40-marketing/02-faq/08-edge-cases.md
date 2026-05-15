# 02 — FAQ: Edge Cases & Risks

## Anchor opens a closed entry on stale link

A user shares `/faq#how-find-work` with a friend. Six months later that entry has been rewritten or removed.

**Mitigation:**

- Slug ids are stable — never rename a slug. If content needs to change, edit the question/answer in place.
- If an entry is removed, leave the slug alive with a tombstone answer ("This question was retired. See [related question →]") so external links don't break.
- The anchor effect silently no-ops if the slug doesn't match any rendered entry.

## All entries open by default fights screen estate on mobile

If we accidentally ship `initialOpen={FAQ_IDS}` on the standalone page, mobile users land on a 4000-pixel-tall wall of text.

**Mitigation:**

- Default is `initialOpen={[]}` per spec; enforced by the `<FaqAccordion>` prop default.
- Visual review covers this on every PR touching FAQ.

## FAQPage JSON-LD with HTML in answers

If a future answer contains a Markdown link (`[link text](url)`), the JSON-LD `Answer.text` field would include raw Markdown — Google's spec wants plain or escaped HTML.

**Mitigation:**

- v1: answers are plain text (verified by lint rule on `marketing.faq_extras.*` and `landing.faq.*`).
- v2 (if Markdown lands): add a `marked → sanitized HTML → text` transform in the JSON-LD generator, separate from the rendered HTML.

## Duplicate FAQPage schema across landing + /faq

The landing page section 15 also emits `FAQPage` JSON-LD. Google may flag the duplicate.

**Mitigation:**

- Only `/faq` emits `FAQPage` schema. Landing's FAQ section emits NO schema (Google only needs the canonical one, and `/faq` is the canonical FAQ surface).
- Cross-reference: landing's `<Faq>` section sets `<link rel="canonical-faq" href="/[locale]/faq">` (informational, not a real Google directive — but useful for our docs).

> **Inferred:** Two pages with identical FAQPage schemas isn't penalized, but it does dilute which surface Google cites in AI overviews. Concentrating the schema on `/faq` makes that page the citation target.

## Answer length blows past Google's recommended 1000 characters

Some answers (especially extras like `tenant-onboarding`, `wage-disputes`) trend long.

**Mitigation:**

- Lint: warn on any answer > 800 chars; error > 1500.
- If an answer truly needs more than 1000 chars, link to a `/resources/...` deep-dive instead of expanding inline.

## Anchor scrolling jumps past a sticky nav

If we ever add a sticky `<MarketingNav>`, clicking `#how-find-work` scrolls the entry under the sticky nav and the user can't see the question.

**Mitigation:**

- v1 nav is NOT sticky (per landing spec).
- If sticky nav lands, add `scroll-margin-top: 96px` to every accordion item.

## RTL languages

Out of scope (EN + ES both LTR).

## Localization drift

A new question added to landing's FAQ section in EN-only ships before ES translation.

**Mitigation:**

- CI: `check-i18n-parity` blocks merge on missing keys (covers both `landing.faq.*` and `marketing.faq_extras.*`).
- A new FAQ entry requires both EN and ES copy in the same PR.

## "Still have questions?" mailto link gets harvested

`mailto:support@agconn.com` is plain HTML; spam crawlers will harvest it.

**Mitigation:**

- This is acceptable risk — `support@agconn.com` is already published in the footer NAP.
- Spam filtering on the inbox side (the mailbox runs Resend + Cloudflare email routing).

## FAQ overflows to a category-tabbed view

If post-launch we add 20+ entries, the single-list pattern stops scaling.

**Trigger:** > 14 total entries OR multiple distinct audience-tagged questions.

**Migration path:**

- Add `<FaqCategoryTabs>` above `<FaqAccordion>` with chips: All · Workers · Employers · Training Orgs · Platform.
- Tag each entry with `category: 'workers' | 'employers' | 'training_orgs' | 'platform'` in `faq.ts`.
- Filter the accordion list by category; default `'all'`.
- Update `FAQPage` JSON-LD to include all entries regardless of filter (filter is UI-only, not content-removing).

## Open questions

1. **Tone for "Still have questions?" CTA** — current copy is professional and brand-aligned. If a more conversational variant tests better, swap.
2. **Search box** — explicitly out of scope at v1. Revisit at 30+ entries.
3. **`/faq` trackback from `mailto:` body** — adding `?subject=AGCONN%20FAQ%20Question` to the mailto helps support triage. Decision: ship with subject line; review impact at 30 days.
4. **Per-tenant FAQ overrides** — when workforce boards run their own AGCONN instance, do they get to add tenant-specific FAQs? Out of scope MVP. Track for tenant-onboarding feature folder.
