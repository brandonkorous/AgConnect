# 02 — Tierra: Color

Tierra's color system is the daisyUI semantic tokens defined in [`apps/web/src/app/themes/tierra-light.css`](../../apps/web/src/app/themes/tierra-light.css) and [`tierra-dark.css`](../../apps/web/src/app/themes/tierra-dark.css). Every surface, every component, every text run resolves to one of these tokens. Both light and dark themes are defined; daisyUI flips between them via `data-theme`.

Use the semantic tokens — `bg-primary`, `bg-base-100`, `text-base-content`, `bg-accent` — not raw hex. daisyUI's component defaults are tuned to these tokens, and the dark theme picks up the inverse automatically.

## Theme files

Source of truth for every color in the system. Mirror these files when updating the doc.

### tierra-light

```css
@plugin 'daisyui/theme' {
  name: "tierra-light";
  default: true;
  prefersdark: false;
  color-scheme: light;

  --color-primary:           oklch(50% 0.09 120);   /* #5B6E2E olive */
  --color-primary-content:   oklch(98% 0.005 95);
  --color-secondary:         oklch(36% 0.07 120);   /* #3F4E1F deep olive */
  --color-secondary-content: oklch(98% 0.005 95);
  --color-accent:            oklch(83% 0.13 88);    /* #D9B441 gold */
  --color-accent-content:    oklch(20% 0.005 80);
  --color-neutral:           oklch(20% 0.005 80);   /* #1C1C1A warm near-black */
  --color-neutral-content:   oklch(98% 0.005 95);
  --color-base-100:          oklch(98% 0.005 95);   /* #FAFAF8 primary content surface */
  --color-base-200:          oklch(94% 0.012 80);   /* #F3EFE6 chrome surface */
  --color-base-300:          oklch(89% 0.014 80);   /* #E5E2D8 product page ground */
  --color-base-content:      oklch(20% 0.005 80);
  --color-info:              oklch(40% 0.09 260);
  --color-success:           oklch(45% 0.12 145);
  --color-warning:           oklch(55% 0.13 60);
  --color-error:             oklch(52% 0.18 28);

  --radius-selector: 0.5rem;
  --radius-field:    9999px;   /* pill buttons / pill inputs */
  --radius-box:      1rem;     /* cards, modals */

  --size-selector: 0.25rem;
  --size-field:    0.30rem;
}
```

Hue map: olive primary (~120°), gold accent (~88°), warm-cream neutrals (~80–95°). Pill-shaped buttons / fields (`--radius-field: 9999px`) and rounded cards (`--radius-box: 1rem`) are part of the brand's visual signature — do not override per-component.

### tierra-dark

```css
@plugin 'daisyui/theme' {
  name: 'tierra-dark';
  default: false;
  prefersdark: true;
  color-scheme: dark;

  --color-primary:           oklch(50% 0.09 120);   /* lifted olive */
  --color-primary-content:   oklch(15% 0.02 120);
  --color-secondary:         oklch(62% 0.10 120);   /* #7A9248 mid-olive */
  --color-secondary-content: oklch(15% 0.02 120);
  --color-accent:            oklch(83% 0.13 88);    /* gold — same chroma as light */
  --color-accent-content:    oklch(20% 0.005 80);
  --color-neutral:           oklch(26% 0.005 80);   /* #2A2A26 elevated chrome */
  --color-neutral-content:   oklch(98% 0.005 95);
  --color-base-100:          oklch(20% 0.005 80);   /* #1C1C1A page bg */
  --color-base-200:          oklch(24% 0.006 80);   /* #252521 card */
  --color-base-300:          oklch(30% 0.008 80);   /* #33332E lifted surface / border */
  --color-base-content:      oklch(94% 0.012 80);
  --color-info:              oklch(70% 0.10 260);
  --color-success:           oklch(76% 0.18 145);
  --color-warning:           oklch(82% 0.16 80);
  --color-error:             oklch(70% 0.16 25);

  --radius-selector: 0.5rem;
  --radius-field:    9999px;
  --radius-box:      1rem;
}
```

Dark Tierra mirrors light Tierra's architecture: `base-100` is the most-used surface (cards, modals, inputs) in both modes, just at very different lightnesses. The `bg-base-100` / `bg-base-200` / `bg-base-300` mental model holds — only the resolved colors flip.

> **Inferred:** Hex equivalents in the comments are derived from OKLCH and may differ slightly from a converter. The OKLCH declarations are the source of truth.

## Semantic role map

What each token resolves to and where to use it:

| token | light | dark | typical use |
|---|---|---|---|
| `primary` | `#5B6E2E` olive | lifted olive | primary CTA, brand voice, header rules |
| `primary-content` | near-white | dark olive | text on `primary` |
| `secondary` | `#3F4E1F` deep olive | `#7A9248` mid-olive | secondary CTA, supporting emphasis |
| `secondary-content` | near-white | dark olive | text on `secondary` |
| `accent` | `#D9B441` gold | gold (same chroma) | the loud color — primary CTAs, active step indicators, count badges, ambient lighting on dark feature cards, statistic highlights |
| `accent-content` | warm near-black | warm near-black | text on `accent` |
| `neutral` | `#1C1C1A` warm near-black | `#2A2A26` elevated | dark surfaces, footer, "deep stop" sections |
| `neutral-content` | near-white | near-white | text on `neutral` |
| `base-100` | `#FAFAF8` | `#1C1C1A` | primary content surface — cards, modals, inputs, dropdowns, popovers |
| `base-200` | `#F3EFE6` | `#252521` | chrome surface — sidebar, top bar, footer, set-apart sub-panels |
| `base-300` | `#E5E2D8` | `#33332E` | product page ground / set-apart marketing band |
| `base-content` | warm near-black | warm near-white | body text on any base surface |
| `info` | warm slate | lifted slate | informational state |
| `success` | warm green | lifted green | success state |
| `warning` | warm amber | gold | warning state |
| `error` | warm red | lifted red | error state |

## Crop palette

A semantic mini-palette for crop / job-type identification — used in crop chips, glyphs, and category icons across worker and employer surfaces. These are categorical (each color identifies a category), not state colors.

| crop | hex | typical use |
|---|---|---|
| grape | `#6B2B5E` | table grape, wine grape jobs |
| almond | `#C58A5A` | almond shaking, hulling, processing |
| citrus | `#E07A1F` | orange, lemon, mandarin pruning/picking |
| tomato | `#C73E2A` | field tomato, processing tomato |
| lettuce | `#4A8C3A` | leafy greens, ground crops |
| strawberry | `#D43855` | berry pick, berry pack |

Crop colors only appear in chips, glyphs, and category indicators — never as a body text color, a CTA background, or a categorical chart-series color (use the chart palette in [07-imagery.md § Charts](07-imagery.md) for that). They share the visual register of the rest of the brand (warm hues, mid saturation) but sit outside the semantic-state system; a crop color never communicates state.

> **Inferred:** This palette was extracted from the worker dashboard Paper file. Validate the hex values when crop chips are first implemented — minor chroma/lightness adjustments may be needed for AA contrast on the chip background (`base-200` warm cream).

## Page surfaces

The 3-deep base scale gives every surface a defined home. Product and marketing each use the scale differently.

### Product surfaces — `base-300` page, `base-100` cards

In-app dashboards, lists, forms, settings — anywhere a worker / employer / admin is *using* the product. Cards lift off the page through tone contrast plus hairline borders.

- **Page background**: `base-300` (light: `#E5E2D8`, dark: `#33332E`).
- **Chrome** (sidebar, top bar, footer chrome): `base-200`. Hairline border separates from the page.
- **Cards, modals, popovers, dropdowns, inputs, stats shelves, training tiles, cert tiles**: `base-100` — the everywhere card surface. This is where reading happens.
- **Set-apart inside a card** (table headers, sub-panels): `base-200` on `base-100` — a quiet step *down* in lightness, the inverse of how the card lifts off the page.
- **Inset content on chrome** (search input in a top bar, active item in a sidebar): `base-100` on `base-200` — same content surface inside the chrome region. Hairline does the separation.
- **Above-the-card differentiation** (active sidebar item, focused row, selected card, hover state): there is no surface lighter than `base-100`, so use a non-color cue: a `primary` / `accent` rule, a `base-300` "pressed" tint, a bolder border, the eyebrow weight + position, or an explicit selected-state border-color.

Most of the visible product surface is `base-100` on `base-300`. `base-200` shows up at the edges (sidebar, top bar) and in the seams (table headers, sub-panels).

### Marketing surfaces — `base-100` page, alternating bands

Landing page, blog, public site. Marketing uses a flat, civic-publication aesthetic; section bands carry rhythm. Avoid magazine-style flourish (oversized italic display, pull-quote chrome, ES/EN word-art stacks).

- **Page background**: `base-100` (warm near-white). The page is the brightest surface; bands step *down* into the deeper tones for rhythm.
- **Section bands**: alternate `base-100` / `base-200` / `base-300` per [04-spacing-layout.md § Section rhythm](04-spacing-layout.md). For an unmistakable brand band reach for `bg-primary text-primary-content` (olive). A `bg-neutral` dark band is reserved for one or two "deep stop" moments per page.
- **Cards in marketing**: rare. When used, hairline border on light bands; elevated/dark feature cards may use the `--shadow-card` token plus an ambient gold radial overlay.
- **Accent**: `accent` (gold) is the loud color — applied to primary CTAs, key statistics, chart highlights, ambient lighting on dark feature cards, count badges, and active states. **Never as a body text color** (a11y), **never as decoration with no purpose**. Apply where it serves intent.

### Implementation cheat sheet

```html
<!-- product surface -->
<body class="bg-base-300">
  <aside class="bg-base-200 border-r">…</aside>           <!-- chrome -->
  <main class="bg-base-300">
    <header class="bg-base-200 border-b">…</header>       <!-- chrome -->
    <section class="card">…</section>                     <!-- bg-base-100 default -->
    <input class="input" />                               <!-- bg-base-100 default -->
  </main>
  <dialog class="modal-box">…</dialog>                    <!-- bg-base-100 default -->
</body>

<!-- marketing surface -->
<body class="bg-base-100">
  <header class="bg-base-100">…</header>
  <main class="bg-base-100">
    <section class="bg-base-100">…</section>                          <!-- light band -->
    <section class="bg-base-200">…</section>                          <!-- mid band -->
    <section class="bg-base-300">…</section>                          <!-- deep band -->
    <section class="bg-primary text-primary-content">…</section>      <!-- brand band -->
    <section class="bg-neutral text-neutral-content">…</section>      <!-- dark stop -->
  </main>
</body>
```

> **daisyUI alignment**: With the 3-deep scale, daisyUI defaults (`.card`, `.modal-box`, `.dropdown-content`, `.menu`, `.input`, `.select`, `.textarea`, `.tooltip`) all use `bg-base-100` and render correctly without override. Chrome elements need an explicit `bg-base-200`; product page ground needs an explicit `bg-base-300`.

### When in doubt

- Scannable list of items (jobs, applications, certificates)? `base-100` card on `base-300`. Product convention.
- Marketing page with one main message and generous whitespace? `base-100` page, no cards. Marketing convention.
- App chrome (sidebar, header, content)? `base-300` page, `base-200` chrome, `base-100` cards.
- Need to "lift" something *above* the card (active state, selected row, modal-over-card)? Non-color cue (border accent, primary/accent rule, `base-300` tint going darker, weight). There's no surface lighter than `base-100`.
- Need a "deep stop" section on a marketing page? `bg-neutral text-neutral-content`. Use once or twice per page.

## Pairing rules

- **`base-content` on `base-100`** — the dominant pairing; every card body, every form, every modal.
- **`base-content` on `base-200` / `base-300`** — chrome and page-ground bodies; contrast eases slightly but stays AAA.
- **`primary-content` on `primary`** — standard CTA pairing.
- **`secondary-content` on `secondary`** — supporting CTA pairing.
- **`accent-content` on `accent`** — the loud color. Applied to primary CTAs, statistic highlights, count badges, active state indicators, and chart highlights where attention is the goal. The intent of accent is to draw the eye; apply it where the eye should land.
- **`neutral-content` on `neutral`** — inverse text on dark bands, footers, deep-stop sections.
- **Status text** — `info`, `success`, `warning`, `error` paired with their `-content` counterparts inside alerts and badges. Do not use status colors as decorative accents; they read as state.

## Contrast verification

WCAG 2.1 AA at default sizes (≥18px regular / ≥14px bold = 4.5:1; large text = 3:1). Run any new combination through a checker before shipping.

The pairings to verify whenever the theme changes:

- `base-content` on `base-100`, `base-200`, `base-300` (light + dark)
- `primary-content` on `primary` (light + dark)
- `secondary-content` on `secondary` (light + dark)
- `accent-content` on `accent` (light + dark)
- `neutral-content` on `neutral` (light + dark)
- `info-content` / `success-content` / `warning-content` / `error-content` on their respective backgrounds

> **Inferred:** Specific ratios are not pre-computed here because the theme expresses values in OKLCH, not hex, and small drift between source and rendered output is possible. Pull the rendered values from the running app and pass them through a checker; record any failing combination as a theme bug, not a usage rule.
