# 06 · Crews & Shifts — API

Mounted at `/v1/employer/crews` and `/v1/employer/shifts`. All routes require `requireAuth + requireRole('employer') + requireTenant`. Plan‑gated for Free tier (cap of 1 crew + 14 day schedule horizon); Pro+ unlimited.

## Crews

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/v1/employer/crews` | — | `{ crews: CrewView[] }` |
| POST | `/v1/employer/crews` | `CreateCrewBody` | `{ crew: CrewView }` |
| GET | `/v1/employer/crews/:id` | — | `{ crew: CrewView, members: CrewMember[] }` |
| PATCH | `/v1/employer/crews/:id` | `PatchCrewBody` | `{ crew: CrewView }` |
| DELETE | `/v1/employer/crews/:id` | — | `{ ok: true }` (soft delete) |
| POST | `/v1/employer/crews/:id/members` | `{ workerUserId, role }` | `{ member }` |
| DELETE | `/v1/employer/crews/:id/members/:userId` | — | `{ ok: true }` |
| POST | `/v1/employer/crews/:id/foreman` | `{ workerUserId }` | `{ crew: CrewView }` (idempotent) |

## Shifts

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/v1/employer/shifts?from=&to=&crewId=` | — | `{ shifts: ShiftView[] }` (5–14 day window) |
| POST | `/v1/employer/shifts` | `CreateShiftBody` | `{ shift: ShiftView }` |
| GET | `/v1/employer/shifts/:id` | — | `{ shift, assignments }` |
| PATCH | `/v1/employer/shifts/:id` | `PatchShiftBody` | `{ shift }` |
| DELETE | `/v1/employer/shifts/:id` | — | (cancels, doesn't hard-delete) |
| POST | `/v1/employer/shifts/:id/assign` | `{ workerUserId }` | `{ assignment }` |
| PATCH | `/v1/employer/shifts/:id/assignments/:aId` | `{ status?, hoursWorked?, piecesCount? }` | `{ assignment }` |

## Errors

- `crew_lead_already_set` — replace, don't error → idempotent
- `worker_not_active_hire` — worker must have a `hired` Application with this employer
- `shift_in_past` — only PATCH allowed for past shifts (close-out)
- `shift_window_too_long` — Free tier exceeds 14 days
- `crew_cap_reached` — Free tier already has 1 crew

## Audit

`employer.crew.created` `employer.crew.member.added` `employer.crew.member.removed` `employer.shift.created` `employer.shift.assignment.completed` — all routed through `emitAudit(c, action, entity, entityId)`.

## Plan gating

- **Free**: 1 active crew, 14-day shift window, no piece-rate fields exposed
- **Pro+**: unlimited crews, 60-day window, piece-rate enabled
- Enforced in route via `planFeatures(profile.plan)` before write paths.
