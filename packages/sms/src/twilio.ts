import twilio, { type Twilio } from 'twilio';

let cached: Twilio | null = null;

export function getTwilioClient(): Twilio {
  if (cached) return cached;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required to send SMS');
  }
  cached = twilio(sid, token);
  return cached;
}

export function getMessagingServiceSid(): string {
  const msid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  if (!msid) {
    throw new Error('TWILIO_MESSAGING_SERVICE_SID is required to send SMS');
  }
  return msid;
}

export function validateTwilioSignature(args: {
  signature: string | null | undefined;
  url: string;
  params: Record<string, string>;
}): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) return false;
  if (!args.signature) return false;
  return twilio.validateRequest(token, args.signature, args.url, args.params);
}

export type TwilioSendError = {
  code: string | null;
  message: string;
  retryable: boolean;
};

const RETRYABLE_TWILIO_ERRORS = new Set([
  '20429', // rate limited
  '30001', // queue overflow
  '30003', // unreachable destination handset
  '30004', // message blocked
  '30005', // unknown destination
  '30006', // landline / unreachable
  '30007', // carrier violation
]);

export function classifyTwilioError(err: unknown): TwilioSendError {
  const e = err as { code?: number | string; status?: number; message?: string } | null;
  const code = e?.code != null ? String(e.code) : null;
  const status = e?.status ?? 0;
  const retryable = (status >= 500 && status < 600) || (code !== null && RETRYABLE_TWILIO_ERRORS.has(code));
  return {
    code,
    message: e?.message ?? 'Twilio send failed',
    retryable,
  };
}
