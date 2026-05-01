# 08 — Tierra: Accessibility

The brand promise is dignity. Accessibility is the operational version of that promise. AgConn targets users on older Android devices, with intermittent connectivity, in two languages, sometimes wearing field gloves. Tierra's accessibility floor is therefore not "WCAG 2.1 AA" alone — it includes ergonomics for the actual use context.

## Standards we conform to

- **WCAG 2.1 AA** — minimum, on every public surface.
- **WCAG 2.1 AAA** for body text contrast where the palette permits (Tierra's body pairings already exceed AAA — see [02-color.md](02-color.md)).
- **Section 508** — required for any surface presented to federal/state grant funders (admin reports, funder dashboards).
- **WAI-ARIA Authoring Practices** for interactive widgets (modals, tabs, comboboxes).

## Color & contrast

- Primary body pairings (`base-content` on `base-100` / `base-200` / `base-300`, `primary-content` on `primary`, `neutral-content` on `neutral`) are the verified pairings — run any new combination through a checker before shipping. See [02-color.md](02-color.md).
- **`accent` (gold) is not a body-text color** on base surfaces. Its contrast on light cream is too low for body — treat `accent` as a fill color and a large-display color, not a body color. On `neutral` (dark) it clears AA only for large text (≥18px or ≥14px bold).
- **Never communicate state with color alone.** Errors take an icon and a text label, not red color alone. Success states take a check and the word "Saved" / "Guardado", not green alone.
- Status colors (`info`, `success`, `warning`, `error`) must always be paired with their semantic icon: info circle, check, triangle, x-circle. Lucide names: `info`, `check`, `triangle-alert`, `circle-x`.
- Charts use position, label, and pattern — not color alone — to distinguish series. See [07-imagery.md § Charts](07-imagery.md).

## Typography accessibility

- **No text below 14px** on screen, ever. Eyebrow labels at 11px are the documented exception and must never carry essential meaning that does not also appear in adjacent text (a label is decorative-categorical, never the only place a fact appears).
- **No text below 16px on form inputs** — iOS auto-zooms inputs below 16px, which breaks the layout and the sense of control.
- **Line length** for body paragraphs: 65–75 characters. Tierra's container widths in [04-spacing-layout.md](04-spacing-layout.md) yield this naturally; do not let long-form copy expand to the full container.
- **Line height** at body sizes is 1.5+ (Inter body is 1.55). At display sizes Fraunces drops as low as 0.95 — that is a display-only allowance, not a license to crunch body type.
- **Italic is reserved for emphasis only.** It costs about 5% legibility, so use it for short emphasis runs (1–4 words) in body — a quoted phrase, a place name, a single emphasized word — never for entire paragraphs and never as a display-headline treatment. Display-size italic Fraunces is out of brand (see [03-typography.md](03-typography.md)).

## Focus

Focus indicators are visible, generous, and brand-aligned.

```css
:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
}

/* On accent backgrounds, swap to neutral to maintain contrast. */
.bg-accent :focus-visible {
    outline-color: var(--color-neutral);
}
```

- **Never remove focus outlines.** If a designer asks to "clean up" the focus ring, the answer is no — propose a different ring color or shape, not its removal.
- **Default browser focus is not enough.** Implement `:focus-visible` styles for every interactive element including custom widgets (dropdowns, comboboxes, modal close buttons, language toggle).
- **Skip links**: every page ships a "Skip to main content" / "Saltar al contenido principal" link as the first focusable element. Visible only on focus.

## Touch targets

- **Minimum 44×44 CSS pixels** for any interactive element on touch devices. Buttons in this brand are 44px tall by default specifically to meet this floor.
- Inline links inside paragraphs: padding-y 4px to expand the touch target without disturbing line height; treat the link itself as still 44px-tappable in practice via the surrounding line height (1.55 × 16 = 24.8px line height + 4px padding ≈ tap-friendly enough; if a link is critical and tappable on mobile, consider promoting it to a button).
- **Icon-only buttons**: the icon may be 16–24px but the button hit area is always ≥44×44.

## Keyboard navigation

- All interactive elements are reachable via Tab, in a logical order matching the visual reading order.
- Modal traps focus inside the modal until dismissed; closing returns focus to the element that opened it.
- Tabs and listboxes follow WAI-ARIA arrow-key navigation patterns (Left/Right for horizontal tabs, Up/Down for vertical lists).
- Custom select / combobox: implement [ARIA combobox 1.2 pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) — `role="combobox"`, listbox via `aria-controls`, active option via `aria-activedescendant`. Don't reinvent.

## Motion

- Honor `prefers-reduced-motion: reduce` everywhere. Replace transition durations with 0 and disable any non-essential animation.

```css
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}
```

- No parallax, no scroll-jacking, no auto-rotating carousels — these violate the spirit of `prefers-reduced-motion` even if you toggle them off when the preference is set.
- Loading states: prefer a static "Loading…" / "Cargando…" message with a small Lucide `loader` spun via CSS rotation to a multi-step progress animation. The spinner is honored by `prefers-reduced-motion`.

## Screen reader semantics

- Use semantic HTML. `<button>` not `<div role="button">`. `<nav>`, `<main>`, `<header>`, `<footer>` for landmarks.
- Every page has exactly one `<h1>`. Section titles are `<h2>`; subsections `<h3>`. Don't skip levels.
- Form inputs are wired to their label via `<label for>` or by wrapping. Eyebrow-style floating labels MUST be backed by a real `<label>` element — visual position is not a substitute for the input/label association.
- Lucide icons: when an icon is decorative (paired with text that conveys the meaning), set `aria-hidden="true"`. When an icon stands alone (icon-only button), provide an `aria-label` and a visible `title` on hover.
- Status messages (toasts, inline form errors) use `role="status"` (polite) for confirmations and `role="alert"` (assertive) for errors.
- Live regions for async content updates (`aria-live="polite"` on a results container).

## Bilingual accessibility

- Set `lang` on `<html>` and update on every locale switch (`<html lang="en">` ↔ `<html lang="es">`).
- For mixed-language passages within a page, mark the inline language with `<span lang="es">`. Screen readers will switch voices.
- Never mark Spanish content with English `lang`. Affects screen reader pronunciation badly.
- Language switcher: present both languages by name in their own script — `English · Español`. Active state in `primary`; inactive in `base-content` @ 60%. Click area ≥44×44.

## Forms

- Required fields are marked with both an asterisk and the word "(required)" / "(obligatorio)". Color alone is never the marker.
- Inline errors appear immediately below the input, in error color **with** the `triangle-alert` icon, **with** descriptive text. No "Invalid" by itself — say what's invalid and how to fix it.
- Error summary at the top of the form on submit failure, with anchor links to each errored field.
- Autocomplete: set `autocomplete="tel"`, `autocomplete="email"`, `autocomplete="postal-code"` etc. for every relevant field — many users depend on autofill, especially in a low-typing-comfort context.

## Connectivity & device floor

- **Performance budget**: First Contentful Paint < 1.5s on 3G; Largest Contentful Paint < 2.5s. Measured on a mid-tier Android emulating Slow 4G.
- **Total page weight** (marketing pages): under 600KB initial; product pages under 1MB initial.
- **Images**: lazy-load below the fold, responsive `srcset`, AVIF with WebP fallback.
- **Fonts**: subset to Latin + Spanish characters (`unicode-range`), preload only the brand-defining cuts.
- **Cache**: long-cache static assets (1 year, content-hashed); short-cache HTML; offline shell for the PWA per [`../00-foundation/`](../00-foundation/) infra notes.

## Testing checklist

For every new screen or marketing surface:

- [ ] All interactive elements reachable by Tab in visual order.
- [ ] Focus indicators visible on every interactive element.
- [ ] All form inputs have associated labels (`for` / wrapping).
- [ ] Error states present with icon + text, not color alone.
- [ ] All text passes WCAG AA contrast.
- [ ] No text below 14px (or 16px on inputs).
- [ ] All icons have appropriate `aria-hidden` or `aria-label`.
- [ ] Page has one `<h1>` and a sensible heading hierarchy.
- [ ] `<html lang>` set; inline `lang` on mixed-language passages.
- [ ] Honors `prefers-reduced-motion`.
- [ ] Touch targets ≥44×44.
- [ ] Skip-to-content link present and focusable.
- [ ] Tested with VoiceOver (macOS) and NVDA (Windows) in both EN and ES.
- [ ] Tested on a real mid-tier Android device, not just a desktop emulator.
