# 99 — Worker Field Mode (deferred)

> **Status:** deferred. Build the full sidebar+topbar worker interface first; revisit Field Mode after the dense surfaces are in place.

## Why this exists

The dense, sidebar-driven worker interface (Browse Jobs, Applications, Shifts, Pay, Training, Documents, Messages, Wallet, Profile) is designed for **planning** time — at home, on a laptop, on a tablet, or thumb-scrolling on a couch.

**Field Mode** is the opposite ergonomic: a worker is on a job, on the bus to a job, or pulling over on a county road. They have one hand free, sun on the screen, possibly gloves on, possibly an earlier-gen Android, possibly poor connectivity. The dense layout is wrong for that moment.

## What it should be

A radically simpler interface that exposes only the four or five things that matter when you're not at home:

- **Today's shift** — where, when, how to get there, who to call, what to bring
- **One-tap "I'm here"** clock-in (already an HR concern but we can surface it)
- **Apply by SMS** — primary CTA, no form
- **Quick withdraw / reschedule** for an active application
- **Messages** — read-receipts so the employer knows you saw their note

No sidebar. No multi-column grids. No hover states. Big tap targets (≥ 60px). High-contrast in bright sun. ES-first when phone locale is ES. Service-worker-cached so it loads with one bar of signal.

## How to enter it

A discoverable toggle on the dense interface: "Switch to Field Mode" in the top-right of the topbar. Sets a cookie/localStorage flag. Bottom-of-page "Switch back" link in Field Mode.

> **Inferred:** Phone-vs-tablet-vs-laptop detection isn't reliable enough to auto-switch. Worker explicitly chooses; we remember the choice.

## Open questions

- Should Field Mode have its own URL prefix (`/[locale]/field/...`) sharing the same auth + RLS path, or just a different layout overlay on the same routes?
- Should the dense interface degrade automatically below some viewport width (e.g., 480px), or stay dense and let the worker opt in?
- What's the right home for offline messages? IndexedDB queue with a background sync? Probably yes, but coordinate with [00-foundation/11-app-shell](../00-foundation/11-app-shell/) PWA work.

## Next step

Park this until the dense [10-worker](.) surfaces are complete and a worker has used them in the wild for at least one harvest week. Then sit with the worker, watch them try to use the dense interface in the field, and use that observation to design Field Mode v1.
