# 06 · Crews & Shifts — Data model

All tables tenant‑scoped (`tenant_id` NOT NULL) with the standard RLS template applied.

## `crews`

| col | type | notes |
|-----|------|-------|
| id | uuid PK | |
| tenant_id | uuid NN | FK tenants |
| employer_id | uuid NN | FK users (employer-owner) |
| name | text NN | "Crew A · Grape harvest" |
| color | text NN default 'primary' | UI accent: `primary` `accent` `info` `success` |
| foreman_user_id | uuid NULL | FK users; the lead worker |
| job_id | uuid NULL | FK job_postings; the dominant posting (denormalized convenience) |
| created_at / updated_at / deleted_at | tstz | soft delete |

## `crew_members`

| col | type | notes |
|-----|------|-------|
| id | uuid PK | |
| tenant_id | uuid NN | |
| crew_id | uuid NN | FK crews ON DELETE CASCADE |
| worker_user_id | uuid NN | FK users |
| role | enum (`member` \| `lead`) NN default `member` | only one `lead` per crew (CHECK via partial index) |
| joined_at | tstz NN | |
| left_at | tstz NULL | when null = active |
| UNIQUE(crew_id, worker_user_id, joined_at) | | a worker can re-join after leaving |

## `shifts`

| col | type | notes |
|-----|------|-------|
| id | uuid PK | |
| tenant_id | uuid NN | |
| employer_id | uuid NN | FK users |
| crew_id | uuid NULL | FK crews; null = ad-hoc |
| job_id | uuid NULL | FK job_postings; for piece-rate lookup |
| shift_date | date NN | local CA date |
| start_time | time NN | 06:00 |
| end_time | time NULL | open-ended OK |
| location_label | text NN | "Block 7-North" |
| location_lat / location_lng | numeric NULL | optional geo |
| status | enum (`scheduled` \| `in_progress` \| `completed` \| `cancelled`) NN default `scheduled` | |
| notes | text NULL | |
| created_at / updated_at | tstz | |

## `shift_assignments`

| col | type | notes |
|-----|------|-------|
| id | uuid PK | |
| tenant_id | uuid NN | |
| shift_id | uuid NN | FK shifts ON DELETE CASCADE |
| worker_user_id | uuid NN | FK users |
| status | enum NN default `assigned` | `assigned` \| `confirmed` \| `declined` \| `no_show` \| `completed` |
| hours_worked | numeric(5,2) NULL | finalized at end-of-shift |
| pieces_count | integer NULL | piece-rate output |
| piece_rate_cents | integer NULL | cents per piece (snapshot) |
| created_at / updated_at | tstz | |
| UNIQUE(shift_id, worker_user_id) | | |

## State machine — assignments

```
assigned ──confirm──▶ confirmed ──complete──▶ completed
   │                       │
   ├──decline──▶ declined   └──no_show──▶ no_show
```

Only `confirmed` and `completed` count for the 3/4 guarantee. `no_show` counts as zero hours but does *not* unwind the assignment.

## Indexes

- `shifts (employer_id, shift_date)` — schedule grid
- `shifts (crew_id, shift_date)` — crew‑scoped lookup
- `shift_assignments (worker_user_id, shift_id)` — worker calendar
- `crew_members (crew_id)` partial WHERE `left_at IS NULL` — active roster
