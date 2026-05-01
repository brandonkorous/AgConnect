# 08 · Compliance — Overview

Per-employer registry of compliance items grouped by category (worker docs, safety, wage & hour, pesticide, H-2A). Each item carries a status (`ok`/`warn`/`fail`), optional due date, and optional evidence URL. Overall score = avg of category scores.

## Why now

Workers + employers care that the platform is audit-ready. The Tierra brand promise (FLC-verified) extends to ongoing compliance, not just signup.

## Scope (MVP)

- Item CRUD per employer (status, due date, evidence URL)
- Default item set seeded on employer signup
- "Actions queue" = items with status ≠ `ok` ordered by due date
- PDF audit binder export deferred to v2 (CSV in MVP)

> **Inferred:** Categories are a fixed enum of 5 buckets plus a `custom` overflow.
