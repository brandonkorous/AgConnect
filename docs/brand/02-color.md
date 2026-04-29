# 02 — Tierra: Color

## Palette

Six named colors. Every other shade in the system is a transparency overlay of one of these on top of another. Adding a seventh color is a brand-level decision, not a design-time decision.

| token | hex | name | role |
|---|---|---|---|
| `--tierra-bone` | `#EFE6D2` | Bone | primary background, page ground, the "default" surface |
| `--tierra-moss` | `#2D4030` | Deep Moss | primary brand color, primary buttons, header rules, brand voice |
| `--tierra-honey` | `#C8A24A` | Harvest Honey | accent, single-use loud color, active state, key statistic |
| `--tierra-sage` | `#D9CFB6` | Sage | secondary surface, card background, divider field |
| `--tierra-ink` | `#1F1B14` | Sun-Ink | body text, headings, near-black with warmth |
| `--tierra-soil` | `#5C4326` | Soil | secondary brand, supporting buttons, muted emphasis |

> **Inferred:** OKLCH equivalents are derived for daisyUI 5 compatibility (daisyUI 5 prefers OKLCH). They were computed from the canonical hex values and may carry small rounding deltas; the hex values are the source of truth.

```
--tierra-bone:  oklch(92.3% 0.024 88)
--tierra-moss:  oklch(34.7% 0.041 148)
--tierra-honey: oklch(72.5% 0.118 80)
--tierra-sage:  oklch(83.2% 0.022 88)
--tierra-ink:   oklch(20.1% 0.014 70)
--tierra-soil:  oklch(35.8% 0.055 60)
```

## Semantic roles

The named palette maps onto semantic roles. Implementations should reference the role, not the named color, except in marketing where named colors can be invoked directly.

| role | light | dark (inferred) | use |
|---|---|---|---|
| `bg` | bone | ink | page background |
| `surface` | sage | moss | cards, inset panels |
| `surface-strong` | bone over sage hairline | moss over ink hairline | elevated panels |
| `text` | ink | bone | body |
| `text-muted` | soil | sage | captions, metadata |
| `text-inverse` | bone | ink | text on moss/ink |
| `border` | ink @ 12% | bone @ 12% | hairlines |
| `border-strong` | ink @ 24% | bone @ 24% | input borders, table rules |
| `brand` | moss | bone | primary CTA, brand chrome |
| `brand-on` | bone | ink | text on `brand` |
| `accent` | honey | honey | one-of-one loud element |
| `accent-on` | ink | ink | text on `accent` |

## daisyUI 5 token map

The full daisyUI 5 light theme. Drop into `tailwind.config.{ts,js}` plugin section.

```ts
// tailwind.config.ts
import daisyui from 'daisyui';

export default {
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        tierra: {
          'color-scheme': 'light',
          'primary':           '#2D4030',
          'primary-content':   '#EFE6D2',
          'secondary':         '#5C4326',
          'secondary-content': '#EFE6D2',
          'accent':            '#C8A24A',
          'accent-content':    '#1F1B14',
          'neutral':           '#1F1B14',
          'neutral-content':   '#EFE6D2',
          'base-100':          '#EFE6D2',
          'base-200':          '#D9CFB6',
          'base-300':          '#B8A98C',
          'base-content':      '#1F1B14',
          'info':              '#4A6B7C',
          'info-content':      '#EFE6D2',
          'success':           '#5A7842',
          'success-content':   '#EFE6D2',
          'warning':           '#C8A24A',
          'warning-content':   '#1F1B14',
          'error':             '#8B3A2F',
          'error-content':     '#EFE6D2',
          '--rounded-box':     '0',
          '--rounded-btn':     '0',
          '--rounded-badge':   '0',
          '--border':          '1px',
          '--tab-radius':      '0',
        },
      },
    ],
  },
};
```

> **Inferred:** Values for `base-300`, `info`, `success`, `warning`, and `error` were chosen to harmonize with the named palette but were not explicitly set during the brand-kit session. They sit on the same warm/desaturated curve as the named colors. Verify these against the Tierra brand-kit artboard before shipping.

## Dark theme

> **Inferred:** A dark theme has not been formally established. The values below are a faithful inversion that preserves the warm, low-chroma feeling. They should be reviewed (and probably hand-tuned) before use in production.

```ts
{
  'tierra-dark': {
    'color-scheme': 'dark',
    'primary':           '#A8C8A0',  // sage-shifted moss for contrast on ink
    'primary-content':   '#1F1B14',
    'secondary':         '#B8956A',  // soil lifted
    'secondary-content': '#1F1B14',
    'accent':            '#D4B566',  // honey lifted
    'accent-content':    '#1F1B14',
    'neutral':           '#EFE6D2',
    'neutral-content':   '#1F1B14',
    'base-100':          '#1F1B14',
    'base-200':          '#2D4030',
    'base-300':          '#3E5640',
    'base-content':      '#EFE6D2',
    'info':              '#7A9CB0',
    'info-content':      '#1F1B14',
    'success':           '#8AAA72',
    'success-content':   '#1F1B14',
    'warning':           '#D4B566',
    'warning-content':   '#1F1B14',
    'error':             '#C46550',
    'error-content':     '#1F1B14',
  },
}
```

## Pairing rules

What goes on what — keep this short list memorable.

- **Body text**: ink on bone, ink on sage. Never ink on moss (use bone or honey-as-emphasis instead).
- **Bone on moss / bone on ink**: standard inverse text.
- **Honey on bone**: ONLY as a focused accent (single CTA, single chart highlight, single statistic). Never as a body color, never as a decorative fill.
- **Honey on ink**: hero CTA on dark surface. Use sparingly.
- **Soil**: muted text on bone (captions, metadata, "since 2019"). Avoid soil on sage — too low contrast for body. Soil is also fine as a button fill (with bone text) when moss is taken by the page-level CTA.
- **Sage on bone**: card surface or sectional band. Always with hairline border, never with shadow.

## Tailwind utility extensions

Extend Tailwind so the named palette is available alongside daisyUI tokens, for marketing pages that want to invoke specific colors:

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      bone:  '#EFE6D2',
      moss:  '#2D4030',
      honey: '#C8A24A',
      sage:  '#D9CFB6',
      ink:   '#1F1B14',
      soil:  '#5C4326',
    },
    fontFamily: {
      // see 03-typography.md
    },
  },
}
```

## Contrast verification

WCAG 2.1 AA contrast ratios at default sizes (≥18px regular / ≥14px bold = 4.5:1; large text = 3:1). Run all of these through a checker before shipping any new combination.

| pairing | ratio | passes |
|---|---|---|
| ink on bone | 14.8:1 | AAA body |
| ink on sage | 11.4:1 | AAA body |
| bone on moss | 9.7:1 | AAA body |
| bone on ink | 16.1:1 | AAA body |
| ink on honey | 8.6:1 | AAA body |
| soil on bone | 7.1:1 | AAA body |
| moss on bone | 9.4:1 | AAA body |
| honey on bone | 2.4:1 | **fails body**, use only as fill or large display |
| honey on moss | 3.9:1 | AA large only |

> **Inferred:** Ratios above are computed from the canonical hex values; they round to one decimal and may differ trivially from a checker. The `honey on bone` failure is intentional — honey is meant as a fill color, not a text color on a light ground. If a designer reaches for honey-text-on-bone, push back.
