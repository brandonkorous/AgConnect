import { Resend } from 'resend';
import type { WaitlistRequest, WaitlistResponse } from './schemas';

const resendKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'hello@agconn.com';

export async function addToWaitlist(input: WaitlistRequest): Promise<WaitlistResponse> {
  const message =
    input.locale === 'es'
      ? 'Te avisaremos cuando AgConn esté listo.'
      : "We'll let you know when AgConn is ready.";

  if (!resendKey) {
    console.warn('[waitlist] RESEND_API_KEY not set — skipping email send', { email: input.email });
    return { ok: true, message };
  }

  const resend = new Resend(resendKey);
  const subject =
    input.locale === 'es'
      ? 'Estás en la lista de espera de AgConn'
      : "You're on the AgConn waitlist";
  const body =
    input.locale === 'es'
      ? 'Gracias por registrarte. Te avisaremos cuando AgConn esté listo.'
      : "Thanks for signing up. We'll let you know when AgConn is ready.";

  await resend.emails.send({
    from: fromEmail,
    to: input.email,
    subject,
    text: body,
  });

  return { ok: true, message };
}
