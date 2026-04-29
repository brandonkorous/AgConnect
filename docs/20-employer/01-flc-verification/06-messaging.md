# 01 — FLC Verification: Messaging

Templates referenced from [00-foundation/06-email-pipeline/06-messaging.md](../../00-foundation/06-email-pipeline/06-messaging.md).

## On submission: flc_pending

Sent immediately after employer submits onboarding form. Informational.

|         | EN                                           | ES                                                   |
| ------- | -------------------------------------------- | ---------------------------------------------------- |
| Subject | We're verifying your AgConn employer account | Estamos verificando tu cuenta de empleador de AgConn |

Body covers:

- "Thanks for joining AgConn."
- "We'll verify your business details within 1 business day."
- "You can prepare job drafts in the meantime."
- Link to the dashboard.

Idempotency key: `verify-pending-{employerId}`.

## On approval: flc_verified

Sent when admin marks the employer as verified.

Defined in catalog as `employer.flc_verified`.

|         | EN                              | ES                                  |
| ------- | ------------------------------- | ----------------------------------- |
| Subject | Your AgConn account is verified | Tu cuenta de AgConn está verificada |

Body:

- "Your business is verified."
- "You can now publish job postings."
- Link to "Create your first posting."
- Reminder of plan tier and how to upgrade for more postings.

Idempotency key: `verify-approved-{employerId}`.

## On rejection: flc_rejected

Sent when admin rejects with a reason.

|         | EN                                        | ES                                             |
| ------- | ----------------------------------------- | ---------------------------------------------- |
| Subject | Action needed: verify your AgConn account | Acción requerida: verifica tu cuenta de AgConn |

Body:

- "We couldn't verify your business with the info provided."
- "Reason: {reason}"
- "Please update your information here: {link}"
- "Reply if you have questions: support@agconn.com"

Idempotency key: `verify-rejected-{employerId}-{rejectedAt-iso}`.

## On expiry (Phase 2): flc_expired

When the nightly DLSE scraper detects an expired license.

|         | EN                                                   | ES                                                   |
| ------- | ---------------------------------------------------- | ---------------------------------------------------- |
| Subject | Your FLC license is expired — re-verification needed | Tu licencia FLC expiró — se necesita re-verificación |

Body:

- "Our records show your CA DIR/DLSE license expired on {expiresAt}."
- "Update your license info to continue posting new jobs."
- "Existing job postings remain active for now."
- Link to update form.

Out of scope for MVP — only relevant once the scraper exists.

## SMS

No SMS for verification flow. Employers receive email only.

> **Inferred:** Employers don't expect SMS for business operations. Email is the right channel; SMS would be intrusive and inconsistent with the worker-focused SMS approach.

## Locale handling

Employer-facing emails use `users.preferredLang` if set; otherwise default to EN. Most employers will be EN-default; the toggle in their dashboard updates `preferredLang`.

## When NOT to notify

- Admin re-verifying after employer updates info: send `flc_verified` only if it's a state change from rejected/pending → verified. Don't re-send if already verified.
- Internal notes added to verification log: no notification (admin only).
