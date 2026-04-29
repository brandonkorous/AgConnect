# 07 — Tierra: Imagery & Iconography

Tierra's image system carries the brand's promise that this platform is _for_ and _about_ real Central Valley work. Imagery is the most powerful place to either honor or undercut the rest of the brand.

## Photography direction

### Subject

- Real workers, real fields, real packing houses, real classrooms.
- Hands at work — pruning, tying, picking, washing, packing, loading.
- Faces only with explicit consent and ideally compensation. Prefer hands, backs of heads, environmental shots, tools in use over close-up smiling portraits.
- Where faces appear, they are working, listening, talking — not posing.

### Setting

- Central Valley California specifically: vineyard rows, almond orchards, citrus groves, table-grape canopies, lettuce ground crops, packing-house lines, classroom basements at training providers.
- Time of day: golden hour (early morning, late afternoon) for outdoor shots — matches the harvest-honey color note in the palette. Midday sun is permissible only for environmental wide shots; close-up midday harshness flattens skin tones and reads as utilitarian, not human.

### Tone and processing

- **Naturalistic**, not stylized. Preserve real skin tones — no orange-and-teal grade, no high-contrast crush, no Instagram filter.
- **Color-correct, not color-graded.** White balance for the time of day; let the bone palette emerge from the dust and the dry grass naturally.
- **Light retouching only.** Remove litter and dated logos; preserve dirt, callouses, sweat, sun damage. These are not flaws — they are the subject.
- **Wide aspect ratios** preferred — 16:9 or 21:9 for hero. Vertical 4:5 for cards. Avoid 1:1 except in avatar contexts.
- **Negative space** — frame so a 25–40% region of the image is sky, ground, or wall. Marketing copy lays into that space.

### Forbidden

- Stock photography of a multi-ethnic team in matching polos around a laptop.
- Drone "epic" shots of a single tractor in a perfectly geometric field, golden-hour sky, lens flare. (Once is fine; as a default it reads as defense-tech.)
- Hands-shaking-over-a-handshake-deal compositions.
- Smiling-into-the-distance "hopeful future" portraits.
- Heavy filters, especially:
    - Kodak Gold / Portra emulation pushed beyond subtle warmth.
    - Black-and-white that erases ethnicity from the frame.
    - Heavy vignettes.

### Logo and product treatment over photography

When marketing copy or the logo lands over a photograph:

- Land it on the photo's negative-space region.
- If the photo is busy where the copy needs to land, add a 60–80% bone overlay rectangle (rectangular, not faded). Tierra prefers a clean overlay rectangle to a gradient fade.
- Text on overlay rectangle is ink, never moss-on-bone (the contrast is fine but the rectangle reads as an editorial card, and editorial cards use ink).

## Illustration direction

Illustration is rare in the Tierra system. When it appears:

- **Botanical line art only.** Hairline strokes (1.25–1.5px), single-color, ink or moss.
- **Real species.** A grape leaf is a real grape leaf, drawn from reference. A generic leafy swirl is not.
- **Editorial scale.** Illustrations live at large sizes (occupying a section opener, a feature card divider) — not as 24×24 icons.
- **No fills.** Tierra illustrations are line drawings. The only acceptable "fill" is a sage rectangle behind the illustration as ground.
- **No mascots.** No anthropomorphic crops. No friendly tractor characters. No avatar of the brand itself.

> **Inferred:** A small library of botanical line drawings (table grape leaf and tendril, almond branch with bloom, citrus branch with leaves, lettuce head, tomato vine, dust-cloud horizon line) should be commissioned as the brand develops. Until that library exists, prefer photography or pure typographic compositions over generic vector illustration from a stock library.

## Iconography

### Library

- **[Lucide](https://lucide.dev)** is the primary icon set. Use the `lucide-react` package for product implementation.
- 1.5px stroke (Lucide's default).
- Default size: 16px in dense UI, 20px on buttons and labels, 24px in cards and section headers, 32–48px in feature blocks.

### Use rules

- Icons clarify, never decorate. If the icon and the label say the same thing, keep both only if the icon adds scanability (e.g., in a vertical list).
- Icons inherit text color (`currentColor`). Never multi-colored.
- Square containers around icons (when used as button glyphs) match the button's text color and have no background.
- Eyebrow labels do not take leading icons.

### Forbidden

- Material Icons (filled-style mismatches Lucide's stroke).
- FontAwesome (visual style mismatches the brand).
- Multi-colored icon sets, isometric icons, gradient icons.
- AI-sparkle icons. When the product has AI features (resume parser, search), describe them in plain words, not with a wand or a sparkle.

## Charts and data visualization

Reporting and dashboards (admin views, grant reports) need a data-viz language consistent with the brand.

### Color order for categorical series

When a chart needs to distinguish categories, use this ordered palette so the same category in different charts gets the same color:

1. moss (`#2D4030`)
2. honey (`#C8A24A`)
3. soil (`#5C4326`)
4. info (`#4A6B7C`) — only when categories exceed three
5. success (`#5A7842`) — only when categories exceed four
6. error (`#8B3A2F`) — last; saturated, draws eye

Beyond six categories: add hatching/pattern fills rather than a seventh color. Tierra prefers a chart with patterns to a chart with weak palette extensions.

### Single-metric highlight

When highlighting a single number on a chart (a peak, a target, a current period), use honey. The rest of the data is moss. This is the same "honey is the loud one-of-one color" rule from [02-color.md](02-color.md), applied to data.

### Axes and grids

- Axes: ink @ 24% (`--border-strong`), 1px.
- Gridlines: ink @ 8%, 1px, dashed.
- Tick labels: 11px Inter, soil.
- Numeric labels on data points: DM Mono 12px, ink.
- No 3D, no shadows, no glossy fills.

## Maps

Maps appear in worker job-discovery and employer crew-management views.

> **Inferred:** AgConn mapping is not yet specified. The brand-aligned recommendation is **Mapbox with a custom Tierra style**: bone ground, sage water/parks, ink labels at low contrast, moss for selected pins, honey for the active pin. Avoid the default Google Maps blue/red — it does not belong in the Tierra system. Confirm tile provider (Mapbox vs MapLibre + Maptiler vs OSM raster) when mapping work begins.

Pin styles:

- **Default**: 24×32 teardrop, moss fill, bone border.
- **Active**: 28×38 teardrop, honey fill, ink border.
- **Cluster**: square, sage fill, ink border, count in DM Mono.

## Marketing graphics

Hero compositions, blog headers, social images.

- **Composition**: editorial — wide image left, text-heavy right; or full-bleed image with bone overlay rectangle pinned bottom-left holding the headline.
- **Type over image**: always Fraunces italic for the hero phrase. Stay bone or ink, never honey.
- **Social-share images**: 1200×630, ink background with a single Fraunces italic phrase center-left, AgConn wordmark bottom-left, single botanical line illustration top-right. (When the wordmark and illustration land — see logo doc — replace the placeholder text mark currently used.)

## Examples to study, not to copy

For art-direction reference (do not duplicate compositions):

- _Modern Farmer_ magazine spreads.
- Patagonia field guide PDFs and the older Worn Wear print pieces.
- UC Davis ag extension service publications (the recent design refresh).
- _The MIT Press Reader_'s long-form image-with-eyebrow-label-overlay treatment.

These are reference points for _feel_, not template sources. A page that looks transparently modeled on any of these is doing too much.
