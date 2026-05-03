# 01 — Tierra: Overview

## Name

**Tierra** — Spanish for _earth_ or _land_. Chosen because:

- It is instantly recognized by the platform's primary Spanish-speaking audience without translation.
- It connects the brand directly to the work AgConn serves: cultivation of the land.
- It carries weight without aggression. Earth is patient, productive, generative. Those are the qualities of the platform.
- It avoids the connotations of words like _connect_, _hire_, _grow_, _match_, _link_ — all of which read as gig-economy or recruiter-software.

## Audience

Tierra is built to feel right for three audiences simultaneously, in this priority order:

1. **Farmworkers** (primary) — many monolingual Spanish, often on older Android devices, often skeptical of tech platforms that promised dignity and delivered surveillance. Tierra must feel calm and respectful before it impresses anyone.
2. **Employers** — Farm Labor Contractors, growers, packing-house operators. They need to trust this is professional infrastructure, not a side project. Tierra reads as the kind of tool a county ag commissioner's office would adopt.
3. **Funders and partners** — workforce boards, training providers, grant administrators. They need the platform to look credible enough to put on a federal report.

## Archetype

**Caregiver / Sage hybrid.**

- _Caregiver_: dignifies the user, reduces friction, never asks more than necessary, never traps anyone in a flow.
- _Sage_: knowledgeable, factual, restrained. Communicates with the authority of a county extension publication or an agricultural field guide, not the energy of a startup launch.

What Tierra is **not**: Hero, Outlaw, Magician, Jester. There is no "disruption" framing. No surprises.

## Positioning

> AgConn is the calm, bilingual workforce platform that treats farmworkers and the employers who hire them as professionals. Tierra is what that promise looks and sounds like.

Implications:

- Visuals lean civic-agricultural — closer to a UC Davis ag extension brochure, a CDFA program page, or a county-extension field guide than to a B2B brand magazine or any SaaS product.
- The product surface is generous with whitespace, and color is applied where it serves intent — drawing attention to actions, conveying state, marking hierarchy, providing ambient warmth on dark surfaces. Not as decoration.
- Typography does utilitarian work first and warm work second. Inter is the single typeface across display and body; italic is reserved for short emphasis runs, not signature.
- Motion is minimal. Static layouts that breathe will always beat animated ones that hustle.

## Voice principles

1. **Plain-spoken.** Sentence-level clarity over cleverness.
2. **Bilingual-first.** Every brand-facing string ships in EN and ES at the same time. ES is never a translation afterthought.
3. **Calm.** No exclamation marks, no all-caps shouting (UPPERCASE labels excepted, see [03-typography.md](03-typography.md)), no urgency theater.
4. **Specific.** Numbers, places, hours, dollars. "$19.50/hr in Fresno County, today" beats "Great pay, today!"
5. **Respectful.** Workers and employers are addressed as adults with jobs, not as users to be activated.
6. **Quiet pride.** When something good happens — a hire, a certificate earned — the celebration is small and deliberate. A check mark, a name, a date. Not confetti.

## What Tierra is not

A short list, because constraints are the brand:

- No neon green/CTAs-on-CTAs energy.
- No glass cards (glassmorphism on a content surface) and no overdone gradient meshes. Subtle `backdrop-filter` on sticky chrome (top bar) and ambient radial gradients on dark feature cards (`UpNextShift`, `PaycheckCard`) are part of the system — applied as ambient lighting, not as a gloss treatment.
- No dark-mode-by-default tech aesthetic. Tierra is a daytime brand. (A respectful dark theme exists; see [02-color.md](02-color.md).)
- Pill buttons (`--radius-field: 9999px`) and 1rem rounded cards (`--radius-box: 1rem`) are the signature curves. Avatars are circular. Smaller chrome (badges, checkboxes, inputs internal to a card) uses the half-rem selector radius. Don't introduce additional curve scales.
- No stock photography of smiling diverse coworkers in WeWork lighting. See [07-imagery.md](07-imagery.md).
- No emoji in product UI or marketing copy. Emoji is allowed in user-generated content (worker bios, employer notes); the brand itself doesn't use them.
- No "AI sparkle" iconography. AI assistance in the product is described in plain words.

## Signature gestures

Recurring details that, taken together, are recognizably Tierra:

- **Inter at display weights** (600–700, tightened tracking) for headlines — calm, not theatrical. Italic at any size is reserved for short emphasis runs (1–4 words inside a heading or body) — never the whole headline. The single-word italic accent inside a heading (`Buenas tardes, Miguel.`) is the canonical pattern.
- **The middot delimiter** (`·`) between metadata fragments: `Fresno · $19.50/hr · today`.
- **Eyebrow labels** — uppercase, 11px, 0.18em tracking — sitting above section titles. Used sparingly; not on every block. See [03-typography.md](03-typography.md) for the eyebrow variants.
- **Inter with `tabular-nums slashed-zero`** for money, dates, hours, stats, and inline figures at every size. JetBrains Mono is reserved for code-shaped identifiers (`WIOA-1B`, certificate hashes, `#APP-2031`) — never for money or dates.
- **Layered base surfaces** (`base-100` cards on `base-300` page, `base-200` chrome) with **hairline rules** as the default lift. Subtle elevation tokens (`--shadow-card`, `--shadow-pop`) are reserved for elevated marketing surfaces and dark feature cards — not the default product card.
- **`accent` (gold)** is the loud color in the system — used for primary CTAs, active step indicators, count badges, ambient lighting on dark feature cards, statistic highlights, and active states. Color is information: apply where it serves intent, not where it merely fills space.
- **Crop palette** — six categorical colors (grape, almond, citrus, tomato, lettuce, strawberry) for job-type chips and crop glyphs. See [02-color.md](02-color.md).

## Source material

This brand was developed alongside, and tested against, the AgConn product spec. The product North Star and audience definition come from [`../AgConn-Architecture-Kickoff.docx`](../AgConn-Architecture-Kickoff.docx). When this folder makes a brand claim, it should be consistent with the product the spec describes; if a brand decision conflicts with the product (e.g., "Tierra forbids X" but the product needs X), the product wins and this folder updates.
