# 99 — Worker Field Mode (built)

> **Status:** built. The `/[locale]/field/*` shell is in production as of 2026-05-04 and being expanded. New surfaces (e.g. `/field/onboarding`) are landed under this prefix.

## Why this exists

AGCONN ships three application shells, each with a deliberate layout strategy ([brand/04-spacing-layout.md § Three shells, two layout strategies](../brand/04-spacing-layout.md#three-shells-two-layout-strategies)):

| Shell | Route | Strategy |
|---|---|---|
| Worker | `/[locale]/worker/*` | Fully responsive, fully featured |
| Employer | `/[locale]/employer/*` | Fully responsive, fully featured |
| **Field** | `/[locale]/field/*` | **Mobile-first, simplified** |

The dense, sidebar-driven Worker interface (Browse Jobs, Applications, Shifts, Pay, Training, Documents, Messages, Wallet, Profile) is designed for **planning** time — at home, on a laptop, on a tablet, or thumb-scrolling on a couch. It is responsive end-to-end and works on any viewport.

Field is the opposite ergonomic: a worker is on a job, on the bus to a job, signing up at a recruiting event in the actual field, or pulling over on a county road. They have one hand free, sun on the screen, possibly gloves on, possibly an earlier-gen Android, possibly poor connectivity. A responsive shrink of the dense layout is the wrong product for that moment — Field is a different product surface, not a viewport breakpoint.

## What it is

A radically simpler interface that exposes only the things that matter when you're not at home:

- **Today's shift** — where, when, how to get there, who to call, what to bring
- **One-tap "I'm here"** clock-in
- **Apply by SMS** — primary CTA, no form
- **Quick withdraw / reschedule** for an active application
- **Messages** — read-receipts so the employer knows you saw their note
- **Onboarding** — mobile-first signup wizard at `/[locale]/field/onboarding/*` for workers signing up in the field

No sidebar. No multi-column grids. No hover states. Big tap targets (≥60px). High-contrast for bright-sun visibility. ES-first when phone locale is ES. Service-worker-cached so it loads with one bar of signal. Pages explicitly do not adapt to desktop — that's what `/worker/*` is for.

## How a worker lands here

**Post-auth routes to the right shell automatically.** When an authenticated worker hits `/[locale]/post-auth`, the route handler reads the request User-Agent server-side and redirects:

- Mobile UA → `/[locale]/field/...` (the un-onboarded variant: `/[locale]/field/onboarding/welcome`)
- Desktop UA → `/[locale]/worker/...`

No flash, no client JS, no flicker on first paint.

**Workers can override the auto-pick.** Every Field surface and every Worker surface includes a "Switch view" entry in the user menu (`UserMenu` → "Use full view" or "Use field view"). The choice is remembered for the session via a cookie that the post-auth UA-sniff respects on subsequent visits.

**Roles are not viewports.** Employers and admins never land in `/field`, regardless of device. Field is a worker-only shell.

## Onboarding

Worker onboarding has **two parallel flows**, one per shell, both writing to the same backend profile rows so state survives device switches:

- **`/[locale]/field/onboarding/*`** — canonical mobile-first wizard for workers signing up in the field. Narrow form column, `StepShell` chrome with progress bar and `UserMenu`/sign-out in a slim header.
- **`/[locale]/worker/onboarding/*`** — desktop-first wizard built on `OnboardingSplitShell` (left pitch panel + right form column with `UserMenu`/sign-out). For the public-library / kiosk / family-laptop edge case.

Step routes match across both (`welcome`, `language`, `resume`, `profile`, `county`, `skills`, `availability`, `complete`, `waitlist`). Backend writes go through the same `@/lib/api/onboarding-actions`. Each shell picks "first incomplete step" on entry so a worker who starts on phone and resumes at a laptop lands at the right place.

A worker stuck mid-onboarding on a public computer must be able to log out — `UserMenu` is present in both shells' onboarding chrome.

## Invariants

- **`/field` never gates by viewport width** — it is a route prefix, not a media query. Even on a 2560px screen, `/field/*` renders its narrow mobile-first column. Workers who want desktop chrome use `/worker/*`.
- **`/field` is worker-only** — `FieldLayout` enforces `requireRole(UserRole.worker)`. Employers and admins are bounced.
- **`/field` onboarding is outside the onboarded gate** — the `(shell)` route group holds all post-onboarding Field surfaces; `field/onboarding/*` lives outside it so an un-onboarded worker can complete signup without bouncing.
- **No emoji, no FontAwesome alternatives, no responsive desktop shims** — Field is mobile-first and stays that way. Adding a desktop layout to `/field` would defeat the architectural decision and is not how a desktop-using worker is served (they get `/worker`).

## Related

- [brand/04-spacing-layout.md § Three shells, two layout strategies](../brand/04-spacing-layout.md#three-shells-two-layout-strategies) — the cross-cutting layout invariant.
- [00-foundation/11-app-shell](../00-foundation/11-app-shell/) — primitives, PWA wrapper, offline policy that Field consumes.
- [00-foundation/13-onboarding-identity-remediation/04-phase-2-worker-web.md](../00-foundation/13-onboarding-identity-remediation/04-phase-2-worker-web.md) — onboarding identity flow that both `/field/onboarding` and `/worker/onboarding` implement.
