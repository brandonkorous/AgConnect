# 07 · Payroll — Overview

Payroll periods aggregate worker timesheets (from shift assignments) into per-worker line items with hours, overtime, gross, bonus (piece-rate), taxes, and net pay. Periods follow a draft → approved → paid lifecycle.

## Why now

Without payroll the employer can't close the loop on hires + shifts. Compliance also depends on payroll evidence (AB 1513, OT, AEWR).

## Scope (MVP)

- Period CRUD + state machine (`draft → approved → paid`)
- Auto-generate lines from completed `shift_assignments` for each period
- Line edit (hours, bonus, notes)
- CSV export of lines (federal 941 / CA DE-9 deferred to v2)

> **Inferred:** Pay periods are weekly Mon–Sun; pay date is the following Friday.
