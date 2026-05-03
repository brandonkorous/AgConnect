# 03 — Tierra: Typography

Tierra's audience is farmworkers, farm operators, FLCs, training organizations, and grant officers. Typography here is utilitarian first and warm second. The palette is restrained so that type can do clear, calm, civic work — not so it can carry an editorial performance. The Tierra type voice should sit closer to a public-service tool with craft (CDFA, EDD, LA County) than to a B2B brand magazine.

## Typefaces

Two families. The system collapses to one as much as possible — Inter does both display and body. JetBrains Mono is reserved for content that is *literally* code-shaped.

| family | role | source |
|---|---|---|
| **Inter** | display headlines, body, labels, forms, tables, money, dates, hours, stats — everything | Google Fonts (variable; opsz, wght axes) |
| **JetBrains Mono** | code identifiers only — certificate hashes, job IDs (`#APP-2031`), program codes (`WIOA-1B`) | Google Fonts |

### Inter — the workhorse

Inter is **the** Tierra typeface. It does display, body, UI, forms, tables, and figures. Use the variable file. Set `opsz` to match the rendered size — Inter's optical-size axis carries the whole brand register.

```css
.inter {
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-feature-settings: 'cv11' on, /* single-story a */ 'ss01' on;
  font-variant-numeric: tabular-nums slashed-zero; /* always for UI and figures */
}
```

Use Inter for: headlines (weights 600–700, tightened tracking at display sizes), paragraphs, form labels, button text, table cells, nav, menu, alerts, and **all numeric content** — money (`$19.50/hr`), dates (`Apr 29`), hours (`8h`), display-size statistics, dashboard counters. Inter's tabular-nums + slashed-zero are excellent at every size; no separate tabular face is needed.

**At display sizes** (≥32px): use weight 600 or 700, set letter-spacing to `-0.02em` to `-0.025em` for the calm density Tierra wants. Inter opens up at large sizes; the negative tracking pulls it back.

**Italic** is permitted at any size for short emphasis runs (1–4 words inside a heading or body) — the canonical pattern is the single-word italic accent inside an otherwise upright heading: `Buenas tardes, *Miguel*.` What's still out of brand: italic spanning a whole headline, italic on multi-line marketing displays, bold-italic word-art splits (italic line one over bold line two), and stack ES italic over EN bold (or vice versa).

If a marketing headline reaches for italic across the whole line to feel warm, rewrite the headline instead.

### JetBrains Mono — code identifiers only

JetBrains Mono is reserved for content that **is literally code-shaped** and benefits from monospace alignment as a typographic signal: program codes (`WIOA-1B`, `WPS-2`), certificate hashes (`0xA1F2…`), job IDs (`#APP-2031`), CLI output, request payloads.

```css
.jetbrains-mono {
  font-family: 'JetBrains Mono', 'Menlo', ui-monospace, monospace;
  font-variant-numeric: tabular-nums slashed-zero;
  font-feature-settings: 'calt' off; /* no programming ligatures in user-facing chrome */
}
```

**Money, dates, hours, and stats use Inter, not JetBrains Mono.** The slab-mono terminal feel reads as code output, not as money or human-readable data. Inter's tabular-nums handle column alignment perfectly without the code-y connotation.

JetBrains Mono is also acceptable as the eyebrow typeface when the eyebrow label *is* a code (`#APP-2031`, `WIOA-1B`); see the eyebrow variants below.

## Type scale

The scale is small. Tierra prefers fewer, more deliberate sizes over a long ramp. All sizes use Inter except the explicit code-identifier tokens.

| token | family | size | line-height | weight | tracking | use |
|---|---|---|---|---|---|---|
| `display-xl` | Inter | 72px / 4.5rem | 1.05 | 700 | -0.025em | hero on marketing only |
| `display-l`  | Inter | 56px / 3.5rem | 1.10 | 700 | -0.025em | section openers in marketing |
| `display-m`  | Inter | 40px / 2.5rem | 1.15 | 600 | -0.02em  | secondary marketing headlines |
| `headline`   | Inter | 32px / 2rem   | 1.20 | 600 | -0.02em  | product page H1 |
| `title`      | Inter | 24px / 1.5rem | 1.20 | 600 | -0.015em | card titles, dialog titles |
| `stat`       | Inter | 48px / 3rem   | 1.00 | 700 | -0.03em  | display-size statistics (impact tiles, dashboard hero counters) — set with `tabular-nums slashed-zero` |
| `subtitle`   | Inter | 18px / 1.125rem | 1.45 | 500 | 0       | grouping above a list, intro paragraph |
| `body`       | Inter | 16px / 1rem   | 1.55 | 400 | 0       | default body |
| `body-s`     | Inter | 14px / 0.875rem | 1.50 | 400 | 0       | dense rows, secondary body |
| `caption`    | Inter | 13px / 0.8125rem | 1.45 | 400 | 0       | metadata, helper text |
| `label`      | Inter | 11px / 0.6875rem | 1.30 | 600 | 0.18em  | UPPERCASE — see eyebrow variants below |
| `code`       | JetBrains Mono | 14px / 0.875rem | 1.50 | 400 | 0      | code identifiers (`#APP-2031`, `WIOA-1B`) |
| `code-s`     | JetBrains Mono | 12px / 0.75rem | 1.40 | 400 | 0      | dense identifier tables (cert hashes) |

> **Inferred:** Pixel sizes are the canonical brand scale; the `rem` equivalents assume `font-size: 16px` on `:root`. Production `rem` values may differ if a project sets a different root size. The scale was tuned on the Tierra landing page artboard; adjust the smallest sizes (`label`, `caption`, `code-s`) cautiously — they are at the bottom of the readability cliff.

## Eyebrow / label variants

A signature Tierra gesture. Eyebrows appear above section titles, on cards, and in metadata strips. Three variants exist in the system, each with a specific role.

### `.label` — marketing eyebrow (default)

The brand-defining eyebrow. Used on marketing surfaces above section titles.

```css
.label {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: color-mix(in oklab, var(--color-base-content) 65%, transparent);
  line-height: 1.3;
}
```

- Always uppercase, always 0.18em letter-spacing. Do not improvise either.
- Default color is `base-content` at ~65% opacity on base surfaces. On `neutral` (dark) surfaces, use `neutral-content` at ~64% opacity. **Never `accent` for a label** unless the label is itself the eye-catching accent (rare — UpNextShift "TOMORROW · 6:00 AM" is the canonical example, and it's gold against a dark surface, not against a base surface).
- No trailing punctuation — labels do not take periods or colons.

Examples: `FOR FARMWORKERS`, `ABOUT TIERRA`, `WORKER ROLE`, `STEP 02`, `EN ESPAÑOL`.

### `.section-num` — page-header eyebrow

Used in product chrome above page H1s. Carries metadata (date + location, breadcrumb residue) rather than a category name.

```css
.section-num {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--color-base-content);   /* full strength, not muted — this is metadata */
  opacity: 0.55;                       /* a11y: prefer color-mix, not opacity, in production */
}
```

Examples: `SUNDAY, AUGUST 3 · MADERA, CA` above the worker dashboard greeting; `JOBS · PISCA DE UVA · DETALLES` as a breadcrumb-style header.

### `.label-metric` — stat tile eyebrow

Used inside KPI / stat tiles where the label sits directly above a display-size figure. Tighter tracking because it pairs visually with the number, not with body copy.

```css
.label-metric {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.10em;
  color: color-mix(in oklab, var(--color-base-content) 60%, transparent);
}
```

Examples: `THIS WEEK EARNED`, `HOURS LOGGED`, `ACTIVE APPLICATIONS`, `AVG PAY RATE` above dashboard KPI tiles.

### When the eyebrow is itself a code

If the eyebrow content is a code identifier (`#APP-2031`, `WIOA-1B`), use JetBrains Mono at the same 11px / 0.18em / weight 600 spec. The monospace cue tells the reader "this is a literal code, not a category."

## Italic and bold

Use italic for short emphasis runs: a quoted phrase, a place name in running prose, a single emphasized word inside an otherwise upright headline (`Buenas tardes, *Miguel*.`). Italic at any size is permitted as long as it stays short — 1 to 4 words. What's still out of brand: italic spanning the *whole* headline, italic on multi-line displays, bold-italic word-art splits, and stack ES italic over EN bold (or vice versa). Languages are differentiated by the locale toggle, not by italicizing one of them.

Use bold confidently: form labels, button text, headlines, the first word of a scannable list item, table headers, statistic numbers in civic data bands. Bold is a utilitarian tool, not a brand smell.

If you find yourself reaching for italic to make an *entire* marketing headline feel warm, rewrite the headline. If you find yourself reaching for bold-italic display word-art to make a hero "feel like Tierra," redesign the hero.

## Numbers and money

All numeric figures use Inter with `font-variant-numeric: tabular-nums slashed-zero`. Money, dates, hours, stats — every numeric content type uses Inter. JetBrains Mono is reserved for code identifiers (`#APP-2031`, `WIOA-1B`, certificate hashes), not money or dates.

Acceptable formats:

- Money: `$19.50/hr` (no space, slash, lowercase unit)
- Hours: `8h` or `8 hrs` — pick one per surface and stay consistent
- Dates in product UI: `Apr 29` (English), `29 abr.` (Spanish, RAE-style abbreviation)
- Dates in reports: `2026-04-29` (ISO 8601, always)
- Times: 12-hour with `am`/`pm` lowercase no space (`6:30am`) in EN; 24-hour (`06:30`) in ES contexts and all reports

> **Inferred:** Date and time formatting conventions above are extrapolated from the landing-page artboard, where dates appeared in the `Apr 29` style. Confirm with the i18n team before locking these into shared formatters; locale rules may differ for Mexico vs. US Spanish.

## Tracking and case

- **Body text**: default Inter tracking (0). Do not tighten or loosen.
- **Display Inter** at ≥32px: tighten to `-0.02em` to `-0.025em`. Inter opens up at large sizes; the negative tracking pulls it back.
- **All-caps labels**: 0.18em for `.label` and `.section-num` (the brand-defining value); 0.10em for `.label-metric` inside KPI tiles. Anything tighter looks generic; anything looser looks decorative.
- **Sentence case** for English headlines (`Find work today`), not Title Case. RAE-conformant **sentence case** for Spanish (`Encuentra trabajo hoy`). Title Case is reserved for proper-noun-heavy headers and is the exception.

## Font loading

The page should not flash unstyled (FOUT) or invisible (FOIT) text. Use `font-display: swap` and load the variable files. Preload Inter at the variable opsz/wght axes — it carries the entire visual register.

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="preload"
  as="style"
  href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400..700;1,14..32,400..700&family=JetBrains+Mono:wght@400;500&display=swap"
/>
```

For self-hosting (preferred for production), download the latest static cuts from Google Fonts, place under `public/fonts/`, and declare with `@font-face` using `font-display: swap` and `unicode-range: U+0000-007F, U+00A0-00FF, U+0100-017F` to cover EN and ES. JetBrains Mono is small (single weight 400, optional 500); subsetting is unnecessary.
