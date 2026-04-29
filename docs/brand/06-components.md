# 06 — Tierra: Components

Component patterns that recur across product and marketing. These are not React component specs — those live with the implementation. They are the visual rules a designer or engineer should match when building any of these elements, in any framework.

> **Inferred:** Variants below are derived from the Tierra brand-kit and landing-page artboards plus the conventions in [02-color.md](02-color.md), [03-typography.md](03-typography.md), and [04-spacing-layout.md](04-spacing-layout.md). Production may want to encode these as a daisyUI `tierra` theme + a small set of project-level CSS classes.

## Buttons

Three button variants. No more.

### Primary — moss

The page-level CTA. One per visible viewport.

- Background: moss (`#2D4030`)
- Text: bone, Inter 14px, weight 500
- Padding: 14px vertical / 24px horizontal
- Border-radius: 0
- Border: none on bone backgrounds; 1px moss on dark backgrounds
- Hover: background shifts to ink (`#1F1B14`)
- Active: background shifts further to soil-mixed ink
- Focus: 2px honey outline, 2px offset
- Icon (optional): leading, 16px, 8px gap to text
- Disabled: 40% opacity, no cursor change to "not-allowed" — just remove pointer events

### Secondary — ghost

Used alongside primary, or as the page CTA when primary is taken.

- Background: transparent
- Text: ink, Inter 14px, weight 500
- Border: 1px solid `var(--border-strong)` (ink @ 24%)
- Padding: 13px / 23px (1px reserved for the border so total height matches primary)
- Hover: background shifts to sage
- Focus: same as primary (honey outline)

### Accent — honey

Reserved for the single loudest action on the marketing site (e.g., the hero CTA on the dark band). Never used in product UI.

- Background: honey (`#C8A24A`)
- Text: ink, Inter 14px, weight 600
- Padding: 14px / 24px
- Hover: background shifts darker (~10% darker)
- Focus: 2px ink outline, 2px offset

### Sizes

- `sm`: 32px height, 12px / 16px padding, 13px text
- `md` (default): 44px height, 14px / 24px padding, 14px text
- `lg`: 52px height, 16px / 28px padding, 15px text — marketing only

### Anti-patterns

- No `border-radius`. No pill buttons.
- No gradient buttons.
- No icon-only square buttons in marketing — pair with text.
- No more than one primary button visible at a time.
- Use `white-space: nowrap` on button text so multi-word labels (`Find work today`, `Hire a verified crew`) never wrap to two lines inside a flex container.

## Cards

Cards are the product's primary container.

- Background: bone or sage (use sage when on a bone band, bone when on a sage band)
- Border: 1px hairline (`--border-hairline`)
- Border-radius: 0
- Padding: 24px (desktop), 20px (mobile)
- Shadow: none
- Internal type: title (Fraunces 24/1.2), body (Inter 16/1.55), label (eyebrow above title)
- Internal stack: label → title → body → metadata strip (middot-delimited)

A card with an internal CTA places the CTA bottom-right or bottom-full-width depending on density. For grids of cards with bottom-CTA rows, the CTA must be **baseline-aligned across all cards in the row**: ensure card heights are stretched to equal in the grid (via `grid-template-rows: 1fr` or `align-items: stretch`) and push the CTA with `margin-top: auto`.

## Badges & chips

Two distinct elements:

- **Badge**: small status indicator, sage background.
- **Chip**: filterable token (skills, counties), bone background with hairline border.

### Badge

- Background: sage (`#D9CFB6`)
- Text: ink, Inter 11px uppercase, weight 600, 0.18em tracking — same pattern as eyebrow labels
- Padding: 4px 8px
- Border-radius: 0
- Variants for status:
  - `info` — info color background, info-content text
  - `success` — success background, success-content text
  - `warning` — honey background, ink text
  - `error` — error background, error-content text

### Chip

- Background: bone
- Border: 1px hairline
- Text: ink, Inter 13px, weight 500
- Padding: 6px 10px
- Border-radius: 0
- Selected state: background sage, hairline becomes 1px ink

## Inputs

Tierra inputs are bottom-bordered, not boxed. This is a conscious break from material-default form aesthetics.

- Container: transparent
- Border: 1px on bottom only (`--border-strong`); top, left, right are unset
- Padding: 12px 0 8px (room for the floating label transition)
- Text: ink, Inter 16px (mobile keyboards trigger zoom below 16px on iOS — never go smaller than 16px on input text)
- Label: floats above the field as an eyebrow label (11px uppercase 0.18em) when the field has a value, drops into the field at 16px Inter when empty
- Helper text: 13px Inter, soil
- Error text: 13px Inter, error color, replaces helper

A simpler "static-label" alternative is acceptable for dense forms (the label sits above the field permanently as a Tierra eyebrow label, the field is bottom-bordered with default placeholder).

### Specific input types

- **Text / email / tel**: as above.
- **Number / money**: as above, but the value display uses DM Mono.
- **Select**: same shell; chevron icon on the right (12px, ink).
- **Checkbox**: 18px square, 1px ink border, sage fill on check, white checkmark. No rounded corners.
- **Radio**: 18px circle, 1px ink border, ink dot on select. (Radios are the only acceptable circular shape in product UI besides avatars-with-photos.)
- **Toggle**: 36×20px pill — yes, pill-shaped is permitted here as the affordance is universally understood. Off: bone with hairline border. On: moss.
- **Textarea**: 1px hairline border on all four sides (a textarea is large enough that all-sides border reads as "container" not "boxy input"), 12px padding, vertical resize only.

## Tables

- Header row: sage background, label-style text (11px uppercase 0.18em, soil)
- Body rows: bone background, body text (14px Inter or 14px DM Mono for numeric columns)
- Row separator: hairline rule between rows; no vertical column rules
- Row padding: 12px vertical / 16px horizontal
- Numeric alignment: right; tabular-nums always
- Hover state on a clickable row: background sage (the same color as the header — this is intentional)
- Empty state: a single row, sage background, italic Inter, "No results — try a different filter."

Tables on mobile collapse to card rows, not horizontally scrolled tables. Each card uses the label/value pair pattern (label above value).

## Section headers

A signature Tierra pattern. Three pieces stacked, top-aligned to the section.

```
LABEL                 ← eyebrow, Inter 11px UPPER 0.18em soil
Headline               ← Fraunces 32–48px, italic preferred for hero, regular for product page
Optional description   ← Inter 16px ink, max-width ~640px
```

Spacing: 8px between label and headline, 16px between headline and description, 32–48px between description and the section content below.

## Header (top nav)

- Height: 72px (desktop), 64px (mobile)
- Background: bone with a hairline bottom border
- Logo: left
- Nav links: center on desktop, hidden behind a square menu icon on mobile
- Right: language toggle (`EN · ES` with the active one in moss, the inactive in soil) and primary CTA (ghost button)
- On scroll: stays bone — no color shift, no shadow. The hairline bottom is always visible.

## Footer

- Background: ink
- Text: bone (body) and bone @ 64% (secondary)
- Layout: four columns desktop (Brand, Product, Resources, Legal), one column mobile
- Links: bone, hover underline, no color change
- Bottom strip: bone @ 64%, 13px, with copyright, language toggle, and a single moss-on-ink primary CTA aligned right

## Navigation patterns

- **Tabs**: bone background, ink text, 2px ink underline on the active tab, hairline rule under the tab strip. No pills.
- **Breadcrumbs**: middot-delimited, soil for all but the last segment which is ink. `Jobs · Pisca de uva · Detalles`
- **Pagination**: prev/next text links with chevrons; numbered pages in DM Mono, the active page underlined with 2px ink. No square page tiles.

## Modals

- Backdrop: ink @ 60%
- Container: bone, hairline border, 0 radius, max-width 560px (default)
- Padding: 32px
- Close button: top-right, 24×24 hit target, an `×` glyph in ink (use `Lucide x`)
- Header: title (Fraunces 24px), optional eyebrow above
- Body: Inter 16px
- Footer: ghost (left) and primary (right) buttons, right-aligned

## Toasts

- Position: bottom-right desktop, top mobile
- Background: ink (default), success/info/warning/error use the daisyUI semantic background tokens
- Text: bone (or contrast-pair for semantic variants)
- Width: 400px max, single-line preferred
- Auto-dismiss: 5s for info/success; never auto-dismiss for error
- Icon: leading, 16px Lucide
- Close button: trailing, optional, never present on auto-dismiss toasts

## Avatars

- Square. 1px hairline border.
- With photo: object-fit cover.
- Without photo: sage background, initials in Fraunces italic 500, 60% of the avatar height, ink color.
- Sizes: 24px (inline), 32px (table cell), 48px (card), 64px (profile header), 96px (profile page).
