# 02 — Placement Report: Overview

## Purpose

Generate WIOA/CalJOBS-aligned exports of worker placements that grantee organizations can use to fulfill their reporting obligations. Per kickoff §11.

AGCONN is **not** a CalJOBS submitter — grantees are. AGCONN's job is to give grantees the data fields they need to populate CalJOBS / CDFA forms themselves.

## What it captures

WIOA-aligned fields per the kickoff §11.1:

| field               | source                                                                |
| ------------------- | --------------------------------------------------------------------- |
| Participant ID      | anonymized worker UUID hash                                           |
| Service date range  | first / last platform activity dates                                  |
| Employment outcome  | `applications.hired_at`, employer EIN, occupation (SOC code optional) |
| Wage at placement   | `applications.wage_offered`                                           |
| Training completion | `enrollments` rows tied to the worker                                 |
| Demographic fields  | county, language preference (no SSN, no race/ethnicity required)      |
| Retention flag      | Q2 / Q4 re-employment placeholder (manual follow-up)                  |

## Scope

In scope:

- Placement report generation: CSV + XLSX
- Filterable by date range, county, employer, training-program funder
- Per-grantee scope (grantees see only their participants — Phase 2; admin sees all in MVP)
- Anonymized participant IDs (one-way hash, stable per (tenant, worker))
- Format follows WIOA field labels (capitalization, abbreviations)

Out of scope:

- Direct submission to CalJOBS (grantee's job)
- SOC code lookup (out of scope; employer can self-attest if desired)
- Q2 / Q4 retention check automation (manual follow-up flag)
- SSN handling — never ever

## Success criteria

- Report generation < 30s for a quarter's data (~ 10k rows).
- Field labels match WIOA expectations such that a grantee can paste-import to CalJOBS with minimal mapping.
- Action item from kickoff §11.1: pre-launch validation with one CDFA / EDD contact.
- Zero PII leaks: no SSNs ever, no plaintext phone in exports unless explicitly enabled.

## Action item from kickoff

Before final export format is locked: share a draft CSV with one CDFA grantee or Central Valley EDD Local Area rep to confirm fields align with what they actually submit. **One-hour meeting — not a development task.**

## Dependencies

- [01-kpi-dashboard](../01-kpi-dashboard/) — drill-down source
- [00-foundation/02-auth](../../00-foundation/02-auth/) — admin role
- [00-foundation/06-email-pipeline](../../00-foundation/06-email-pipeline/) — emailed report delivery (optional)
- All worker / employer / application / enrollment data
