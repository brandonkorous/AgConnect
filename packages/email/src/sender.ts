import * as React from 'react';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import { EmailStatus, Lang, type EmailLog, type Tx } from '@agconn/db';
import { WaitlistConfirm } from './templates/WaitlistConfirm.js';
import { WaitlistWelcome } from './templates/WaitlistWelcome.js';
import { EmployerNotice } from './templates/EmployerNotice.js';
import { waitlistStrings, type Locale } from './strings/waitlist.js';
import { getEmployerCopy } from './strings/employer.js';
import type { EmployerEmailTemplate } from './queue.js';

let cachedResend: Resend | null = null;
function getResend(): Resend {
  if (cachedResend) return cachedResend;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  cachedResend = new Resend(key);
  return cachedResend;
}

function getFrom(): string {
  return process.env.RESEND_FROM_EMAIL ?? 'AgConn <hello@agconn.com>';
}

function localeToLang(locale: Locale): Lang {
  return locale === 'es' ? Lang.es : Lang.en;
}

export type SendOutcome =
  | { id: string; logId: string }
  | { skipped: true; reason: 'no_api_key' | 'suppressed'; logId?: string };

type DispatchArgs = {
  template: 'waitlist_confirm' | 'waitlist_welcome' | EmployerEmailTemplate;
  to: string;
  locale: Locale;
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl: string;
  oneClickUnsubscribeUrl: string;
  refType: string;
  refId: string;
  tenantId: string;
};

async function isSuppressed(db: Tx, email: string): Promise<boolean> {
  const hit = await db.emailSuppression.findUnique({
    where: { email: email.toLowerCase() },
  });
  return Boolean(hit);
}

async function logQueued(db: Tx, args: DispatchArgs): Promise<EmailLog> {
  return db.emailLog.create({
    data: {
      tenantId: args.tenantId,
      template: args.template,
      locale: localeToLang(args.locale),
      toEmail: args.to.toLowerCase(),
      fromEmail: getFrom(),
      subject: args.subject,
      status: EmailStatus.queued,
      refType: args.refType,
      refId: args.refId,
    },
  });
}

async function dispatch(db: Tx, args: DispatchArgs): Promise<SendOutcome> {
  if (await isSuppressed(db, args.to)) {
    const dropped = await db.emailLog.create({
      data: {
        tenantId: args.tenantId,
        template: args.template,
        locale: localeToLang(args.locale),
        toEmail: args.to.toLowerCase(),
        fromEmail: getFrom(),
        subject: args.subject,
        status: EmailStatus.dropped,
        errorMsg: 'address_suppressed',
        refType: args.refType,
        refId: args.refId,
      },
    });
    return { skipped: true, reason: 'suppressed', logId: dropped.id };
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY missing — skipping send', { to: args.to });
    return { skipped: true, reason: 'no_api_key' };
  }

  const log = await logQueued(db, args);

  try {
    const result = await getResend().emails.send({
      from: getFrom(),
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      headers: {
        'List-Unsubscribe': `<${args.oneClickUnsubscribeUrl}>, <${args.unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      tags: [
        { name: 'template', value: args.template },
        { name: 'locale', value: args.locale },
      ],
    });

    if (result.error) {
      await db.emailLog.update({
        where: { id: log.id },
        data: {
          status: EmailStatus.failed,
          errorMsg: result.error.message,
          failedAt: new Date(),
        },
      });
      throw new Error(`Resend send failed: ${result.error.message}`);
    }

    const providerId = result.data?.id ?? null;
    await db.emailLog.update({
      where: { id: log.id },
      data: {
        status: EmailStatus.sent,
        providerId,
        sentAt: new Date(),
      },
    });
    return { id: providerId ?? 'unknown', logId: log.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.emailLog.update({
      where: { id: log.id },
      data: {
        status: EmailStatus.failed,
        errorMsg: message.slice(0, 500),
        failedAt: new Date(),
      },
    });
    throw err;
  }
}

type WaitlistConfirmInput = {
  to: string;
  locale: Locale;
  confirmUrl: string;
  unsubscribeUrl: string;
  oneClickUnsubscribeUrl: string;
  waitlistId: string;
  tenantId: string;
};

export async function sendWaitlistConfirm(
  db: Tx,
  input: WaitlistConfirmInput,
): Promise<SendOutcome> {
  const subject = waitlistStrings[input.locale].confirm.subject;
  const element = React.createElement(WaitlistConfirm, {
    locale: input.locale,
    confirmUrl: input.confirmUrl,
    unsubscribeUrl: input.unsubscribeUrl,
  });
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return dispatch(db, {
    template: 'waitlist_confirm',
    to: input.to,
    locale: input.locale,
    subject,
    html,
    text,
    unsubscribeUrl: input.unsubscribeUrl,
    oneClickUnsubscribeUrl: input.oneClickUnsubscribeUrl,
    refType: 'waitlist',
    refId: input.waitlistId,
    tenantId: input.tenantId,
  });
}

type WaitlistWelcomeInput = {
  to: string;
  locale: Locale;
  homeUrl: string;
  unsubscribeUrl: string;
  oneClickUnsubscribeUrl: string;
  waitlistId: string;
  tenantId: string;
};

export async function sendWaitlistWelcome(
  db: Tx,
  input: WaitlistWelcomeInput,
): Promise<SendOutcome> {
  const subject = waitlistStrings[input.locale].welcome.subject;
  const element = React.createElement(WaitlistWelcome, {
    locale: input.locale,
    homeUrl: input.homeUrl,
    unsubscribeUrl: input.unsubscribeUrl,
  });
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return dispatch(db, {
    template: 'waitlist_welcome',
    to: input.to,
    locale: input.locale,
    subject,
    html,
    text,
    unsubscribeUrl: input.unsubscribeUrl,
    oneClickUnsubscribeUrl: input.oneClickUnsubscribeUrl,
    refType: 'waitlist',
    refId: input.waitlistId,
    tenantId: input.tenantId,
  });
}

type EmployerNoticeInput = {
  template: EmployerEmailTemplate;
  to: string;
  locale: Locale;
  vars: Record<string, string | number | null | undefined>;
  webBaseUrl: string;
  unsubscribeUrl: string;
  oneClickUnsubscribeUrl: string;
  employerId: string;
  tenantId: string;
};

export async function sendEmployerNotice(
  db: Tx,
  input: EmployerNoticeInput,
): Promise<SendOutcome> {
  const copy = getEmployerCopy(input.template, input.locale, input.vars);
  const ctaUrl = copy.cta
    ? `${input.webBaseUrl.replace(/\/$/, '')}${copy.cta.pathByLocale[input.locale]}`
    : undefined;

  const element = React.createElement(EmployerNotice, {
    locale: input.locale,
    copy,
    ctaUrl,
    unsubscribeUrl: input.unsubscribeUrl,
  });
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  return dispatch(db, {
    template: input.template,
    to: input.to,
    locale: input.locale,
    subject: copy.subject,
    html,
    text,
    unsubscribeUrl: input.unsubscribeUrl,
    oneClickUnsubscribeUrl: input.oneClickUnsubscribeUrl,
    refType: 'employer',
    refId: input.employerId,
    tenantId: input.tenantId,
  });
}
