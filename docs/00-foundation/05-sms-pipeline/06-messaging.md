# 05 — SMS Pipeline: Templates Catalog

This is the canonical list of all SMS templates. Each has EN + ES variants. All are GSM-7 single-segment (≤ 160 chars) unless explicitly noted.

Templates live in `packages/sms/templates/<name>.ts`:

```ts
// packages/sms/templates/welcome.ts
export const welcome = {
    en: 'Welcome to AgConn, {firstName}! Search jobs at agconn.com/jobs. Reply STOP to opt out.',
    es: '¡Bienvenido a AgConn, {firstName}! Busca trabajos en agconn.com/jobs. Responde STOP para cancelar.',
    vars: ['firstName'] as const,
};
```

The TS const is exported and a build-time check enforces:

- Both `en` and `es` exist.
- Same set of vars in both.
- Length ≤ 160 (warn at 140 — leaves room for variable expansion).

## Templates inventory

### welcome

Triggered on worker onboarding completion. See [10-worker/01-onboarding/06-messaging.md](../../10-worker/01-onboarding/06-messaging.md).

|      | EN                                                                                     | ES                                                                                                 |
| ---- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Body | Welcome to AgConn, {firstName}! Search jobs at agconn.com/jobs. Reply STOP to opt out. | ¡Bienvenido a AgConn, {firstName}! Busca trabajos en agconn.com/jobs. Responde STOP para cancelar. |
| Vars | firstName                                                                              | firstName                                                                                          |

### application.applied

Confirms application to a worker.

|      | EN                                                                          | ES                                                                                       |
| ---- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Body | You applied for {jobTitle} at {employer}. Track at agconn.com/applications. | Aplicaste para {jobTitle} con {employer}. Sigue tu solicitud en agconn.com/applications. |
| Vars | jobTitle, employer                                                          | jobTitle, employer                                                                       |

### application.reviewed

Employer marked application as reviewed.

|      | EN                                                   | ES                                              |
| ---- | ---------------------------------------------------- | ----------------------------------------------- |
| Body | {employer} reviewed your application for {jobTitle}. | {employer} revisó tu solicitud para {jobTitle}. |
| Vars | employer, jobTitle                                   | employer, jobTitle                              |

### application.hired

Worker was hired.

|      | EN                                                                                                | ES                                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Body | Great news! You're hired for {jobTitle} at {employer}, starting {startDate}. They'll contact you. | ¡Buenas noticias! Te contrataron para {jobTitle} con {employer}, comenzando {startDate}. Te contactarán. |
| Vars | jobTitle, employer, startDate                                                                     | jobTitle, employer, startDate                                                                            |

### application.rejected

Worker was not selected.

|      | EN                                                                                | ES                                                                                    |
| ---- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Body | {employer} chose another candidate for {jobTitle}. Keep applying! agconn.com/jobs | {employer} eligió a otro candidato para {jobTitle}. ¡Sigue aplicando! agconn.com/jobs |
| Vars | employer, jobTitle                                                                | employer, jobTitle                                                                    |

### job.alert

Saved-search job match notification.

|      | EN                                                                               | ES                                                                                        |
| ---- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Body | New {jobTitle} job in {county}: ${wageMin}-${wageMax}/hr. agconn.com/jobs/{slug} | Nuevo trabajo de {jobTitle} en {county}: ${wageMin}-${wageMax}/hr. agconn.com/jobs/{slug} |
| Vars | jobTitle, county, wageMin, wageMax, slug                                         | same                                                                                      |

### training.reminder.48h

48 hours before training session.

|      | EN                                                                     | ES                                                                                |
| ---- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Body | Reminder: {programTitle} starts {startDate} at {startTime}. {location} | Recordatorio: {programTitle} empieza el {startDate} a las {startTime}. {location} |
| Vars | programTitle, startDate, startTime, location                           | same                                                                              |

### training.reminder.2h

2 hours before training session.

|      | EN                                                             | ES                                                           |
| ---- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| Body | {programTitle} starts in 2 hours at {location}. See you there! | {programTitle} empieza en 2 horas en {location}. ¡Nos vemos! |
| Vars | programTitle, location                                         | same                                                         |

### training.completed

Training program completion + cert link.

|      | EN                                                                           | ES                                                                           |
| ---- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Body | Congrats! You completed {programTitle}. Download your certificate: {certUrl} | ¡Felicidades! Completaste {programTitle}. Descarga tu certificado: {certUrl} |
| Vars | programTitle, certUrl                                                        | same                                                                         |

### account.transfer_request

Phone collision across tenants — admin support flow.

|      | EN                                                                                                      | ES                                                                                                           |
| ---- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Body | A request to transfer your AgConn account was made. If this wasn't you, reply NO. Otherwise, reply YES. | Se hizo una solicitud para transferir tu cuenta de AgConn. Si no fuiste tú, responde NO. Si sí, responde SI. |
| Vars | (none)                                                                                                  | (none)                                                                                                       |

> **Inferred:** Two-way confirmation (YES/NO) is out of scope for MVP — the inbound webhook only handles STOP. For `account.transfer_request`, MVP uses an email magic-link instead. This template is reserved for Phase 2+.

## Template versioning

Templates are versioned implicitly by git. When changing copy:

1. Update `packages/sms/templates/<name>.ts`.
2. CI runs `check-sms-templates` to verify EN+ES parity, var match, and length budgets.
3. Native Spanish speaker review on any ES change.
4. Deploy. The next send picks up the new template. No template ID in `sms_log` — body is logged literally so historical records remain readable.

## Character budget cheat sheet

- GSM-7 alphabet: 160 chars/segment. Spanish accents (`á`, `é`, etc.) are in GSM-7 extended set (count as 2 chars each) OR force UCS-2 encoding (70 chars/segment).
- Twilio auto-detects encoding. To stay in GSM-7, use unaccented characters where natural ("telefono" not "teléfono") — but only when the unaccented form is also natural. Don't sacrifice readability for character count.
- Multi-segment SMS is allowed (up to 3 segments per template). Each segment costs separately.
