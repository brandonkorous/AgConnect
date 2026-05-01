import { SignJWT, jwtVerify, errors as joseErrors } from 'jose';

const ISSUER = 'agconn:waitlist';
const CONFIRM_AUDIENCE = 'agconn:waitlist:confirm';
const UNSUBSCRIBE_AUDIENCE = 'agconn:waitlist:unsubscribe';

let cachedSecret: Uint8Array | null = null;
function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const raw = process.env.WAITLIST_TOKEN_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error('WAITLIST_TOKEN_SECRET must be set to a string of 32+ characters');
  }
  cachedSecret = new TextEncoder().encode(raw);
  return cachedSecret;
}

type Payload = { waitlistId: string };

export async function signConfirmToken(waitlistId: string): Promise<string> {
  return new SignJWT({ waitlistId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setAudience(CONFIRM_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function signUnsubscribeToken(waitlistId: string): Promise<string> {
  return new SignJWT({ waitlistId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setAudience(UNSUBSCRIBE_AUDIENCE)
    .setIssuedAt()
    .sign(getSecret());
}

export type VerifyResult =
  | { ok: true; waitlistId: string }
  | { ok: false; reason: 'expired' | 'invalid' };

async function verifyFor(token: string, audience: string): Promise<VerifyResult> {
  try {
    const { payload } = await jwtVerify<Payload>(token, getSecret(), {
      issuer: ISSUER,
      audience,
    });
    if (typeof payload.waitlistId !== 'string' || payload.waitlistId.length === 0) {
      return { ok: false, reason: 'invalid' };
    }
    return { ok: true, waitlistId: payload.waitlistId };
  } catch (err) {
    if (err instanceof joseErrors.JWTExpired) return { ok: false, reason: 'expired' };
    return { ok: false, reason: 'invalid' };
  }
}

export const verifyConfirmToken = (token: string) => verifyFor(token, CONFIRM_AUDIENCE);
export const verifyUnsubscribeToken = (token: string) => verifyFor(token, UNSUBSCRIBE_AUDIENCE);
