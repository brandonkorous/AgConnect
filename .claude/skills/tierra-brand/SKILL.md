---
name: tierra-brand
description: Use whenever producing AgConnect user-facing output — UI, CSS, JSX/TSX, Tailwind/daisyUI components, marketing copy, landing-page sections, email or SMS templates, certificate text, dashboard labels, charts, illustrations, photography direction, or any visible brand surface in either EN or ES. Loads the Tierra brand system from docs/brand/ and enforces its invariants (palette, typography, voice, spacing, accessibility) so output stays on brand.
---

# Tierra Brand Skill

The Tierra brand system is documented authoritatively in [docs/brand/](../../../docs/brand/). Treat that folder as the source of truth — when this skill and the docs disagree, the docs win.

## When this fires

- Designing or editing any product UI (React/JSX/TSX, CSS, Tailwind classes, daisyUI components).
- Writing marketing copy, landing-page sections, blog posts, email or SMS templates.
- Composing certificate text, report headers, dashboard labels, empty states, error messages.
- Selecting colors, typefaces, spacing, icons, photography direction, chart styles.
- Writing or reviewing brand-facing strings in either language (EN/ES).

If the work is purely backend with no user-facing surface (database migration, API handler internals, Hono route plumbing without copy), this skill does NOT need to apply.

## Required reads — load only the relevant ones

| if working on | read |
|---|---|
| color, theme tokens, daisyUI config | [docs/brand/02-color.md](../../../docs/brand/02-color.md) |
| typography, headings, type scale, labels | [docs/brand/03-typography.md](../../../docs/brand/03-typography.md) |
| layout, spacing, grid, motion | [docs/brand/04-spacing-layout.md](../../../docs/brand/04-spacing-layout.md) |
| copy, voice, tone, EN/ES, glossary | [docs/brand/05-voice-tone.md](../../../docs/brand/05-voice-tone.md) |
| components (buttons, cards, inputs, etc.) | [docs/brand/06-components.md](../../../docs/brand/06-components.md) |
| photography, illustration, icons, charts | [docs/brand/07-imagery.md](../../../docs/brand/07-imagery.md) |
| accessibility, focus, contrast, motion | [docs/brand/08-accessibility.md](../../../docs/brand/08-accessibility.md) |
| brand philosophy, what we are / aren't | [docs/brand/01-overview.md](../../../docs/brand/01-overview.md) |

Do NOT preload all eight. Pick the two or three relevant to the current edit and read those.

## Non-negotiables

The highest-violation-cost rules. If a draft conflicts with one of these, fix the draft, not the rule.

1. **Rectangular geometry.** `border-radius: 0` on buttons, cards, badges, inputs, modals. Toggles, radios, and photo avatars are the documented exceptions.
2. **Honey is one-of-one per screen.** Harvest honey (`#C8A24A`) is the single loud color. One honey element per visible viewport — primary CTA, single statistic, single active state. Two honey elements means one of them is wrong.
3. **Italic for emphasis, not bold.** Inside body Inter, emphasis goes to Fraunces or Inter italic. Bold is reserved for short labels, table headers, and the first word of scannable list items.
4. **Eyebrow labels: Inter 11px, UPPERCASE, 0.18em letter-spacing, weight 600.** Always. Don't improvise the value.
5. **Middot delimiter** (`·`, U+00B7) with thin spaces for inline metadata. Not bullets, dashes, or pipes.
6. **No exclamation marks** in brand-voice copy. **No emoji** in product UI or marketing.
7. **No shadows** on cards. Use hairline borders (ink @ 12%) and color contrast for separation.
8. **No text below 14px** on screen. Inputs never below 16px (iOS auto-zoom trigger).
9. **Bilingual at the same time.** Never emit an EN brand string without its ES counterpart (or its i18n key wired to both catalogs).
10. **Sentence case headlines** in both EN and ES. Title Case is only for proper nouns.
11. **Three typefaces only.** Fraunces (display), Inter (body/UI), DM Mono (numerals). No others.
12. **Focus indicators are mandatory.** 2px honey outline with 2px offset on light grounds; 2px ink on honey grounds. Never remove `:focus-visible`.

## Self-check before producing output

Run internally before emitting UI code, copy, or design specs. If any check fails, revise before emitting.

- [ ] I read the relevant `docs/brand/` file(s) for this edit.
- [ ] Colors taken from the named palette or daisyUI tokens — no off-palette hex.
- [ ] Honey appears 0 or 1 times in this output, never 2+.
- [ ] Typography limited to Fraunces / Inter / DM Mono.
- [ ] Every interactive element has default + hover + focus-visible + active + disabled + loading states.
- [ ] Every form input has a real `<label>` (or `aria-label` if iconographic).
- [ ] Contrast verified against the table in [02-color.md](../../../docs/brand/02-color.md).
- [ ] Copy: EN + ES drafted together, sentence case, no exclamation marks, no emoji, middot delimiters.
- [ ] Touch targets ≥44×44.
- [ ] `border-radius: 0` on all buttons / cards / badges / non-toggle inputs.
- [ ] Section rhythm matches bone / sage / dark cadence; no two dark bands consecutive.
- [ ] Tabular numerals (`font-variant-numeric: tabular-nums`) on any number column.
- [ ] Glossary terms (worker/cuadrilla, FLC/Contratista, training/capacitación) used correctly in ES.

## When to flag, not decide

Some decisions are above this skill's authority. Surface the question, propose options grounded in the brand, let the human decide.

- Adding a seventh named color or extending the palette.
- Adding a fourth typeface.
- Introducing a component pattern not covered by [06-components.md](../../../docs/brand/06-components.md).
- Spanish-language copy in a register the docs don't establish (formal *usted*, regional slang, neutral *-e*/*-x* forms).
- Photography or illustration outside the documented direction.
- Dark theme rollout (the docs flag the dark theme as `> **Inferred:**` and not yet locked).

## Output discipline

- Don't add a comment in code restating a brand rule. The doc is the rule.
- Don't proactively modify files outside the current edit's scope to "fix" brand drift you notice in passing — call it out instead, then offer to fix in a separate pass.
- Don't paste large excerpts of `docs/brand/` into chat. Reference the file and section by link.