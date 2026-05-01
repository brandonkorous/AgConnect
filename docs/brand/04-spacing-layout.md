# 04 — Tierra: Spacing & Layout

Tierra is rectangular, generous, and rhythmic. The system is built so that a designer who only knows the spacing scale, the section rhythm, and the no-rounded-corners rule can produce on-brand layouts without further reference.

## Spacing scale

Base unit is **4px**. The scale is a deliberate subset — designers should not use values outside this scale unless an exception is documented.

| token | px | use |
|---|---|---|
| `space-0` | 0 | flush |
| `space-1` | 4 | hairline gap, icon-to-text in tight chips |
| `space-2` | 8 | label-to-input, input internal padding (vertical) |
| `space-3` | 12 | row gutter in tight tables |
| `space-4` | 16 | default content gap (paragraph spacing, form rows) |
| `space-5` | 20 | card internal padding (mobile) |
| `space-6` | 24 | card internal padding (desktop), button vertical |
| `space-8` | 32 | between cards in a list, section subhead-to-content |
| `space-10` | 40 | between paragraphs and adjacent media |
| `space-12` | 48 | between minor sections within a page region |
| `space-16` | 64 | between major sections (mobile) |
| `space-20` | 80 | between major sections (tablet) |
| `space-24` | 96 | between major sections (desktop) |
| `space-32` | 128 | top/bottom of hero on marketing |

> **Inferred:** The scale above codifies the values used in the Tierra landing-page artboard. Production code may want to expose these as Tailwind extensions (`spacing.18`, `spacing.20`, etc.) that map to these multiples of 4px.

## Section rhythm

The Tierra landing page alternates surface treatments. This rhythm is part of the brand and should be preserved on long-form marketing pages.

1. **`base-100` band** — default page surface. Most content sections.
2. **`base-200` band** — used for content that should feel "set apart" — testimonials, audience splits, pricing.
3. **`base-300` band** — deeper set-apart, or product-shaped sections embedded in marketing.
4. **Dark band** — `bg-neutral` or `bg-primary`, used at most twice per page — the deep stop, used for a manifesto block or a footer-adjacent CTA. Inverse text (`neutral-content` / `primary-content`).

The rule of thumb: **never run two dark bands consecutively, and never end a page on a dark band before the footer.** Light-tone transitions provide the breathing room between content shifts.

Section vertical padding:

- Light-tone transition (`base-100` ↔ `base-100`, `base-100` ↔ `base-200`, etc.): `space-24` top/bottom (96px desktop) — the tone shift does the visual separation work
- Light → dark: `space-24` top, `space-32` bottom on the dark side (dark bands need a little more interior breathing room)
- Dark → next: `space-24` top on the next band

## Container widths

| breakpoint | content max-width | gutter |
|---|---|---|
| mobile (<640px) | 100% | 20px each side |
| tablet (640–1023px) | 100% | 32px each side |
| desktop (≥1024px) | 1200px content / 1280px outer | 40px each side |
| wide (≥1440px) | 1280px content / 1440px outer | 80px each side |

> **Inferred:** Container widths above match the 1440px Tierra landing-page artboard. If the design moves to 1536px or 1600px ultra-wide layouts later, the content max-width should NOT grow past 1280px — Tierra's text columns are deliberately narrower than their container so reading length stays in the 65–75 character ideal.

## Grid

- **Desktop**: 12 columns, 24px gutter.
- **Tablet**: 8 columns, 20px gutter.
- **Mobile**: 4 columns, 16px gutter.

Grid is for layout, not for ornament — Tierra never visualizes the grid (no column lines, no rule overlays). The grid's job is to align repeated rows and to keep columnar content (job cards, training cards, pricing features) in vertical lanes.

For repeated rows: use fixed-width slots for icons and trailing actions (`flex-shrink: 0`); do not rely on `gap` alone to align columns across rows. This is the rule that prevents the "every card has its leading icon at a slightly different x-coordinate" problem.

## Border radius

**Zero, almost everywhere.** Tierra is rectangular. The brand's only legitimate use of border-radius is the device frame in marketing screenshots, where the radius is the actual radius of the device being depicted.

```css
:root {
  --radius-none: 0;
  --radius-device: 36px; /* iPhone 15 Pro */
}
```

Forbidden:

- `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full` on buttons, cards, badges, inputs, modals.
- Rounded avatar circles. Tierra avatars are square with a `base-200` or `base-300` background; if no photo is available, use the person's initials in Fraunces upright over that surface.

Permitted:

- Marketing-only device frames at the verified device radius.
- Logo curve (when the logo lands; see `09-logo.md`).

## Borders and dividers

Tierra uses hairline rules in place of shadows.

```css
:root {
  --border-hairline: 1px solid color-mix(in oklab, var(--color-base-content) 12%, transparent);
  --border-strong:   1px solid color-mix(in oklab, var(--color-base-content) 24%, transparent);
  --border-on-dark:  1px solid color-mix(in oklab, var(--color-neutral-content) 14%, transparent);
}
```

- **Card borders**: `--border-hairline` on base surfaces; `--border-on-dark` on `neutral` / `primary` bands.
- **Input bottom borders**: `--border-strong`. See [06-components.md](06-components.md).
- **Section dividers**: `--border-hairline`, full width, no margin top/bottom — they sit flush at the section edge.
- **Table rules**: `--border-hairline` between rows; no vertical rules.

No drop shadows, no `box-shadow`, no inset shadows. The exception is that focus rings (see [08-accessibility.md](08-accessibility.md)) use a 2px outline; that is an outline, not a shadow.

## Z-axis

Tierra is a flat brand. The z-axis exists only for:

- Modal overlays (one layer above content)
- Toasts (one layer above modal)
- The header on scroll (one layer above content)

There is no card-elevation system, no hover-lifts, no shadow ramps. If a UI demands separation, use the base scale (e.g., `base-100` lifted off `base-300`) or a hairline border, not elevation.

## Motion

Motion is for state change, never decoration. See [08-accessibility.md](08-accessibility.md) for `prefers-reduced-motion` handling.

| event | duration | easing |
|---|---|---|
| state change (hover, active) | 120ms | `ease-out` |
| in-page transition (tab change, accordion) | 200ms | `cubic-bezier(0.2, 0, 0, 1)` |
| modal open / close | 240ms | `cubic-bezier(0.2, 0, 0, 1)` |
| route transition | 320ms (fade only) | `linear` |

Forbidden: bounce, elastic, spring physics, scale-up entrance animations, parallax scrolling, scroll-jacking. Tierra's motion is short and decisive, never playful.
