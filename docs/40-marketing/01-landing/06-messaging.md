# 01 — Landing Page: Messaging

The landing page itself sends only **one** outbound communication: a waitlist confirmation email. Sign-up forms (worker phone, employer email) hand off to Clerk-hosted flows whose messaging is covered in [00-foundation/02-auth](../../00-foundation/02-auth/). Welcome SMS and welcome email are covered in [10-worker/01-onboarding/06-messaging.md](../../10-worker/01-onboarding/06-messaging.md).

## waitlist.confirmed (email)

Triggered by `POST /v1/landing/waitlist` when an email is provided. Sent via the standard email pipeline ([00-foundation/06-email-pipeline](../../00-foundation/06-email-pipeline/)).

Template name: `landing.waitlist_confirmed`. Idempotency key: `waitlist-{waitlistId}`.

|           | EN                                                 | ES                                          |
| --------- | -------------------------------------------------- | ------------------------------------------- |
| Subject   | We saved your spot on the AGCONN waitlist          | Te apartamos un lugar en la lista de AGCONN |
| Preheader | We'll text or email you when we open in your area. | Te avisaremos cuando lleguemos a tu zona.   |

Body components:

- Greeting (no name — we don't have one)
- Confirmation paragraph: "We added you to the AGCONN waitlist. We'll reach out when we open in [{county}]."
- One short paragraph on what AGCONN is (one-sentence summary, link to landing page)
- Footer: standard NAP, unsubscribe link, brand
- One CTA: `Visit AGCONN →` linking back to `/[locale]`

i18n keys (under `email.landing.waitlist_confirmed.*`):

| key          | en                                                                                                                                          | es                                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `subject`    | We saved your spot on the AGCONN waitlist                                                                                                   | Te apartamos un lugar en la lista de AGCONN                                                                                                                                |
| `preheader`  | We'll text or email you when we open in your area.                                                                                          | Te avisaremos cuando lleguemos a tu zona.                                                                                                                                  |
| `greeting`   | Welcome —                                                                                                                                   | Bienvenido —                                                                                                                                                               |
| `body.line1` | We added you to the AGCONN waitlist. We'll reach out when we open in {county}.                                                              | Te agregamos a la lista de AGCONN. Te avisaremos cuando lleguemos a {county}.                                                                                              |
| `body.line2` | AGCONN is a bilingual workforce platform connecting Central Valley farmworkers to verified seasonal jobs and CDFA-funded training programs. | AGCONN es una plataforma laboral bilingüe que conecta a trabajadores agrícolas del Valle Central con trabajos de temporada verificados y capacitación financiada por CDFA. |
| `cta`        | Visit AGCONN                                                                                                                                | Visitar AGCONN                                                                                                                                                             |
| `body.line3` | If you didn't sign up for AGCONN, you can ignore this message.                                                                              | Si no te registraste en AGCONN, puedes ignorar este mensaje.                                                                                                               |

## SMS

The landing page does NOT send SMS directly. The Final CTA worker form starts a Clerk SMS-OTP flow; that SMS is sent and templated by Clerk per the auth feature.

If a phone is provided to the waitlist endpoint (no email), no SMS is sent in v1 — the waitlist row records the phone for future outbound (Phase 2 outreach campaign). Document this clearly in the waitlist UI: "We'll add you to the list. We won't text you until we open in your area."

## Anti-spam

- IP rate limit on `POST /v1/landing/waitlist`: 10/hour, 30/day.
- One waitlist email per `(email)` ever — duplicate POSTs return 200 with `status: queued` but only the first inserts a row and sends an email.
- Suppression: if the email is already on `email_suppression`, the waitlist row is still inserted but no email is sent. Logged silently.

## When to email vs when to hold

- **Email:** waitlist sign-up with email present.
- **No email (just phone):** waitlist row recorded; no outbound until campaign opens.
- **Suppressed email:** waitlist row recorded; no outbound.
- **Out-of-area county (county not in served list):** same email, same copy — the message handles it.

## Quiet hours

Waitlist confirmation emails do NOT respect quiet hours (email is async, recipient checks when ready). Sent immediately on enqueue.

## Failure handling

- Email enqueue failure → caught, logged in Sentry; the waitlist row already exists, so the user's intent is preserved.
- pg-boss retries 3× with backoff; on exhaust, manually re-fire via admin tool.
- The waitlist endpoint always returns 200 to the user even if email enqueue fails — the row is the contract; the email is an additive courtesy.
