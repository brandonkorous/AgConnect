# 01 — Worker Onboarding: Messaging

## Welcome SMS

Triggered by `POST /v1/onboarding/complete`. Enqueued via `pg-boss` job `welcome-sms` with payload `{ userId }`. Worker process resolves `preferred_lang`, picks template, and sends via Twilio.

|               | EN                                                                                     | ES                                                                                                 |
| ------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Body          | Welcome to AgConn, {firstName}! Search jobs at agconn.com/jobs. Reply STOP to opt out. | ¡Bienvenido a AgConn, {firstName}! Busca trabajos en agconn.com/jobs. Responde STOP para cancelar. |
| Length budget | 160 GSM-7 chars (single segment)                                                       | 160 GSM-7 chars (single segment)                                                                   |

Variables: `{firstName}` from `worker_profiles.first_name`. Truncate to 20 chars to stay within segment budget for long names.

Quiet hours: enqueued message holds until 7:00 AM Pacific if completion happens between 21:00–07:00 PT, per [00-foundation/05-sms-pipeline](../../00-foundation/05-sms-pipeline/).

Logging: every send writes a row to `sms_log` with `userId`, `template = 'welcome'`, `provider_id` (Twilio SID), `status`, `sent_at`. Delivery webhooks update `status` to `delivered` / `failed`.

## Welcome email (optional)

Sent only if `users.email` was provided during profile review. Sent via Resend with React Email template `WorkerWelcomeEmail`.

|           | EN                                        | ES                                                 |
| --------- | ----------------------------------------- | -------------------------------------------------- |
| Subject   | Welcome to AgConn                         | Bienvenido a AgConn                                |
| Preheader | Your profile is live. Find jobs near you. | Tu perfil está activo. Busca trabajos cerca de ti. |

Template structure (React Email components):

```tsx
// packages/email/src/templates/WorkerWelcomeEmail.tsx
<Html>
    <Head>
        <I18nMeta locale={locale} />
    </Head>
    <Body>
        <Container>
            <Header logo={tenant.branding?.logoUrl} />
            <Heading>{t('email.welcome.title', { name })}</Heading>
            <Text>{t('email.welcome.intro')}</Text>

            <Cards>
                <Card title={t('email.welcome.card.jobs')} cta={t('email.welcome.card.jobs.cta')} href={`${baseUrl}/${locale}/jobs`} />
                <Card title={t('email.welcome.card.profile')} cta={t('email.welcome.card.profile.cta')} href={`${baseUrl}/${locale}/profile`} />
                <Card title={t('email.welcome.card.training')} cta={t('email.welcome.card.training.cta')} href={`${baseUrl}/${locale}/training`} />
            </Cards>

            <Footer nap={tenant.nap} unsubscribeUrl={unsubscribeUrl} />
        </Container>
    </Body>
</Html>
```

i18n keys (under `email.welcome.*`):

| key                 | en                                                           | es                                                                 |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| `title`             | Welcome to AgConn, {name}                                    | Bienvenido a AgConn, {name}                                        |
| `intro`             | Your profile is live. Here are three things you can do next. | Tu perfil está activo. Aquí hay tres cosas que puedes hacer ahora. |
| `card.jobs`         | Browse jobs                                                  | Ver trabajos                                                       |
| `card.jobs.cta`     | See jobs                                                     | Ver trabajos                                                       |
| `card.profile`      | Polish your profile                                          | Mejora tu perfil                                                   |
| `card.profile.cta`  | Edit profile                                                 | Editar perfil                                                      |
| `card.training`     | Earn certifications                                          | Obtén certificaciones                                              |
| `card.training.cta` | View training                                                | Ver capacitación                                                   |

Footer NAP (name/address/phone) sourced from `tenants.settings.branding`/`nap`. The footer also includes the unsubscribe link required by CAN-SPAM.

## OTP SMS (handled by Clerk — for reference only)

We don't send these directly; Clerk does. But for grant reporting and analytics, every Clerk SMS event arrives via webhook (`session.created`, `phone_number.verified`) and is logged to `auth_events`. No template here.

## Anti-spam

- One welcome SMS per `userId` ever — `welcome-sms` job is keyed `welcome-sms-{userId}` for idempotency.
- One welcome email per `userId` ever — `welcome-email-{userId}` job key.
- Re-onboarding (e.g., admin resets `onboardedAt`) does NOT re-trigger welcome messages. To intentionally re-trigger, admin uses `/admin/v1/users/:id/resend-welcome` (out of scope for MVP).

## Failure handling

- SMS failure: pg-boss retries 3× with exponential backoff (30s, 5m, 30m). On exhaust → Sentry alert + row in `sms_log` with `status = 'failed_exhausted'`. The user's account is NOT blocked.
- Email failure: Resend returns 4xx → drop and log. 5xx → pg-boss retries 3× same backoff.
