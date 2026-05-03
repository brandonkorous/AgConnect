# 04 — Tierra: Spacing & Layout

Tierra is generous, rhythmic, and uses two signature curves (pill buttons, 1rem cards) — the rest is square. The system is built so that a designer who knows the spacing scale, the section rhythm, and the radius scale can produce on-brand layouts without further reference.

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

**Canonical container — every page-width shell on every surface.** Marketing, product, admin, dashboard chrome, and full-bleed banners (consent, install prompt, offline) all use the same wrapper. Memorize the class string.

```tsx
<div className="container mx-auto px-5 py-24 md:px-8 lg:px-20 lg:py-30">…</div>
```

That's the only allowed page-width shell. **`max-w-7xl`, `max-w-6xl`, `max-w-5xl`, etc. on a page-level wrapper are anti-patterns** — they introduce a parallel scale, drift between surfaces, and bypass the responsive padding rhythm baked into the canonical shell.

What `container mx-auto` resolves to (Tailwind 4 default behavior, paired with our gutter classes):

| breakpoint | container cap | gutter (our `px-*`) | content (cap − 2·gutter) |
|---|---|---|---|
| mobile (<640px) | 100% | 20px (`px-5`) | viewport − 40px |
| tablet (640–767px) | 640px | 20px (`px-5`) | 600px |
| (768–1023px) | 768px | 32px (`md:px-8`) | 704px |
| desktop (1024–1279px) | 1024px | 80px (`lg:px-20`) | 864px |
| (1280–1535px) | 1280px | 80px (`lg:px-20`) | 1120px |
| wide (≥1536px) | 1536px | 80px (`lg:px-20`) | 1376px |

> **Inferred:** Tailwind 4's default `container` caps at 1536px (2xl) — wider than the 1280px content cap the original Tierra artboard called for. We accept the 1376px content width on ≥1536px viewports because it remains within Tierra's grid rhythm and avoids customizing the `container` utility per project. Long-form prose inside the container should still cap at `max-w-prose` (~65ch) — the container shell is page width, not reading width.

## One responsive codebase — not a separate mobile site

AgConn is **one fully responsive codebase**, not two. There is no `m.agconn.com`, no `mobile/` directory, no separate mobile-only deploy. Every public surface uses the responsive type scale ([brand/03-typography.md](03-typography.md)), this spacing scale, and Tailwind's breakpoints (`sm`, `md`, `lg`, `xl`, `2xl`) to render correctly across mobile (≥360px), tablet (≥640px), desktop (≥1024px), and wide (≥1440px).

**Reading width vs. page width — they're different.** The "max-width 760px content" callouts that appear in some feature `04-ui.md` files (e.g., FAQ, article body) are **line-length caps for prose**, NOT page-width caps. Pages always use the canonical `container` shell above; narrow reading columns nest inside that bleed via `max-w-prose`, `max-w-2xl`, etc. on a child element — never on the page wrapper itself.

```tsx
// Wrong — page caps at 768px on a 2000px viewport (looks mobile-only)
<div className="mx-auto max-w-3xl px-5 py-24">…</div>

// Wrong — `max-w-7xl` is a parallel scale; drifts from the rest of the system
<div className="mx-auto max-w-7xl px-6 py-12">…</div>

// Right — full-bleed page via canonical container, narrow reading column nested
<section className="bg-base-100">
  <div className="container mx-auto px-5 py-24 md:px-8 lg:px-20 lg:py-30">
    <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)]">
      <header className="lg:sticky lg:top-8 lg:self-start">…eyebrow + headline…</header>
      <div className="max-w-prose">…long-form copy or accordion…</div>
    </div>
  </div>
</section>
```

Sticky chrome (consent banner, install prompt, offline banner) uses the same shell — the outer fixed-position wrapper handles the dock, the inner `container mx-auto px-5 md:px-8 lg:px-20` handles content alignment so the chrome aligns vertically with the page content above it.

**Worker Field Mode is the one exception, and it's not a marketing concern.** A separate one-handed in-field worker UX is on the roadmap (deferred per [project_field_mode.md](../../C:/Users/brand/.claude/projects/g--code--wizeworks-AgConnect/memory/project_field_mode.md) — surfaces as authenticated `/[locale]/worker/field` once observed, not a parallel marketing site). Public marketing pages stay as one responsive codebase.

## Grid

- **Desktop**: 12 columns, 24px gutter.
- **Tablet**: 8 columns, 20px gutter.
- **Mobile**: 4 columns, 16px gutter.

Grid is for layout, not for ornament — Tierra never visualizes the grid (no column lines, no rule overlays). The grid's job is to align repeated rows and to keep columnar content (job cards, training cards, pricing features) in vertical lanes.

For repeated rows: use fixed-width slots for icons and trailing actions (`flex-shrink: 0`); do not rely on `gap` alone to align columns across rows. This is the rule that prevents the "every card has its leading icon at a slightly different x-coordinate" problem.

## Border radius

Tierra's radius scale is small and intentional. Every shape resolves to one of these four tokens — don't introduce ad-hoc values.

```css
:root {
  --radius-none:     0;        /* dividers, table cells, photo crops */
  --radius-selector: 0.5rem;   /* checkboxes, radios, badges, small chrome */
  --radius-box:      1rem;     /* cards, modals, dropdowns, large containers */
  --radius-field:    9999px;   /* pill buttons, pill inputs, chips, count badges */
  --radius-device:   36px;     /* marketing-only — actual device frame radius */
}
```

The two signature curves are **pill** (`--radius-field`) and **1rem** (`--radius-box`). Pill is for things you act on (buttons, chips, count badges, search inputs); 1rem is for things you read (cards, modals, content containers). Selectors and inputs internal to a card use `--radius-selector`. Avatars are circular (`border-radius: 50%`).

The Paper design system uses a 4-step semantic radius alongside the daisyUI tokens for fine-grained chrome details:

| paper token | px | use |
|---|---|---|
| `--r-sm` | 8px  | small chips, internal pills, table-cell badges |
| `--r-md` | 14px | inner cards (KPI tiles, message rows) — slightly tighter than the daisyUI `--radius-box` |
| `--r-lg` | 22px | large hero cards (`UpNextShift`, `PaycheckCard`) |
| `--r-xl` | 32px | full-page modal sheets, marketing-feature blocks |

Production code uses the daisyUI tokens by default; the Paper 4-step is documented here as the design source of truth for elevated/marketing surfaces where the daisyUI default needs more scale.

Forbidden:

- Mixing in radii outside this scale (`rounded-3xl`, `rounded-2xl` ad-hoc).
- Square avatars. Avatars are circles.

## Borders, dividers, and elevation

Tierra uses hairline rules as the default lift; subtle shadow tokens are reserved for elevated surfaces (marketing feature cards, dark hero cards, modals).

```css
:root {
  --border-hairline: 1px solid color-mix(in oklab, var(--color-base-content) 12%, transparent);
  --border-strong:   1px solid color-mix(in oklab, var(--color-base-content) 24%, transparent);
  --border-on-dark:  1px solid color-mix(in oklab, var(--color-neutral-content) 14%, transparent);

  --shadow-card: 0 1px 2px rgba(28,28,26,0.04), 0 8px 24px -12px rgba(28,28,26,0.12);
  --shadow-pop:  0 12px 40px -16px rgba(28,28,26,0.25), 0 2px 6px rgba(28,28,26,0.05);
  --shadow-hi:   0 30px 80px -30px rgba(28,28,26,0.35);
}
```

- **Card borders**: `--border-hairline` on base surfaces; `--border-on-dark` on `neutral` / `primary` bands.
- **Input bottom borders**: `--border-strong`. See [06-components.md](06-components.md).
- **Section dividers**: `--border-hairline`, full width, no margin top/bottom — they sit flush at the section edge.
- **Table rules**: `--border-hairline` between rows; no vertical rules.
- **Default product cards** (dashboard tiles, list items, KPI tiles): hairline only, no shadow. The base-scale tone differential plus the hairline does the lifting.
- **Elevated marketing surfaces** (pricing-feature cards, audience-split tiles, hero composition cards): `--shadow-card`.
- **Modals, popovers, dropdowns lifted off cards**: `--shadow-pop`.
- **Hero / feature cards on dark surfaces** (`UpNextShift`, `PaycheckCard`): no shadow needed — the `bg-neutral` / `bg-primary` background already separates them, and an ambient gold radial gradient overlay carries the visual weight.

Focus rings (see [08-accessibility.md](08-accessibility.md)) use a 2px outline, not a shadow.

## Z-axis

The z-axis exists for:

- Elevated marketing/feature cards (one layer above the page band)
- Modal overlays (one layer above content)
- Toasts (one layer above modal)
- Sticky chrome — header on scroll, install prompt, consent banner (one layer above content; uses `backdrop-filter` for the chrome blur)

There is no general hover-lift or shadow ramp on product cards. If a UI demands separation in a list-of-cards context, use the base scale (e.g., `base-100` lifted off `base-300`) or a hairline border. Reserve elevation for surfaces whose *function* is to be elevated (a feature card on marketing, a hero card on a dashboard, a modal).

## Motion

Motion is for state change, never decoration. See [08-accessibility.md](08-accessibility.md) for `prefers-reduced-motion` handling.

| event | duration | easing |
|---|---|---|
| state change (hover, active) | 120ms | `ease-out` |
| in-page transition (tab change, accordion) | 200ms | `cubic-bezier(0.2, 0, 0, 1)` |
| modal open / close | 240ms | `cubic-bezier(0.2, 0, 0, 1)` |
| route transition | 320ms (fade only) | `linear` |

Forbidden: bounce, elastic, spring physics, scale-up entrance animations, parallax scrolling, scroll-jacking. Tierra's motion is short and decisive, never playful.

### Tokens

Tierra's motion is exposed as utility classes in [`apps/web/src/app/globals.css`](../../apps/web/src/app/globals.css). Use the named tier — never write the raw millisecond or cubic-bezier value at the call site, so the four-tier brand grammar stays intact.

| utility | resolves to | use for |
|---|---|---|
| `duration-state` | 120ms | hover, active, focus |
| `duration-transition` | 200ms | tab change, accordion, toast/banner entrance |
| `duration-modal` | 240ms | modal open/close, sheet/drawer |
| `duration-route` | 320ms | route transition (fade only) |
| `ease-tierra` | `cubic-bezier(0.2, 0, 0, 1)` | every non-state transition or animation |

`ease-tierra` comes from the `--ease-tierra` theme token (Tailwind 4 auto-namespace). The four `duration-*` tokens are defined as `@utility` blocks because Tailwind 4 doesn't auto-namespace `--duration-*`; each one sets both `transition-duration` and `animation-duration` so the same class works for CSS transitions and `tw-animate-css` keyframe animations.

### Animation utilities

We use [`tw-animate-css`](https://github.com/Wombosvideo/tw-animate-css) for utility-class motion. It's the Tailwind 4 successor to `tailwindcss-animate`, registered via `@import 'tw-animate-css';` in [`globals.css`](../../apps/web/src/app/globals.css) (no JS plugin entry needed).

```tsx
// Toast / banner entrance — in-page transition tier
<div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-transition motion-safe:ease-tierra">

// Modal open — modal tier
<div className="motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-modal motion-safe:ease-tierra">

// Route fade — route tier, no easing curve (linear per the table above)
<div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-route">
```

Every animation utility goes behind the `motion-safe:` variant so it disables under `prefers-reduced-motion: reduce`. This is non-negotiable — see [08-accessibility.md](08-accessibility.md).

**Allowed primitives:** `animate-in` / `animate-out`, `fade-in` / `fade-out`, `slide-in-from-{top,bottom,left,right}-{1..N}`, `zoom-in-{N}` / `zoom-out-{N}` (only at small ranges — 95–100, never the bouncy 50–150 range). Any of these compose freely.

**Forbidden** (the library ships them; we don't reach for them): `spin`, `bounce`, `pulse` for non-skeleton chrome, `slide-in` over more than ~12px (`slide-in-from-bottom-3` is the practical max), `zoom-in` below 90%, anything that overshoots and settles. The brand "no bounce, no elastic, no spring" rule means we use the *enter/exit + duration + easing* axes only.

For complex multi-step or scroll-triggered motion (a hero entrance staged across two beats, or sections that fade up as they enter the viewport), pair `tw-animate-css` utilities with an `IntersectionObserver` hook — don't reach for a runtime motion library unless a future spec genuinely requires choreography that pure CSS can't express.
