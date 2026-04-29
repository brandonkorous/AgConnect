# 06 — Email Pipeline: API & Worker

## Internal API (TypeScript, in `packages/email`)

### enqueueEmail

```ts
// packages/email/src/index.ts
export interface EnqueueEmailArgs {
    tenantId: string;
    userId?: string; // for opt-out + locale; if not provided, must specify locale + toEmail
    template: TemplateName;
    vars?: Record<string, unknown>;
    toEmail?: string; // overrides users.email if provided (e.g., billing receipts to a billing email)
    locale?: Lang; // overrides users.preferredLang if provided
    jobKey?: string; // idempotency
    attachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
}

export async function enqueueEmail(args: EnqueueEmailArgs): Promise<{ jobId: string }> {
    return {
        jobId: await pgBoss.send('send-email', args, {
            singletonKey: args.jobKey,
            retryLimit: 3,
            retryBackoff: true,
        }),
    };
}
```

### Worker

```ts
pgBoss.work<EnqueueEmailArgs>('send-email', { teamSize: 5 }, async (job) => {
    const args = job.data;
    const user = args.userId ? await db.user.findUnique({ where: { id: args.userId } }) : null;
    const toEmail = args.toEmail ?? user?.email;
    if (!toEmail) return;
    const locale = args.locale ?? user?.preferredLang ?? 'es';

    // Suppression check
    const suppression = await db.emailSuppression.findUnique({ where: { email: toEmail } });
    if (suppression) {
        await db.emailLog.create({
            data: {
                tenantId: args.tenantId,
                userId: args.userId,
                template: args.template,
                locale,
                toEmail,
                fromEmail: process.env.EMAIL_FROM!,
                subject: '',
                vars: args.vars ?? {},
                status: 'dropped',
                errorMsg: `suppressed:${suppression.reason}`,
                unsubscribeToken: '',
            },
        });
        return;
    }

    const log = await db.emailLog.create({
        data: {
            tenantId: args.tenantId,
            userId: args.userId,
            template: args.template,
            locale,
            toEmail,
            fromEmail: process.env.EMAIL_FROM!,
            subject: '',
            vars: args.vars ?? {},
            status: 'sending',
            unsubscribeToken: '',
        },
    });
    const unsubscribeToken = makeUnsubscribeToken(log.id);
    await db.emailLog.update({ where: { id: log.id }, data: { unsubscribeToken } });

    const tpl = await renderTemplate(args.template, locale, args.vars ?? {}, { unsubscribeToken });
    // tpl: { subject, html, text }

    try {
        const result = await resend.emails.send({
            from: process.env.EMAIL_FROM!,
            to: toEmail,
            subject: tpl.subject,
            html: tpl.html,
            text: tpl.text,
            headers: {
                'List-Unsubscribe': `<${process.env.WEB_PUBLIC_URL}/unsubscribe?t=${unsubscribeToken}>, <mailto:unsubscribe@agconn.com?subject=unsubscribe&body=${log.id}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
            attachments: args.attachments?.map((a) => ({ filename: a.filename, content: a.content })),
        });
        await db.emailLog.update({ where: { id: log.id }, data: { providerId: result.data?.id, subject: tpl.subject, status: 'sent', sentAt: new Date() } });
    } catch (err: any) {
        await db.emailLog.update({ where: { id: log.id }, data: { status: 'failed', errorMsg: String(err) } });
        throw err;
    }
});
```

### Template renderer

```ts
// packages/email/src/render.ts
import { render } from '@react-email/render';
import * as templates from './templates';
import { t } from '@agconn/i18n/server';

export async function renderTemplate(name: TemplateName, locale: Locale, vars: Record<string, unknown>, ctx: { unsubscribeToken: string }) {
  const Component = templates[name];
  const subject = t(locale, `email.${name}.subject`, vars as any);
  const html = await render(<Component locale={locale} vars={vars} ctx={ctx} />);
  const text = await render(<Component locale={locale} vars={vars} ctx={ctx} />, { plainText: true });
  return { subject, html, text };
}
```

## Webhook endpoints

### POST /webhooks/resend

Resend webhook events: `email.sent`, `email.delivered`, `email.bounced`, `email.complained`, `email.opened`, `email.clicked`. Signature verified via Resend's HMAC.

```ts
resendWebhookRouter.post('/', async (c) => {
    const sig = c.req.header('resend-signature') ?? '';
    const body = await c.req.text();
    if (!verifyResendSignature(body, sig, process.env.RESEND_WEBHOOK_SECRET!)) {
        throw new HTTPException(401);
    }
    const event = JSON.parse(body);
    const providerId = event.data?.email_id;
    const log = providerId ? await db.emailLog.findFirst({ where: { providerId } }) : null;

    if (!log) return c.text('OK'); // event for an email we don't have (e.g., Clerk magic link)

    switch (event.type) {
        case 'email.delivered':
            await db.emailLog.update({ where: { id: log.id }, data: { status: 'delivered', deliveredAt: new Date() } });
            break;
        case 'email.bounced':
            await db.emailLog.update({ where: { id: log.id }, data: { status: 'bounced', bouncedAt: new Date(), errorMsg: event.data.reason } });
            if (event.data.bounce_type === 'hard') {
                await db.emailSuppression.upsert({
                    where: { email: log.toEmail },
                    create: { email: log.toEmail, reason: 'hard_bounce', source: 'bounce' },
                    update: {},
                });
            }
            break;
        case 'email.complained':
            await db.emailLog.update({ where: { id: log.id }, data: { status: 'complained', complainedAt: new Date() } });
            await db.emailSuppression.upsert({
                where: { email: log.toEmail },
                create: { email: log.toEmail, reason: 'complaint', source: 'complaint' },
                update: {},
            });
            break;
        case 'email.opened':
            await db.emailLog.update({ where: { id: log.id }, data: { openedAt: new Date() } });
            break;
        case 'email.clicked':
            await db.emailLog.update({ where: { id: log.id }, data: { clickedAt: new Date() } });
            break;
    }
    return c.text('OK');
});
```

## Unsubscribe endpoints

### POST /unsubscribe (one-click, RFC 8058)

```ts
unsubRouter.post('/', async (c) => {
    const token = c.req.query('t') ?? ((await c.req.parseBody()).t as string);
    const { logId } = verifyUnsubscribeToken(token);
    const log = await db.emailLog.findUnique({ where: { id: logId } });
    if (!log) return c.text('OK');
    await db.emailSuppression.upsert({
        where: { email: log.toEmail },
        create: { email: log.toEmail, reason: 'unsubscribe', source: 'unsubscribe' },
        update: {},
    });
    return c.text('OK');
});
```

### GET /unsubscribe (human-friendly confirmation page)

Verifies token, shows confirmation page in EN+ES with an "I changed my mind" undo link (24-hour grace).

## Web component for templates

All templates extend a base layout in `packages/email/src/components/Layout.tsx` that handles header, footer, NAP, unsubscribe link, and locale-aware fonts.
