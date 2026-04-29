# 03 — Tierra: Typography

Typography does most of the emotional work in the Tierra brand. The palette is restrained on purpose so that type — its scale, its italics, its tabular numerals — can carry weight, warmth, and credibility.

## Typefaces

Three families. Adding a fourth is a brand-level decision.

| family | role | source |
|---|---|---|
| **Fraunces** | display, editorial headlines, brand voice, marketing | Google Fonts (variable; SOFT, WONK, opsz, wght axes) |
| **Inter** | UI body, labels, forms, tables of words | Google Fonts (variable; opsz, wght) |
| **DM Mono** | tabular figures, money, time, timestamps, code, identifiers | Google Fonts |

### Fraunces — the brand voice

Fraunces is a contemporary serif with optical-size and personality axes (SOFT, WONK). It is the typeface that makes Tierra feel like a publication and not a SaaS product. Treat it as the brand's body language.

Variable axis defaults across the system:

```css
.fraunces {
  font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
  font-variation-settings:
    'opsz' 144,   /* display optical size at large sizes */
    'SOFT' 50,    /* softened terminals — friendly but not cute */
    'WONK' 0;     /* no swashes by default; 1 only for editorial accents */
  font-feature-settings: 'ss01' on, 'ss03' on; /* alternate g, single-story a */
}
```

Display sizes ≥ 32px should set `opsz` to 144. UI sizes (rare — Fraunces should mostly be display) should set `opsz` to 14 or 28.

**Italic is the brand's smile.** When Tierra wants to feel warm — a hero headline, a quote, a place name in a section opener — it goes to Fraunces italic, not bold. Bold Fraunces exists but is reserved for short capitalized labels or runs of two-or-three-word headlines where italic would feel sentimental.

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

DM Mono is used wherever numbers must align in columns, where money is shown, where time is shown, and for anything that reads as a code or identifier (job IDs, certificate hashes). Tabular monospaced numbers are non-negotiable in reporting and pay tables.

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
| `display-xl` | Fraunces italic | 88px / 5.5rem | 0.95 | 400 | hero on marketing only |
| `display-l`  | Fraunces italic | 64px / 4rem   | 1.00 | 400 | section openers in marketing |
| `display-m`  | Fraunces italic | 48px / 3rem   | 1.05 | 400 | secondary marketing headlines |
| `headline`   | Fraunces        | 32px / 2rem   | 1.15 | 500 | product page H1 |
| `title`      | Fraunces        | 24px / 1.5rem | 1.20 | 500 | card titles, dialog titles |
| `subtitle`   | Inter           | 18px / 1.125rem | 1.45 | 500 | grouping above a list, intro paragraph |
| `body`       | Inter           | 16px / 1rem   | 1.55 | 400 | default body |
| `body-s`     | Inter           | 14px / 0.875rem | 1.50 | 400 | dense rows, secondary body |
| `caption`    | Inter           | 13px / 0.8125rem | 1.45 | 400 | metadata, helper text |
| `label`      | Inter           | 11px / 0.6875rem | 1.30 | 600 | UPPERCASE 0.18em — see below |
| `mono`       | DM Mono         | 14px / 0.875rem | 1.50 | 400 | money, time, IDs |
| `mono-s`     | DM Mono         | 12px / 0.75rem | 1.40 | 400 | dense numeric tables |

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
  color: var(--tierra-soil); /* default; can shift to --tierra-moss for emphasis */
  line-height: 1.3;
}
```

- Always uppercase.
- Always 0.18em letter-spacing — this is the value verified across the landing page and brand kit. Do not improvise.
- Default color is soil on bone. On dark surfaces, default to bone @ 64% opacity, never honey.
- Trailing punctuation is not used — labels do not take periods or colons.

Examples: `FOR FARMWORKERS`, `ABOUT TIERRA`, `WORKER ROLE`, `STEP 02`, `EN ESPAÑOL`.

## Italic for emphasis

Tierra emphasizes with **italic**, not bold. This is one of the brand's clearest fingerprints. In a paragraph of body Inter, an italic phrase reads as quietly emphasized; a bold phrase reads as loud and out of brand.

Acceptable bold uses:

- Form labels (`<label>` text in forms).
- Short table headers.
- The very first word of a list item, when the list is being scanned (a la documentation).

If you find yourself reaching for bold to call attention to a phrase mid-paragraph, use italic instead.

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
