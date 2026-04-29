# 04 — Application Tracker: Messaging

Templates referenced here are catalogued in [00-foundation/05-sms-pipeline/06-messaging.md](../../00-foundation/05-sms-pipeline/06-messaging.md) and [00-foundation/06-email-pipeline/06-messaging.md](../../00-foundation/06-email-pipeline/06-messaging.md). This file describes when and how this feature triggers them.

## On apply (immediate)

**Worker SMS:** `application.applied`

|      | EN                                                                          | ES                                                                                       |
| ---- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Body | You applied for {jobTitle} at {employer}. Track at agconn.com/applications. | Aplicaste para {jobTitle} con {employer}. Sigue tu solicitud en agconn.com/applications. |

**Employer email:** `application.applied`

|         | EN                                                                                 | ES                                                                                        |
| ------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Subject | New applicant for {jobTitle}                                                       | Nuevo aplicante para {jobTitle}                                                           |
| Body    | A worker just applied for {jobTitle}. Review at agconn.com/dashboard/applications. | Un trabajador acaba de aplicar a {jobTitle}. Revisa en agconn.com/dashboard/applications. |

## On status: reviewed

**Worker SMS:** `application.reviewed` (no employer notification — they triggered it)

## On status: hired

**Worker SMS:** `application.hired`

|      | EN                                                                                                | ES                                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Body | Great news! You're hired for {jobTitle} at {employer}, starting {startDate}. They'll contact you. | ¡Buenas noticias! Te contrataron para {jobTitle} con {employer}, comenzando {startDate}. Te contactarán. |

**Worker email:** `application.hired` (only if email is set)

Subject: "You're hired for {jobTitle}" / "Te contrataron para {jobTitle}"

Body includes:

- Congratulations
- Employer name + phone
- Start date
- Wage
- Reminder: "Bring your ID and any required certifications"

> **Inferred:** Both SMS and email on hire (the celebratory event). For other statuses, SMS only — keeps inbox volume low.

## On status: rejected

**Worker SMS:** `application.rejected`

|      | EN                                                                                | ES                                                                                    |
| ---- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Body | {employer} chose another candidate for {jobTitle}. Keep applying! agconn.com/jobs | {employer} eligió a otro candidato para {jobTitle}. ¡Sigue aplicando! agconn.com/jobs |

No email on rejection — keeps the channel for positive notifications.

## On status: withdrawn

No worker notification (they triggered it). **Employer email:** `application.withdrawn`

Subject: "Applicant withdrew their application" / "Un aplicante retiró su solicitud"

## Idempotency

Each notification SMS/email is keyed by `app-{applicationId}-{toStatus}` to prevent duplicates if the status transition fires twice.

```ts
await enqueueSms({
  ...,
  template: 'application.hired',
  jobKey: `app-${applicationId}-hired`,
});
```

## Quiet hours

Standard 9 PM – 7 AM PT quiet hours apply. The "you're hired!" SMS at 11 PM holds until 7 AM PT — that's correct behavior; people don't want job texts in the middle of the night.

## Channel selection

- SMS to worker uses `users.preferredLang`.
- Employer notifications go to the employer's `preferredLang` (default EN; employers can set ES).
- Email follows the same locale rules.

## When not to notify

- **Status changes by admin (corrective):** if an admin manually changes a status (e.g., to fix a data error), no notification fires. The `metadata.silent: true` flag on `application_events.metadata` skips notification dispatch.
- **Withdrawn from already-rejected:** can't happen (state machine).
- **Same-status writes:** if status doesn't change, no event, no notification.
