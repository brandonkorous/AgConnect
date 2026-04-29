# 03 — Job Discovery: Messaging

## job.alert (SMS)

Sent by the saved-search dispatcher (see [03-api.md](03-api.md)) when a new job matching a saved search is posted.

Template defined in [00-foundation/05-sms-pipeline/06-messaging.md](../../00-foundation/05-sms-pipeline/06-messaging.md):

|      | EN                                                                               | ES                                                                                        |
| ---- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Body | New {jobTitle} job in {county}: ${wageMin}-${wageMax}/hr. agconn.com/jobs/{slug} | Nuevo trabajo de {jobTitle} en {county}: ${wageMin}-${wageMax}/hr. agconn.com/jobs/{slug} |

## Batching rules

To avoid SMS flooding when a single dispatch cycle finds many matching jobs:

- Maximum **3 alerts per worker per dispatch cycle** (one cycle = 5 minutes).
- If more than 3 jobs match in a single cycle, send the 3 most recent and skip the rest. Set `last_notified_at` to `now()` so the skipped ones aren't re-evaluated next cycle.
- Optional digest format (post-MVP): one SMS with up to 5 jobs in a numbered list.

## Quiet hours

Standard quiet hours (9 PM – 7 AM PT) apply. Alerts queued during quiet hours hold until 7:00 AM PT, then dispatch as a batch. The dispatcher itself runs every 5 minutes regardless; the per-job send call is what queues to the next legal window.

## Anti-flood global cap

Beyond the 3-per-dispatch limit, set a soft cap:

- **Per-worker:** ≤ 5 alerts per day. Beyond that, hold remaining and re-evaluate the next day.
- **Per-tenant:** if total dispatch fan-out exceeds 1000 SMS in 5 minutes, log a warning to Sentry and consider downgrading dispatch cadence.

## Saved search confirmation (optional)

When a worker creates a saved search with SMS alerts enabled, send a confirmation SMS:

|      | EN                                                                | ES                                                                               |
| ---- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Body | Saved! We'll text you when new jobs match. Reply STOP to opt out. | ¡Guardado! Te avisaremos cuando aparezcan trabajos. Responde STOP para cancelar. |

> **Inferred:** Confirmation SMS is optional. It builds trust ("yes, alerts are working") but adds one SMS per saved-search create. Default: enabled. Disable via flag if SMS budget is tight.

Template name: `saved_search.confirmed`. Variables: none.

## No alert delivered (after long inactivity)

If a saved search hasn't notified in 30 days because no jobs match, optionally send a "still listening" SMS once:

|      | EN                                                                                                                  | ES                                                                                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Body | We're still watching for jobs matching your saved search "{name}". Update or delete it at agconn.com/saved-searches | Seguimos buscando trabajos para tu búsqueda guardada "{name}". Actualízala o elimínala en agconn.com/saved-searches |

Out of scope for MVP — re-engagement campaigns are a post-launch tactic.
