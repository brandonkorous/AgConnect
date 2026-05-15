# 06 — Email Pipeline: Templates Catalog

All templates live in `packages/email/src/templates/<name>.tsx` as React Email components. Subject lines are translated via `email.<name>.subject` keys in `packages/i18n/{en,es}.json`.

## Templates inventory

### worker.welcome

Triggered on worker onboarding completion (only if `users.email` set).
See [10-worker/01-onboarding/06-messaging.md](../../10-worker/01-onboarding/06-messaging.md) for the full template detail.

|         | EN                | ES                  |
| ------- | ----------------- | ------------------- |
| Subject | Welcome to AGCONN | Bienvenido a AGCONN |

### employer.welcome

Triggered on employer onboarding completion (after FLC verification or grower signup).

|         | EN                                                | ES                                                       |
| ------- | ------------------------------------------------- | -------------------------------------------------------- |
| Subject | Welcome to AGCONN — your employer account is live | Bienvenido a AGCONN — tu cuenta de empleador está activa |

### employer.flc_verified

Sent to employer when admin approves FLC license verification.

|         | EN                           | ES                              |
| ------- | ---------------------------- | ------------------------------- |
| Subject | Your FLC license is verified | Tu licencia FLC está verificada |

### employer.flc_rejected

Sent when admin rejects FLC verification (with reason).

|         | EN                                      | ES                                             |
| ------- | --------------------------------------- | ---------------------------------------------- |
| Subject | Action needed: FLC license verification | Acción requerida: verificación de licencia FLC |

### application.applied (employer-facing)

Sent to employer when a worker applies.

|         | EN                           | ES                              |
| ------- | ---------------------------- | ------------------------------- |
| Subject | New applicant for {jobTitle} | Nuevo aplicante para {jobTitle} |

### application.hired (worker-facing)

Sent to worker when hired (in addition to SMS).

|         | EN                          | ES                             |
| ------- | --------------------------- | ------------------------------ |
| Subject | You're hired for {jobTitle} | Te contrataron para {jobTitle} |

### training.enrolled

Sent to worker on enrollment confirmation.

|         | EN                                | ES                               |
| ------- | --------------------------------- | -------------------------------- |
| Subject | You're enrolled in {programTitle} | Estás inscrito en {programTitle} |

### training.completed

Sent on training completion with certificate PDF attached.

|         | EN                                       | ES                                          |
| ------- | ---------------------------------------- | ------------------------------------------- |
| Subject | Your {programTitle} certificate is ready | Tu certificado de {programTitle} está listo |

### billing.subscription_started

Stripe checkout completed.

|         | EN                       | ES                         |
| ------- | ------------------------ | -------------------------- |
| Subject | Welcome to AGCONN {plan} | Bienvenido a AGCONN {plan} |

### billing.payment_failed

Stripe payment dunning.

|         | EN                                          | ES                                               |
| ------- | ------------------------------------------- | ------------------------------------------------ |
| Subject | Payment issue with your AGCONN subscription | Problema con el pago de tu suscripción de AGCONN |

### billing.invoice_paid

Stripe invoice paid; receipt with PDF link from Stripe.

|         | EN                                   | ES                                 |
| ------- | ------------------------------------ | ---------------------------------- |
| Subject | Receipt for your AGCONN subscription | Recibo de tu suscripción de AGCONN |

### billing.subscription_canceled

Confirmation of cancellation.

|         | EN                                   | ES                                      |
| ------- | ------------------------------------ | --------------------------------------- |
| Subject | Your AGCONN subscription is canceled | Tu suscripción de AGCONN está cancelada |

### grant.report_ready

Sent to admin or grantee org when a scheduled grant report is generated. Attaches the CSV/XLSX.

|         | EN                         | ES                         |
| ------- | -------------------------- | -------------------------- |
| Subject | {reportName} — {dateRange} | {reportName} — {dateRange} |

> **Inferred:** Grant reports are likely English-only (admin-facing). The subject placeholder allows ES if a partner org needs it. Confirm with stakeholders.

## Template structure (canonical)

```tsx
// packages/email/src/templates/worker.welcome.tsx
import { Html, Body, Container, Heading, Text, Button } from '@react-email/components';
import { Layout } from '../components/Layout';
import { useEmailTranslations } from '../i18n';

export default function WorkerWelcome({ locale, vars, ctx }: TemplateProps) {
    const t = useEmailTranslations('email.worker.welcome', locale);
    const baseUrl = process.env.WEB_PUBLIC_URL!;

    return (
        <Html lang={locale}>
            <Layout locale={locale} unsubscribeToken={ctx.unsubscribeToken}>
                <Container>
                    <Heading>{t('title', vars)}</Heading>
                    <Text>{t('intro')}</Text>
                    <Button href={`${baseUrl}/${locale}/jobs`}>{t('cta.jobs')}</Button>
                    <Button href={`${baseUrl}/${locale}/profile`}>{t('cta.profile')}</Button>
                    <Button href={`${baseUrl}/${locale}/training`}>{t('cta.training')}</Button>
                </Container>
            </Layout>
        </Html>
    );
}
```

## Layout component

`packages/email/src/components/Layout.tsx` handles: tenant logo (from `tenants.settings.branding`), header, body, footer with NAP, unsubscribe link.

```tsx
<footer>
    <small>
        {tenant.name}, {tenant.address}, {tenant.phone}
    </small>
    <a href={`${baseUrl}/${locale}/unsubscribe?t=${unsubscribeToken}`}>{t('common.email.unsubscribe')}</a>
</footer>
```

## Preview environment

`pnpm --filter email preview` starts a local server (`@react-email/preview`) at `http://localhost:3001` showing every template in EN and ES with sample vars. Used by designers/reviewers without running the full app.

## Subject line conventions

- ≤ 50 characters preferred (truncates cleanly in mobile inbox previews).
- Don't include the recipient's name in the subject (low value, increases spam-trigger risk).
- Variable interpolation in subjects supported: `email.application.hired.subject` = `"You're hired for {jobTitle}"`.
