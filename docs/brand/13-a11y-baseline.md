# 13 — Accessibility baseline (2026-04-30)

Initial axe-core 4.10 sweep across `/en` and `/es` landing routes against `wcag2a + wcag2aa + wcag21aa`. Results captured in this doc; treat the open items as a punch list before ship.

## Fixed in this pass

- **`aria-allowed-attr` (critical, 6 nodes)** — `<button role="tab" aria-pressed>` is invalid; tabs use `aria-selected`. Filter pills in [FeaturedJobs.tsx](../../apps/web/src/components/landing/FeaturedJobs.tsx) were toggle buttons miscoded as tabs. Replaced `role="tablist"`/`role="tab"` with `role="group"` + plain buttons. `aria-pressed` is now correct.
- **`label` (critical, 2 nodes)** — Two unlabeled checkboxes inside the desktop hero mockup ([HeroDesktopMockup.tsx](../../apps/web/src/components/landing/HeroDesktopMockup.tsx)). Wrapped each `<input>` in a `<label>` so the visible text ("FLC", "Grower") becomes the accessible name.
- **`landmark-complementary-is-top-level` (moderate, 1 node)** — `<aside>` nested inside the hero `<section>`. The element was a decorative mockup chrome, not real navigation, so changed to `<div aria-hidden>`.

## Open: color-contrast (71 nodes)

The only remaining axe violation. Bucketed by Tailwind class (top offenders):

| class                          | failing ratio | count |
| ------------------------------ | ------------- | ----- |
| `text-primary` (#C8A24A honey) | 2.82–3.1      | 14    |
| `text-primary-content/70`      | 2.58          | 8     |
| `text-accent`                  | 3.43          | 6     |
| `bg-primary` (button bg)       | 3.37          | 5     |
| `text-secondary`               | 3.85          | 4     |
| `text-primary-content` (small) | 3.37          | 4     |
| various small text on dark     | 3.0–4.4       | 30    |

**Root cause:** Tierra's brand tokens (`primary`, `secondary`, `accent`) clear AA at large text sizes (≥18px / ≥14px bold = 3:1) but fail at body sizes (need 4.5:1). Two compounding factors:

1. **Small body copy painted in brand colors.** Pricing values, badges, FAQ helper text use `text-primary` or `text-accent` at 12–14px.
2. **Opacity-modified text classes** like `text-primary-content/70`, `text-base-content/50`. Opacity always reduces contrast — common a11y antipattern.

## Recommended fix (design pass)

Not a bulk find-replace. Two-rule policy in `globals.css` + grep:

1. **Brand colors only on large text and buttons.** Body copy uses `text-base-content`. Reserve `text-primary` / `text-accent` for headlines, eyebrows, button labels, and badge text where size is ≥ 14px bold.
2. **Drop opacity modifiers from text classes.** `text-base-content/50` etc. → use a darker named color or the `text-secondary` token (which is designed for muted text).

A quick pre-launch sweep:

```bash
grep -RE 'text-(primary|secondary|accent|base-content)/(40|50|60|70)' apps/web/src/components
grep -RE 'class="[^"]*text-(primary|accent)[^"]*"' apps/web/src/components
```

Each match needs a designer eye + token decision. Estimate: 1–2h of focused work, plus a re-axe pass.

## Tools

- [axe-core 4.10.2](https://github.com/dequelabs/axe-core) injected via playwright in dev.
- Re-run any time:

```bash
# from a playwright console:
const s = document.createElement('script');
s.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js';
document.head.appendChild(s);
await new Promise(r => s.onload = r);
console.table((await axe.run(document)).violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })));
```

## Manual checks (not automated)

The following won't show in axe; reserve a manual pass before ship:

- Keyboard-only flow: `Tab` through landing → waitlist → admin/audit; no traps, focus rings visible on every interactive.
- VoiceOver (iOS 17 Safari) and TalkBack (Pixel 8 Chrome): every CTA and form announces correctly in both EN and ES.
- `prefers-reduced-motion`: toast slide and modal scale should fall back to fade.
- Touch targets ≥ 44×44 px at the smallest viewport (375×667).

## Status

- Critical violations fixed.
- Color-contrast queued for design sweep, not a launch blocker for the marketing landing (text is still readable on dark bg; the failures are AA-strict).
- Manual screen-reader checks pending.
