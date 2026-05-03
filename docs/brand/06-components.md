# 06 — Tierra: Components

Component patterns that recur across product and marketing. These are not React component specs — those live with the implementation. They are the visual rules a designer or engineer should match when building any of these elements, in any framework.

> **Inferred:** Variants below derive from the conventions in [02-color.md](02-color.md), [03-typography.md](03-typography.md), and [04-spacing-layout.md](04-spacing-layout.md). They map onto the daisyUI `tierra-light` / `tierra-dark` themes shipped in [`apps/web/src/app/themes/`](../../apps/web/src/app/themes/); when a component spec disagrees with the theme, the theme wins and this doc updates.

## Buttons

Three button variants. No more. All inherit daisyUI's `--radius-field: 9999px` (pill), `--size-field: 0.30rem`.

### Primary — `btn btn-primary`

The page-level CTA. One per visible viewport.

- Background: `primary` (olive)
- Text: `primary-content`, Inter 14px, weight 500
- Padding: 14px vertical / 24px horizontal
- Border-radius: pill (`--radius-field: 9999px`)
- Border: none on base surfaces; 1px `primary` on `neutral` / dark bands
- Hover: daisyUI default — `primary` darkened
- Active: further darkened (daisyUI default)
- Focus: 2px `accent` outline, 2px offset
- Icon (optional): leading, 16px, 8px gap to text
- Disabled: 40% opacity, no cursor change to "not-allowed" — just remove pointer events

### Secondary — ghost (`btn btn-ghost` or `btn btn-outline`)

Used alongside primary, or as the page CTA when primary is taken.

- Background: transparent
- Text: `base-content`, Inter 14px, weight 500
- Border: 1px solid `var(--border-strong)` (`base-content` @ 24%)
- Padding: 13px / 23px (1px reserved for the border so total height matches primary)
- Hover: background shifts to `base-200`
- Focus: same as primary (`accent` outline)

### Accent — `btn btn-accent`

Reserved for the single loudest action on the marketing site (e.g., the hero CTA on the dark band). Never used in product UI.

- Background: `accent` (gold)
- Text: `accent-content`, Inter 14px, weight 600
- Padding: 14px / 24px
- Hover: daisyUI default — `accent` darkened (~10%)
- Focus: 2px `neutral` outline, 2px offset

### Sizes

- `sm` (`btn-sm`): 32px height, 12px / 16px padding, 13px text
- `md` (default): 44px height, 14px / 24px padding, 14px text
- `lg` (`btn-lg`): 52px height, 16px / 28px padding, 15px text — marketing only

### Anti-patterns

- Don't override `--radius-field` per-button. Pill is the brand.
- No gradient buttons.
- No icon-only square buttons in marketing — pair with text.
- No more than one primary button visible at a time.
- Use `white-space: nowrap` on button text so multi-word labels (`Find work today`, `Hire a verified crew`) never wrap to two lines inside a flex container.

## Cards

Cards are the product's primary container. The default product card uses hairline lift only; elevated/marketing variants use shadow.

- Background: `base-100` (default daisyUI `.card`). On a `base-100` band, lift via hairline border alone, or place over a `base-200` / `base-300` band so tone differential does the lifting work.
- Border: 1px hairline (`--border-hairline`)
- Border-radius: `--radius-box` (`1rem`, daisyUI default). Inner cards within a card (KPI tiles inside a dashboard region) may use the Paper `--r-md` (14px) for a tighter inner curve.
- Padding: 24px (desktop), 20px (mobile)
- Shadow: **none** on default product cards (dashboard tiles, list items, table-style cards). Elevated marketing/feature cards use `--shadow-card`. See [04-spacing-layout.md § Borders, dividers, and elevation](04-spacing-layout.md).
- Internal type: title (Inter 24px weight 600, line-height 1.20, tracking -0.015em), body (Inter 16px line-height 1.55), eyebrow above title — see [03-typography.md § Eyebrow / label variants](03-typography.md).
- Internal stack: eyebrow → title → body → metadata strip (middot-delimited)

A card with an internal CTA places the CTA bottom-right or bottom-full-width depending on density. For grids of cards with bottom-CTA rows, the CTA must be **baseline-aligned across all cards in the row**: ensure card heights are stretched to equal in the grid (via `grid-template-rows: 1fr` or `align-items: stretch`) and push the CTA with `margin-top: auto`.

### Hero feature cards (dark variant)

A signature pattern on dashboards and marketing — a feature card sitting on a dark surface (`bg-neutral`) or olive surface (`bg-primary`) with an ambient gold radial gradient overlay carrying visual weight. The Worker Dashboard `UpNextShift` and `PaycheckCard` are canonical examples.

- Background: `bg-neutral` (warm near-black) or `bg-primary` (olive)
- Border: none (the dark/olive background separates from the page)
- Border-radius: `--radius-box` (1rem) or Paper `--r-lg` (22px) for larger composition
- Padding: 24px (desktop)
- Ambient overlay: `radial-gradient(ellipse 60% 100% at 100% 0%, color-mix(in oklab, var(--color-accent) 28%, transparent), transparent 60%)` — gold radial pinned top-right, fades to transparent. Use `var(--color-accent)`, never a hardcoded hex.
- Internal type: eyebrow in `accent` (gold) or `accent` at higher opacity, title in `neutral-content` weight 500–600, body in `neutral-content` at ~75% opacity
- Internal CTA: an accent-fill button (`bg-accent text-accent-content`) is the canonical primary action. Secondary actions are ghost buttons with `1px rgba(255,255,255,0.25)` borders.

These cards exist for the one or two genuinely "look at this" moments per page (the next shift, the paycheck preview). Don't multiply them — when everything is a hero card, nothing is.

## Badges & chips

Three distinct elements:

- **Badge**: small status indicator, `base-300` background by default.
- **Chip**: a tag-style token (skills, counties, crops), `base-100` background with hairline border, `--radius-selector` (slightly rounded).
- **Filter chip**: a pill-shaped, toggleable filter selector — used in horizontal filter rows ("All · Within 25 mi · This week · Pays >$22"). Pill-shaped (`--radius-field`), distinct from `.chip` and from `.tabs` (see Navigation patterns).

### Badge

- Background: `base-300` (default `badge`)
- Text: `base-content`, Inter 11px uppercase, weight 600, 0.18em tracking — same pattern as eyebrow labels
- Padding: 4px 8px (theme-default `--radius-selector` applies)
- Variants for status:
  - `info` — `bg-info text-info-content`
  - `success` — `bg-success text-success-content`
  - `warning` — `bg-warning text-warning-content` (uses `accent`/gold in light theme)
  - `error` — `bg-error text-error-content`

### Chip

- Background: `base-100`
- Border: 1px hairline
- Text: `base-content`, Inter 13px, weight 500
- Padding: 6px 10px
- Border-radius: theme-default `--radius-selector` (`0.5rem`)
- Selected state: `bg-base-300`, hairline becomes 1px `base-content`

### Filter chip

Pill-shaped toggleable selectors used in horizontal filter rows above lists (job results, application stage filters, training category filters). Distinct from the tag-style `.chip` (which is rectangular-ish and identifies a token) and from `.tabs` (which switch entire panels).

- Background (default): `bg-base-100`, 1px hairline border
- Background (active): `bg-neutral text-neutral-content`, no border
- Text: `base-content` (default) / `neutral-content` (active), Inter 12px weight 600
- Padding: 6px 12px
- Border-radius: `--radius-field` (pill)
- Spacing in a row: 6px gap, horizontal scroll on mobile if the row overflows
- Touch target: still ≥44×44 — the visible chip is smaller, but the tap target extends via vertical padding on the parent row

Example: `All · Within 25 mi · This week · Pays >$22` above a job list. The active filter is the dark-pill state; inactive filters are the white-pill state.

## Inputs

Inputs use the daisyUI `fieldset` pattern (one fieldset per input — see [`apps/CLAUDE.md`](../../apps/CLAUDE.md)). The field shell is the daisyUI default pill (`--radius-field: 9999px`).

```tsx
<fieldset className="fieldset">
  <legend className="fieldset-legend">Page title</legend>
  <input type="text" className="input" placeholder="My awesome page" />
  <p className="label">You can edit page title later on from settings</p>
</fieldset>
```

- Container: `bg-base-100` (default daisyUI `.input`)
- Border: 1px theme default; on `base-100` page, hairline contrasts via `base-content` @ 12%
- Border-radius: `--radius-field` (`9999px`, pill)
- Padding: theme-default; vertical sized by `--size-field` (`0.30rem`)
- Text: `base-content`, Inter 16px (mobile keyboards trigger zoom below 16px on iOS — never go smaller than 16px on input text)
- Legend (`fieldset-legend`): 13px Inter, weight 500, `base-content` @ ~80%
- Helper text (`p.label` inside the fieldset): 13px Inter, `base-content` @ ~60%
- Error text: 13px Inter, `error` color, replaces helper

### Specific input types

- **Text / email / tel**: as above.
- **Number / money**: as above; the value display uses Inter with `font-variant-numeric: tabular-nums slashed-zero`.
- **Select**: same shell; chevron icon on the right (12px, `base-content`).
- **Checkbox**: 18px square, 1px `base-content` border, `primary` fill on check, `primary-content` checkmark. Theme `--radius-selector` (`0.5rem`).
- **Radio**: 18px circle, 1px `base-content` border, `primary` dot on select.
- **Toggle**: 36×20px pill. Off: `base-200` with hairline border. On: `primary`.
- **Textarea**: 1px hairline border on all four sides (a textarea is large enough that all-sides border reads as "container" not "boxy input"), 12px padding, vertical resize only.

## Tables

- Header row: `bg-base-200` background, label-style text (11px uppercase 0.18em, `base-content` @ 60%)
- Body rows: `bg-base-100` background, body text (14px Inter; numeric columns use Inter `tabular-nums slashed-zero`)
- Row separator: hairline rule between rows; no vertical column rules
- Row padding: 12px vertical / 16px horizontal
- Numeric alignment: right; tabular-nums always
- Hover state on a clickable row: `bg-base-200` (same as the header — this is intentional)
- Empty state: a single row, `bg-base-200`, Inter regular, "No results — try a different filter."

Tables on mobile collapse to card rows, not horizontally scrolled tables. Each card uses the label/value pair pattern (label above value).

## Section headers

A signature Tierra pattern. Three pieces stacked, top-aligned to the section.

```
LABEL                 ← eyebrow, Inter 11px UPPER 0.18em base-content @ 60% (used sparingly, not on every section)
Headline              ← Inter, weight 600–700, tracking -0.02em. Hero: 56–72px. Section: 32–48px.
Optional description  ← Inter 16px base-content, max-width ~640px
```

Spacing: 8px between label and headline, 16px between headline and description, 32–48px between description and the section content below.

## Header (top nav)

- Height: 72px (desktop), 64px (mobile)
- Background: `base-200` (chrome) with a hairline bottom border
- Logo: left
- Nav links: center on desktop, hidden behind a square menu icon on mobile
- Right: language toggle (`EN · ES` with the active one in `primary`, the inactive in `base-content` @ 60%) and primary CTA (ghost button)
- On scroll: stays `base-200` — no color shift, no shadow. The hairline bottom is always visible.

## Footer

- Background: `neutral`
- Text: `neutral-content` (body) and `neutral-content` @ 64% (secondary)
- Layout: four columns desktop (Brand, Product, Resources, Legal), one column mobile
- Links: `neutral-content`, hover underline, no color change
- Bottom strip: `neutral-content` @ 64%, 13px, with copyright, language toggle, and a single `primary` CTA on `neutral` aligned right

## Navigation patterns

- **Tabs**: `bg-base-100` or `bg-base-200`, `base-content` text, 2px `primary` underline on the active tab, hairline rule under the tab strip. No pills.
- **Breadcrumbs**: middot-delimited, `base-content` @ 60% for all but the last segment which is full `base-content`. `Jobs · Pisca de uva · Detalles`
- **Pagination**: prev/next text links with chevrons; numbered pages in Inter `tabular-nums`, the active page underlined with 2px `primary`. No square page tiles.

## Modals

- Backdrop: `neutral` @ 60%
- Container: `bg-base-100`, hairline border, `--radius-box` (`1rem`), max-width 560px (default)
- Padding: 32px
- Shadow: `--shadow-pop` for the lift off the backdrop
- Close button: top-right, 24×24 hit target, an `×` glyph in `base-content` (FontAwesome `xmark` per [07-imagery.md](07-imagery.md))
- Header: title (Inter 24px weight 600), optional eyebrow above
- Body: Inter 16px
- Footer: ghost (left) and primary (right) buttons, right-aligned

## Toasts

- Position: bottom-right desktop, top mobile
- Background: `neutral` (default); success/info/warning/error use the daisyUI semantic background tokens
- Text: `neutral-content` (or contrast-pair for semantic variants)
- Width: 400px max, single-line preferred
- Auto-dismiss: 5s for info/success; never auto-dismiss for error
- Icon: leading, 16px FontAwesome (per-icon import from `@fortawesome/free-solid-svg-icons`)
- Close button: trailing, optional, never present on auto-dismiss toasts

## Avatars

- Circle (`border-radius: 50%`). 1px hairline border on photo avatars.
- With photo: `object-fit: cover`.
- Without photo: solid `bg-primary` (olive) with `primary-content` text, OR `bg-base-200` / `bg-base-300` with `base-content` text — pick one per surface and stay consistent. Initials in Inter weight 600 or 700, 40–45% of the avatar height (e.g., 13px on a 32px avatar, 18px on a 48px).
- Initials are 1–2 characters, derived from the user's name. Two letters preferred when both first and last name are known (`Miguel Reyes` → `MR`).
- Sizes: 24px (inline), 28px (message thread), 32px (table cell), 36px (sidebar profile), 48px (card), 64px (profile header), 96px (profile page).
