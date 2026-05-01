# 06 · Crews & Shifts — Overview

A **Crew** is a stable group of workers led by a **foreman**, working together across multiple shifts. A **Shift** is a single dated work block tied to a Crew (or a one-off assignment). Each shift has assignments (worker → status), location, hours and (optionally) piece-rate output.

This is the operational layer that sits between **Job Postings** (what is hired for) and **Payroll** (what gets paid). It also feeds **Compliance** (3/4 guarantee tracking, AEWR) and **Reports** (yield, retention).

## Why now

Without crews + shifts the system stops at "someone got hired" and can't track who actually showed up, when, where, or how much they produced. Both H‑2A compliance and piece‑rate payroll require this granularity.

## Scope

- Crews: create / rename / archive; assign foreman; add/remove members from active hires
- Shifts: create / edit / cancel; date, start/end time, location, notes
- Assignments: assign worker → shift; set status (assigned → confirmed → completed/no_show); record hours and pieces
- 5‑day operational schedule view (the dashboard for today's foreman)
- Bilingual: every label EN+ES; SMS reminders to assigned workers honor existing quiet‑hours logic in `packages/sms`

> **Inferred:** A shift can exist without a crew (one‑off pickup) — keeps the model usable for small operations.

> **Inferred:** Foremen are not a distinct user role; any active hire on the employer can be promoted to "lead" of a crew.
