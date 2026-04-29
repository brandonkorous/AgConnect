# 05 — Training Browser: Messaging

Templates referenced are catalogued in [00-foundation/05-sms-pipeline/06-messaging.md](../../00-foundation/05-sms-pipeline/06-messaging.md) and [00-foundation/06-email-pipeline/06-messaging.md](../../00-foundation/06-email-pipeline/06-messaging.md).

## On enrollment

**Worker SMS** (immediate): `training.enrolled` — defined as a new template:

| | EN | ES |
|---|---|---|
| Body | Enrolled in {programTitle} ({startDate}). We'll remind you 48h and 2h before. | Inscrito en {programTitle} ({startDate}). Te recordaremos 48h y 2h antes. |

**Worker email** (only if email set): `training.enrolled`

| | EN | ES |
|---|---|---|
| Subject | You're enrolled in {programTitle} | Estás inscrito en {programTitle} |
| Body | Includes program details, location, what to bring, and a calendar attachment (.ics) |

> **Inferred:** `.ics` calendar attachment is high value (workers add to phone calendar). Include it. Generate via a small ICS library at email-render time.

## Reminder: 48 hours before

**Worker SMS:** `training.reminder.48h`

| | EN | ES |
|---|---|---|
| Body | Reminder: {programTitle} starts {startDate} at {startTime}. {location} | Recordatorio: {programTitle} empieza el {startDate} a las {startTime}. {location} |

Triggered by cron dispatcher (every 15 min). Idempotent via `enrollments.reminder_sent_48h` flag.

## Reminder: 2 hours before

**Worker SMS:** `training.reminder.2h`

| | EN | ES |
|---|---|---|
| Body | {programTitle} starts in 2 hours at {location}. See you there! | {programTitle} empieza en 2 horas en {location}. ¡Nos vemos! |

Idempotent via `enrollments.reminder_sent_2h` flag.

> **Inferred:** 2h reminder skips quiet hours (it would defeat the purpose). The whole point is to nudge attendance — if the session starts at 8 AM, the 2h reminder at 6 AM is desired even if "quiet hours". Ergo: training reminders bypass the quiet-hours hold (their nature is time-critical).

## Quiet-hours exception

Training reminders are **time-critical** — they're useless if delayed.

**Decision:** training reminders bypass quiet hours. Implementation: `enqueueSms({ ..., scheduledFor: <reminderTime>, bypassQuietHours: true })`. The SMS pipeline honors `bypassQuietHours` and sends regardless.

This is the only template that bypasses quiet hours. Document explicitly so it doesn't quietly proliferate.

## On completion

**Worker SMS:** `training.completed` (with cert link)

| | EN | ES |
|---|---|---|
| Body | Congrats! You completed {programTitle}. Download your certificate: {certUrl} | ¡Felicidades! Completaste {programTitle}. Descarga tu certificado: {certUrl} |

**Worker email** (only if email set): `training.completed` with PDF cert attached.

Idempotent via `singletonKey: cert-sms-{enrollmentId}`. The cert generation pipeline triggers these (see [08-certificate-generation/03-api.md](../../00-foundation/08-certificate-generation/03-api.md)).

## On program canceled

If the org cancels a program, all enrolled workers get an SMS:

| | EN | ES |
|---|---|---|
| Body | {programTitle} on {startDate} is canceled. We're sorry for the inconvenience. | {programTitle} del {startDate} fue cancelado. Lamentamos la inconveniencia. |

Plus an email if available, with optional rescheduling info.

Template name: `training.canceled`. Variables: `programTitle`, `startDate`.

## Summary of triggers

| event | SMS | Email | bypass-QH | idempotency key |
|---|---|---|---|---|
| Enrollment | `training.enrolled` | `training.enrolled` | no | `train-enroll-{enrollmentId}` |
| 48h before | `training.reminder.48h` | — | yes | `train-48h-{enrollmentId}` |
| 2h before | `training.reminder.2h` | — | yes | `train-2h-{enrollmentId}` |
| Completion | `training.completed` (with link) | `training.completed` (with PDF) | no | `cert-sms/email-{enrollmentId}` |
| Canceled | `training.canceled` | `training.canceled` | no | `train-cancel-{programId}-{workerId}` |
