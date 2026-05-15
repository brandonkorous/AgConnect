# 01 — Landing Page: Edge Cases & Risks

## Brand-name change pre-launch

The user notes the `.com` domain may not be available, forcing a rebrand from "AGCONN".

**Mitigation:**

- Wherever the literal name "AGCONN" appears in copy, route through an i18n key (e.g., `brand.product_name`) so a single string change updates every surface.
- Keep the **Tierra theme** independent of the product name. The brand folder is named for the theme, not the product.
- Logo, wordmark, and OG image generation are parameterized on `brand.product_name`.
- Footer NAP "AGCONN, PBC" is also a key (`landing.footer.nap.org`); legal entity name swap is a config change, not a re-render.

> **Inferred:** Adding a `brand.product_name` key now (even though it's "AGCONN" today) future-proofs the rename. Cost: trivial. Skipping it now: every component file gets edited later.

## Hero typography on small phones

Fraunces 108px hero headline is gorgeous on desktop but breaks on a 360px viewport.

**Mitigation:**

- Responsive scale: `display-xl` 88px desktop / 64px tablet / 48px mobile (per [brand/03-typography.md](../../brand/03-typography.md)).
- The bilingual stacked-mirror pattern (`From the field, / to your future.`) compresses gracefully because both lines share the type ramp.
- Test on actual devices, not just emulator widths — emulators don't reproduce the font hinting the user sees.

## Real data is unflattering at v2/v3

Featured Jobs is empty. Featured Training has just 1 program. Impact Numbers show 12 placements.

**Behavior:**

- Empty Featured Jobs / Training: hide the section entirely; section above and below close ranks.
- Impact tile suppression at < 25 individuals: render `Coming soon` copy in the tile shape.
- All four impact tiles suppressed simultaneously: hide the section's stat row, keep the section header + dashboard link.

**Anti-pattern:** never show fake numbers when real data is sparse. The brand's credibility depends on the numbers being real.

## Marketing hero doesn't index well

Hero text is image-of-text or buried in a `<canvas>`.

**Mitigation:** hero text MUST be HTML text (`<h1>`, `<h2>`, `<p>`). The phone mockup is HTML/CSS, not an image. Verified by lint rule + Lighthouse SEO audit.

## ES route gets less Google traffic than expected

Spanish-language content is harder to rank for in some Google markets.

**Mitigation:**

- `hreflang` correctly set with `x-default` pointing to `/es`.
- Both `/en` and `/es` URLs in sitemap.
- ES locale gets its own canonical (no canonicalization to one locale).
- Search Console targeting set to USA.
- Spanish-language structured data (`inLanguage: 'es'` in JSON-LD).
- Monitor Coverage report; if ES is mis-classified, file in Search Console.

## OG image cache invalidation

Marketing edits the hero copy in i18n. The Twitter / LinkedIn share OG image still shows the old copy because social scrapers cache aggressively.

**Mitigation:**

- OG image URL includes `?v=<commit-sha>` for cache busting on copy changes.
- After a major copy update, fetch the OG image manually via `https://cards-dev.twitter.com/validator` and `https://www.linkedin.com/post-inspector/` to force re-scrape.

## Form abandonment — phone or email leakage

A worker types their phone into the Final CTA, gets distracted, never submits. Did we capture that?

**Decision:** **No.** The Final CTA worker form does NOT auto-save or beacon partial input. The user's phone is captured only after explicit submit + Clerk OTP send.

> **Inferred:** Some marketing teams will ask for "abandoned form recovery" beacons. Push back: the platform's farmworker-trust positioning (per [brand/05-voice-tone.md](../../brand/05-voice-tone.md)) makes silent capture a no-go.

## RTL languages

Out of scope. The brand and codebase target EN + ES (both LTR). Adding Arabic / Hebrew would require Tailwind RTL plugin and layout review.

## Service-role data leak

`service` role accessing `/v1/landing/*` could be tricked into returning private data via crafted parameters.

**Mitigation:**

- Service role's RLS policies grant SELECT only on `(status = 'active' AND deleted_at IS NULL AND tenant_id = $public_tenant)` — no bypass.
- Aggregations exposed only via `SECURITY DEFINER` functions with hard-coded return shape, not direct table SELECT.
- Integration test: query `/v1/landing/featured-jobs` with header injection / prototype-pollution attempts → confirm no leak.
- Pen test in Phase 5 specifically targets this surface.

## Anonymous waitlist email harvested for spam

A bot floods the waitlist endpoint with fake emails to harvest reflections (the confirmation email back).

**Mitigation:**

- IP rate limit (10/hr, 30/day).
- Cloudflare Turnstile or similar invisible challenge on the form (Phase 2).
- Waitlist confirmation emails do NOT include any reflection of input fields beyond the email address itself; no XSS surface.

## Browser without IndexedDB / cookies

Some workers use locked-down work computers. Locale toggle relies on cookies (next-intl).

**Mitigation:**

- Locale toggle works via URL prefix as the source of truth; cookie is a convenience for default selection.
- If cookies are blocked, the toggle still works — it just doesn't persist across sessions.

## Logo not finalized

Per `brand/README.md`, the logo lands as `09-logo.md` later. Until then the landing uses a placeholder wordmark.

**Mitigation:**

- Use the Fraunces semibold "AGCONN" wordmark + a simple SVG mark (sun-mark or land-mark) until logo finalizes.
- All logo references go through a single component (`<Wordmark />`) so the swap is one PR.
- OG image generator imports the same component.

## Domain change mid-build

Forcing a rebrand changes the canonical domain (e.g., `agconn.com` → `tierra.app` → `valleworks.com`).

**Mitigation:**

- All canonical URLs use a single env var `WEB_PUBLIC_URL`.
- Sitemap, robots.txt, llms.txt, OG images, JSON-LD all reference the env var.
- Email templates reference the env var.
- Domain swap = env var change + DNS + cert-manager update + Search Console new property registration. No code changes.

## Featured Jobs ordering challenges trust

If "top 4 by publishedAt" puts a generic job above a high-wage one, employers complain ("why is the $14/hr job on the homepage above my $22/hr posting?").

**Mitigation:**

- Sort: `wageMax DESC, publishedAt DESC` — wage wins ties.
- Explicit "Sort: Wage, high → low" label on the section, so users see the rule.
- Pro+ "priority listing" feature reorders within ties (Phase 3+).

## Pricing card "Most popular" risk

The honey ribbon on the Pro card is the page's loudest single accent. If Pro doesn't actually win the most signups, the label is misleading.

**Decision:** ship it on Day 1 (the design intends it). Audit at 90 days; if Free outweighs Pro 10:1 in actual sign-ups, remove the ribbon.

## Static testimonials risk credibility

A page with three placeholder quotes labeled "PLACEHOLDER" in v1 is honest but visually weaker.

**Mitigation:**

- Style the placeholder badge as a small Inter caption (not a banner) so it reads as transparency rather than as a defect.
- Replace at v3 with at least one verified partner quote per role; keep placeholder badging on the rest.

## Open questions

1. Standalone `/[locale]/impact` page — when does the public dashboard ship? Implied by the Impact Numbers section CTA.
2. `/coming-soon` page — needed only if Phase A ships before auth (Phase 0 close). If they ship same week, skip and route directly to Clerk.
3. Live chat / Intercom widget — explicitly NOT in scope (clutters the brand). Push back if requested.
4. Cookie consent banner — needed only if we add analytics with cross-site tracking. With first-party Plausible (no cookies needed), defer.
5. A/B testing framework — out of scope MVP. Add at Phase 6+ if conversion needs tuning.
6. Public-facing API for partner sites embedding our jobs — out of scope; consider after partner conversations.
