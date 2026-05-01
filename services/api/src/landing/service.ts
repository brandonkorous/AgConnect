// audit-required:exempt — landing waitlist signups pre-date user accounts
// (no actor identity yet) and ride the email_log + waitlist tables which
// already serve as the durable record of opt-in/confirm/unsubscribe.
import {
  Lang,
  SuppressionReason,
  WaitlistAudience,
  WaitlistSource,
  type Tx,
} from '@agconn/db';
import {
  enqueueWaitlistConfirm,
  enqueueWaitlistWelcome,
  verifyConfirmToken,
  verifyUnsubscribeToken,
} from '@agconn/email';
import type {
  WaitlistRequest,
  WaitlistResponse,
  WaitlistConfirmResult,
  WaitlistUnsubscribeResult,
} from './schemas';

const audienceMap: Record<NonNullable<WaitlistRequest['audience']>, WaitlistAudience> = {
  worker: WaitlistAudience.worker,
  employer: WaitlistAudience.employer,
  training_org: WaitlistAudience.training_org,
  other: WaitlistAudience.other,
};

const sourceMap: Record<WaitlistRequest['source'], WaitlistSource> = {
  landing_final_cta: WaitlistSource.landing_final_cta,
  landing_coming_soon: WaitlistSource.landing_coming_soon,
  landing_waitlist_form: WaitlistSource.landing_waitlist_form,
  landing_newsletter: WaitlistSource.landing_newsletter,
};

export async function addToWaitlist(
  db: Tx,
  tenantId: string,
  input: WaitlistRequest,
): Promise<WaitlistResponse> {
  const email = input.email?.trim().toLowerCase() ?? null;
  const phone = input.phone?.trim() ?? null;
  const lang = input.locale === 'es' ? Lang.es : Lang.en;
  const audience = input.audience ? audienceMap[input.audience] : null;
  const source = sourceMap[input.source];

  const baseData = {
    phone,
    county: input.county ?? null,
    preferredLang: lang,
    audience,
    source,
  };

  const existing = email
    ? await db.waitlist.findFirst({ where: { tenantId, email } })
    : null;

  if (existing) {
    await db.waitlist.update({
      where: { id: existing.id },
      data: {
        ...baseData,
        phone: existing.phone ?? phone,
      },
    });

    if (existing.confirmedAt) {
      return { status: 'already_confirmed', needsConfirm: false };
    }
    if (existing.unsubscribedAt) {
      return { status: 'already_confirmed', needsConfirm: false };
    }

    if (email) {
      await enqueueWaitlistConfirm({
        waitlistId: existing.id,
        tenantId,
        email,
        locale: input.locale,
      });
    }
    return { status: 'queued', needsConfirm: Boolean(email) };
  }

  const created = await db.waitlist.create({
    data: {
      tenantId,
      email,
      ...baseData,
    },
  });

  if (email) {
    await enqueueWaitlistConfirm({
      waitlistId: created.id,
      tenantId,
      email,
      locale: input.locale,
    });
  }

  return { status: 'queued', needsConfirm: Boolean(email) };
}

export async function confirmWaitlist(
  db: Tx,
  token: string,
): Promise<{
  result: WaitlistConfirmResult;
  locale: 'en' | 'es';
}> {
  const verified = await verifyConfirmToken(token);
  if (!verified.ok) {
    return { result: verified.reason === 'expired' ? 'expired' : 'invalid', locale: 'es' };
  }

  const row = await db.waitlist.findUnique({ where: { id: verified.waitlistId } });
  if (!row) return { result: 'invalid', locale: 'es' };

  const locale: 'en' | 'es' = row.preferredLang === Lang.es ? 'es' : 'en';

  if (row.unsubscribedAt) {
    return { result: 'invalid', locale };
  }

  if (row.confirmedAt) {
    return { result: 'already', locale };
  }

  const updated = await db.waitlist.update({
    where: { id: row.id },
    data: { confirmedAt: new Date() },
  });

  if (updated.email && !updated.welcomedAt) {
    await enqueueWaitlistWelcome({
      waitlistId: updated.id,
      tenantId: updated.tenantId,
      email: updated.email,
      locale,
    });
  }

  return { result: 'confirmed', locale };
}

export async function unsubscribeWaitlist(
  db: Tx,
  token: string,
): Promise<{
  result: WaitlistUnsubscribeResult;
  locale: 'en' | 'es';
}> {
  const verified = await verifyUnsubscribeToken(token);
  if (!verified.ok) {
    return { result: 'invalid', locale: 'es' };
  }

  const row = await db.waitlist.findUnique({ where: { id: verified.waitlistId } });
  if (!row) return { result: 'invalid', locale: 'es' };

  const locale: 'en' | 'es' = row.preferredLang === Lang.es ? 'es' : 'en';

  if (row.unsubscribedAt) {
    return { result: 'already', locale };
  }

  await db.waitlist.update({
    where: { id: row.id },
    data: { unsubscribedAt: new Date() },
  });

  if (row.email) {
    await db.emailSuppression.upsert({
      where: { email: row.email.toLowerCase() },
      update: {},
      create: {
        email: row.email.toLowerCase(),
        reason: SuppressionReason.unsubscribe,
        source: 'waitlist',
      },
    });
  }

  return { result: 'unsubscribed', locale };
}
