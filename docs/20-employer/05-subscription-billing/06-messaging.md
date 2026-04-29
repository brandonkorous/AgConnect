# 05 — Subscription Billing: Messaging

All emails. No SMS for billing.

## billing.subscription_started

Sent on `customer.subscription.created` (and the first transition to active).

|         | EN                       | ES                         |
| ------- | ------------------------ | -------------------------- |
| Subject | Welcome to AgConn {plan} | Bienvenido a AgConn {plan} |

Body:

- "You're now on the {plan} plan."
- Feature highlights for the plan.
- Link to dashboard.
- Receipt info: "Your first invoice will arrive separately."

Idempotency key: `billing-started-{employerId}-{stripeSubId}`.

## billing.invoice_paid

Sent on `invoice.payment_succeeded`.

|         | EN                                   | ES                                 |
| ------- | ------------------------------------ | ---------------------------------- |
| Subject | Receipt for your AgConn subscription | Recibo de tu suscripción de AgConn |

Body:

- "Payment of ${amount} succeeded."
- Period covered.
- Link to hosted invoice (`invoice.hosted_invoice_url`) for downloadable PDF.

Idempotency key: `billing-paid-{stripeInvoiceId}`.

> **Inferred:** Stripe also sends its own receipt email; ours is supplementary and branded. Disable Stripe's receipts in Stripe settings if duplicates are confusing — but our preference is keeping both for redundancy.

## billing.payment_failed

Sent on `invoice.payment_failed`.

|         | EN                                          | ES                                               |
| ------- | ------------------------------------------- | ------------------------------------------------ |
| Subject | Payment issue with your AgConn subscription | Problema con el pago de tu suscripción de AgConn |

Body:

- "We couldn't charge ${amount} on your card."
- "Stripe will try again over the next 3 days."
- "Update your card here: [link to portal]" — to prevent further failures.
- Mention: "If we can't collect, your account will move to Free and existing postings will stay live until end_date."

Idempotency key: `billing-failed-{stripeInvoiceId}`.

## billing.subscription_canceled

Sent on `customer.subscription.deleted` OR when `cancel_at_period_end = true` is set.

For immediate cancellation:

|         | EN                                   | ES                                      |
| ------- | ------------------------------------ | --------------------------------------- |
| Subject | Your AgConn subscription is canceled | Tu suscripción de AgConn está cancelada |

For end-of-period cancellation:

|         | EN                                          | ES                                           |
| ------- | ------------------------------------------- | -------------------------------------------- |
| Subject | Your AgConn subscription will end on {date} | Tu suscripción de AgConn terminará el {date} |

Body covers:

- Confirmation
- What happens to active postings (stay live until end_date)
- "Reactivate any time" link to plans page
- Feedback ask: "Why did you cancel?" with a one-click feedback form

Idempotency key: `billing-canceled-{stripeSubId}`.

## billing.upgrade / downgrade

When the plan tier changes (mid-cycle), send a confirmation email summarizing the change.

|         | EN                                 | ES                                |
| ------- | ---------------------------------- | --------------------------------- |
| Subject | Your AgConn plan changed to {plan} | Tu plan de AgConn cambió a {plan} |

Body details prorated charges (Stripe handles the math; we just relay).

Idempotency key: `billing-changed-{stripeSubId}-{eventTimestamp}`.

## When NOT to email

- Internal admin adjustments (`metadata.silent: true`).
- Failed payment retry attempts (Stripe's own dunning emails handle these; we send only on initial failure).
- Webhook processing errors visible only to admins.

## Locale handling

Billing emails use `users.preferredLang`. Default EN.

## Quiet hours

Billing emails have no quiet hours. Sent immediately.
