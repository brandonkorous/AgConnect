# 03 — Tierra: Typography

Tierra's audience is farmworkers, farm operators, FLCs, training organizations, and grant officers. Typography here is utilitarian first and warm second. The palette is restrained so that type can do clear, calm, civic work — not so it can carry an editorial performance. The Tierra type voice should sit closer to a public-service tool with craft (CDFA, EDD, LA County) than to a B2B brand magazine.

## Typefaces

Three families. Adding a fourth is a brand-level decision.

| family | role | source |
|---|---|---|
| **Fraunces** | display headlines, section openers, marketing | Google Fonts (variable; SOFT, WONK, opsz, wght axes) |
| **Inter** | UI body, labels, forms, tables of words | Google Fonts (variable; opsz, wght) |
| **DM Mono** | tabular figures, money, time, timestamps, code, identifiers, civic stats | Google Fonts |

### Fraunces — the headline serif

Fraunces is a contemporary serif with optical-size and personality axes (SOFT, WONK). It gives Tierra warmth and craft at headline sizes without slipping into preciousness. Treat it as a serious display face, not a brand-magazine fingerprint.

Variable axis defaults across the system:

```css
.fraunces {
  font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
  font-variation-settings:
    'opsz' 144,   /* display optical size at large sizes */
    'SOFT' 50,    /* softened terminals — friendly but not cute */
    'WONK' 0;     /* never enable swashes; WONK 1 is editorial decoration we do not use */
  font-feature-settings: 'ss01' on, 'ss03' on; /* alternate g, single-story a */
}
```

Display sizes ≥ 32px should set `opsz` to 144. UI sizes (rare — Fraunces should mostly be display) should set `opsz` to 14 or 28.

**Default to upright Fraunces, weight 500–600.** Italic is reserved — for the rare quoted phrase, a single emphasized word inside body text, or a place name in running prose. **Italic is not the default headline cut.** Light-weight italic display (the magazine cover treatment) is out of brand. Bold-italic word-art splits — italic line one over bold line two — are out of brand. Stack ES italic over EN bold (or vice versa) is out of brand.

If a marketing headline reaches for italic to feel warm, rewrite the headline instead.

### Inter — the workhorse

Inter is the body and UI face. Use the variable file. Set `opsz` to match the rendered size.

```css
.inter {
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-feature-settings: 'cv11' on, /* single-story a */ 'ss01' on;
  font-variant-numeric: tabular-nums; /* always for UI */
}
```

Use Inter for: paragraphs, form labels, button text, table cells (except numeric — see DM Mono), nav, menu, alerts, and most product chrome.

### DM Mono — the figures

DM Mono is the **inline tabular face**: numbers that align in columns, money shown in lists or table cells (`$19.50/hr`), time, dates in metadata strips, and anything that reads as a code or identifier (job IDs, certificate hashes, `WIOA-1B`). Tabular monospaced numbers are non-negotiable in reporting and pay tables.

DM Mono is **not a display face.** Display-size statistics (impact-tile numbers, dashboard hero counters, pricing) belong in upright Fraunces with `tabular-nums` — the slab-mono terminal feel takes over at large sizes and reads as code output rather than money or impact. Keep DM Mono at body sizes (≤ 18px in most surfaces, ≤ 24px in rare emphasis cases).

```css
.dm-mono {
  font-family: 'DM Mono', 'JetBrains Mono', 'Menlo', monospace;
  font-variant-numeric: tabular-nums slashed-zero;
  letter-spacing: -0.005em; /* DM Mono is slightly wide; nudge tighter */
}
```

DM Mono is also the typeface for the eyebrow label pattern when the label is a short code (`#APP-2031`, `WIOA-1B`). For text-style eyebrow labels, use Inter — see "Label convention" below.

## Type scale

The scale is small. Tierra prefers fewer, more deliberate sizes over a long ramp.

| token | family | size | line-height | weight | use |
|---|---|---|---|---|---|
| `display-xl` | Fraunces upright | 72px / 4.5rem | 1.05 | 600 | hero on marketing only |
| `display-l`  | Fraunces upright | 56px / 3.5rem | 1.10 | 600 | section openers in marketing |
| `display-m`  | Fraunces upright | 40px / 2.5rem | 1.15 | 500 | secondary marketing headlines |
| `headline`   | Fraunces upright | 32px / 2rem   | 1.20 | 500 | product page H1 |
| `title`      | Fraunces upright | 24px / 1.5rem | 1.20 | 500 | card titles, dialog titles |
| `stat`       | Fraunces upright | 48px / 3rem   | 1.00 | 600 | display-size statistics (impact tiles, dashboard hero counters) — set with `tabular-nums` |
| `subtitle`   | Inter            | 18px / 1.125rem | 1.45 | 500 | grouping above a list, intro paragraph |
| `body`       | Inter            | 16px / 1rem   | 1.55 | 400 | default body |
| `body-s`     | Inter            | 14px / 0.875rem | 1.50 | 400 | dense rows, secondary body |
| `caption`    | Inter            | 13px / 0.8125rem | 1.45 | 400 | metadata, helper text |
| `label`      | Inter            | 11px / 0.6875rem | 1.30 | 600 | UPPERCASE 0.18em — see below |
| `mono`       | DM Mono          | 14px / 0.875rem | 1.50 | 400 | money, time, IDs |
| `mono-s`     | DM Mono          | 12px / 0.75rem | 1.40 | 400 | dense numeric tables |

> **Inferred:** Pixel sizes are the canonical brand scale; the `rem` equivalents assume `font-size: 16px` on `:root`. Production `rem` values may differ if a project sets a different root size. The scale was tuned on the Tierra landing page artboard; adjust the smallest sizes (`label`, `caption`, `mono-s`) cautiously — they are at the bottom of the readability cliff.

## Label convention

A signature Tierra gesture. Eyebrow labels appear above section titles, on cards, and in metadata strips.

```css
.label {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: color-mix(in oklab, var(--color-base-content) 65%, transparent); /* default; shift to var(--color-primary) for emphasis */
  line-height: 1.3;
}
```

- Always uppercase.
- Always 0.18em letter-spacing — this is the value verified across the landing page and brand kit. Do not improvise.
- Default color is `base-content` at ~65% opacity on base surfaces. On `neutral` (dark) surfaces, use `neutral-content` at ~64% opacity, never `accent`.
- Trailing punctuation is not used — labels do not take periods or colons.

Examples: `FOR FARMWORKERS`, `ABOUT TIERRA`, `WORKER ROLE`, `STEP 02`, `EN ESPAÑOL`.

## Italic and bold

Use italic sparingly: a quoted phrase, a place name in running prose, a single emphasized word. Italic is **not** a display device, **not** a section-opener treatment, and **not** the way bilingual text is differentiated. Languages are differentiated by the locale toggle, not by italicizing one of them.

Use bold confidently: form labels, button text, headlines, the first word of a scannable list item, table headers, statistic numbers in civic data bands. Bold is a utilitarian tool, not a brand smell.

If you find yourself reaching for italic to make a marketing headline feel warm, rewrite the headline. If you find yourself reaching for bold-italic display word-art to make a hero "feel like Tierra," redesign the hero.

## Numbers and money

All numeric figures use `font-variant-numeric: tabular-nums`. Money and key statistics also use DM Mono.

Acceptable formats:

- Money: `$19.50/hr` (no space, slash, lowercase unit)
- Hours: `8h` or `8 hrs` — pick one per surface and stay consistent
- Dates in product UI: `Apr 29` (English), `29 abr.` (Spanish, RAE-style abbreviation)
- Dates in reports: `2026-04-29` (ISO 8601, always)
- Times: 12-hour with `am`/`pm` lowercase no space (`6:30am`) in EN; 24-hour (`06:30`) in ES contexts and all reports

> **Inferred:** Date and time formatting conventions above are extrapolated from the landing-page artboard, where dates appeared in the `Apr 29` style. Confirm with the i18n team before locking these into shared formatters; locale rules may differ for Mexico vs. US Spanish.

## Tracking and case

- **Body text**: default Inter tracking (0). Do not tighten or loosen.
- **Display Fraunces** at ≥48px: tighten by `-0.01em` to `-0.02em`. Fraunces opens up at large sizes.
- **All-caps labels**: 0.18em (the brand-defining value). Anything tighter looks generic; anything looser looks decorative.
- **Sentence case** for English headlines (`Find work today`), not Title Case. RAE-conformant **sentence case** for Spanish (`Encuentra trabajo hoy`). Title Case is reserved for proper-noun-heavy headers and is the exception.

## Font loading

The page should not flash unstyled (FOUT) or invisible (FOIT) text. Use `font-display: swap` and load the variable files. For Fraunces specifically, preload the variable italic file because it is the brand-defining cut.

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="preload"
  as="style"
  href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..700,30..100,0..1;1,9..144,300..700,30..100,0..1&family=Inter:opsz,wght@14..32,300..700&family=DM+Mono:wght@400;500&display=swap"
/>
```

For self-hosting (preferred for production), download the latest static cuts from Google Fonts, place under `public/fonts/`, and declare with `@font-face` using `font-display: swap` and `unicode-range: U+0000-007F, U+00A0-00FF, U+0100-017F` to cover EN and ES.
