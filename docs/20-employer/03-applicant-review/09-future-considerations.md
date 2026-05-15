# 03 — Applicant Review: Future Considerations

These are deferred surfaces that came out of a 2026-05-14 design conversation. None are scheduled. Capture-only; revisit when usage data or partner feedback says the existing surfaces aren't enough.

## Cross-job applicant pipeline (`/employer/pipeline`)

### Problem

The per-posting kanban at `/employer/jobs/:id/applicants` works for a single posting, but a Farm Labor Contractor or packing-house running 6–10 active postings must click into each one to move applicants. The dashboard kanban summary shows the cross-job picture but is read-only and cramped. The inbox is a list, not a board.

### Proposal sketch

A full-canvas kanban at `/employer/pipeline` that defaults to **all jobs**, with **pill-shaped filter chips** to narrow to one or more postings. Same four lanes as the dashboard summary (Applied / Reviewed / Hired / Archived). Cards carry a small job pill, color-coded by deterministic hash of `jobId` so the same job always reads the same hue.

```
┌─ Pipeline ─────────────────────────────────────────────────────────┐
│ 28 in flight              Sort: [Newest ▾]    [Export ⤓]            │
│                                                                    │
│ Filter:  [All jobs •]  [Cherry · Fresno 12]  [Pruner · Madera 6]   │
│          [Packing · Tulare 4]  + 5 more                            │
├─────────────┬─────────────┬─────────────┬─────────────────────────┤
│ Applied  12 │ Reviewed  5 │ Hired     3 │ Archived              8 │
└─────────────┴─────────────┴─────────────┴─────────────────────────┘
```

URL contract: `?job=a,b,c` for multi-select, `?job=<id>` single-select (same shape as the deep-link from the dashboard summary).

### Relationship to existing surfaces

- **`/employer/jobs/:id/applicants` stays.** It owns the job-centric chrome (breadcrumb, wage range, `hireCount/positionsTotal`). Pipeline-with-chip and per-posting kanban are deliberately different entry contexts.
- **Inbox stays as a list.** Pipeline is board-shaped; inbox is list-shaped with bulk-act. Don't merge.
- **Dashboard summary** would retarget its "Open full →" link from `/employer/inbox` to `/employer/pipeline`.

### Why deferred

The original concern that drove this discussion was whether marketing was misleading. It isn't — the per-posting kanban at `/employer/jobs/:id/applicants` fulfills the kanban promise from [40-marketing/01-landing/05-i18n.md](../../40-marketing/01-landing/05-i18n.md) (`landing.employer_showcase.bullet2.body`). The cross-job board is a power-user improvement, not a missing feature. Ship after the per-posting kanban is solid and there's evidence (employer feedback, support tickets, session recordings) that multi-posting employers are bouncing between postings.

### Open questions when picking this up

- Should chip multi-select default on (true cross-job) or single-select (one job at a time like a per-posting view)?
- For >8 jobs, overflow `+N more` dropdown or virtualized chip strip?
- Does this replace the dashboard summary's deep-link target, or is the summary still a useful read-only stop?

---

## Cross-site workforce / roster board (`/employer/crews` or `/roster`)

### Problem

A multi-site FLC's day is "who's on which site right now, who's coming off, who needs a replacement at Fresno by Friday." That's a different lifecycle than hiring. Today the platform has `/employer/crews` and `/employer/workers` entries in the sidebar — likely list views — but no cross-site board for active workforce.

### Proposal sketch

A second kanban-shaped surface on the *post-hire* side of the hire handoff. Pipeline ends at Hired; a roster board picks up from there.

Two plausible lane dimensions, mutually exclusive (or a toggle between them):

**Sites-as-lanes** — lanes = postings/sites, cards = assigned workers, lane header shows fill ratio (`8/10`).

```
┌─ Roster ───────────────────────────────────────────────────────────┐
│ Filter: [Active ▾]                                                 │
├──────────────────────┬──────────────────────┬──────────────────────┤
│ Cherry · Fresno 8/10 │ Pruner · Madera 5/6  │ Packing · Tulare 3/4 │
│ ──────────────────── │ ──────────────────── │ ──────────────────── │
│ Maria L.             │ Juan T.              │ Sofia G.             │
│ start 5/12  Active   │ start 5/18  Active   │ start 5/20  Active   │
│ ──────────────────── │ ──────────────────── │ ──────────────────── │
│ ...                  │ ...                  │ ...                  │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

Drag worker between lanes = reassign site (with confirmation; triggers worker SMS).

**Status-as-lanes** — lanes = lifecycle (Onboarding / Active / Ending soon / Released), cards carry a site pill, same chip-filter pattern as pipeline.

Sites-as-lanes is closer to how an operations manager describes their day. Status-as-lanes is closer to a compliance/HR lens. Worth user-testing both before committing.

### Why deferred

The marketing site doesn't promise this — the kanban claim is about the *hiring* funnel. This is a net-new value-add for FLCs running multiple worksites. It can ship after MVP once we see how the existing crews/workers list views are actually used.

### Open questions when picking this up

- Sites-as-lanes vs. status-as-lanes — pick one or offer both as a toggle?
- Does this live on `/employer/crews` (extends existing nav entry with a board mode) or a new `/roster` route?
- Hire-handoff: does a Pipeline Hired card automatically materialize a roster card on confirm, or is there an "Onboard" step in between?
- Reassignment by drag: confirmation modal pattern, worker-side notification copy, paper-trail event in `application_events` or a new `worker_assignments` table?

### Related

- Per-job context is already covered by `/employer/jobs/:id/applicants`. The roster board is the *across*-job complement on the post-hire side.
- `/employer/crews` and `/employer/workers` exist in the sidebar today as nav entries — audit what they render before designing this so it slots in cleanly instead of becoming a third surface.
