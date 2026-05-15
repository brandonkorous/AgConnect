# Tierra — Brand System

Tierra is the visual and verbal identity for AGCONN. Spanish for "earth / land," it positions AGCONN not as gig-tech but as a serious, dignified workforce platform built for the long arc of agricultural work in California's Central Valley.

This folder is the source of truth for design and copy decisions. Implementations (Tailwind config, daisyUI theme, React components, marketing site, certificates, SMS templates) should derive from these files. When this folder and a running implementation disagree, this folder wins — open an issue, then fix the code.

The logo specification is intentionally not in this folder yet; it is being developed separately and will land as `09-logo.md` once finalized.

## Files

| file                                         | content                                                                      |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| [01-overview.md](01-overview.md)             | brand philosophy, archetype, positioning, what we are and are not            |
| [02-color.md](02-color.md)                   | palette, semantic roles, daisyUI 5 token map, Tailwind config, pairing rules |
| [03-typography.md](03-typography.md)         | Inter (single family) + JetBrains Mono for code identifiers, type scale, label convention |
| [04-spacing-layout.md](04-spacing-layout.md) | spacing scale, section rhythm, grid, radius scale, dividers, motion          |
| [05-voice-tone.md](05-voice-tone.md)         | bilingual EN/ES voice, copy patterns, formatting, glossary                   |
| [06-components.md](06-components.md)         | buttons, cards, hero feature cards, filter chips, badges, inputs, tables, header/footer |
| [07-imagery.md](07-imagery.md)               | photography direction, illustration approach, FontAwesome iconography        |
| [08-accessibility.md](08-accessibility.md)   | contrast verification, focus, motion, touch targets                          |
| [13-a11y-baseline.md](13-a11y-baseline.md)   | initial axe-core sweep findings (2026-04-30) — historical                    |

## Conventions

- Decisions extrapolated beyond what was set during the brand-kit and landing-page sessions are marked with `> **Inferred:**` callouts. Override freely.
- Hex values are canonical. RGB and OKLCH equivalents in [02-color.md](02-color.md) are derived; if they drift, the hex is the source of truth.
- Tierra's identity is **restraint**. When in doubt: less color, more space, smaller type, fewer rules.
