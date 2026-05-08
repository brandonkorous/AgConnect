import { createHmac, timingSafeEqual } from 'node:crypto';

type KeyEntry = { version: number; key: Buffer };

class HmacKeyStore {
  private entries: Map<number, Buffer> = new Map();
  private latestVersion: number | null = null;

  load(version: number, key: Buffer): void {
    if (key.length < 32) {
      throw new Error(
        `audit HMAC key v${version} too short (${key.length} bytes); minimum 32 bytes`,
      );
    }
    this.entries.set(version, key);
    if (this.latestVersion === null || version > this.latestVersion) {
      this.latestVersion = version;
    }
  }

  current(): KeyEntry {
    if (this.latestVersion === null) {
      throw new Error(
        'audit HMAC key store empty — set AUDIT_HMAC_KEY (base64) and AUDIT_HMAC_KEY_VERSION',
      );
    }
    const key = this.entries.get(this.latestVersion);
    if (!key) {
      throw new Error(`audit HMAC key v${this.latestVersion} disappeared from store`);
    }
    return { version: this.latestVersion, key };
  }

  forVersion(version: number): KeyEntry | null {
    const key = this.entries.get(version);
    return key ? { version, key } : null;
  }

  versions(): number[] {
    return [...this.entries.keys()].sort((a, b) => a - b);
  }
}

export const hmacKeys = new HmacKeyStore();

let initialized = false;

// Loads HMAC keys from env. Production flow: GitHub Actions secret → GKE
// Secret → pod env, so this single env-loaded path covers dev + prod.
//
// Format:
//   AUDIT_HMAC_KEY            — current key, base64-encoded (≥32 bytes)
//   AUDIT_HMAC_KEY_VERSION    — integer (default 1)
//   AUDIT_HMAC_KEYS_PRIOR     — JSON array of {v, k} for old versions still
//                               needed to verify historic rows. Optional.
export const initHmacKeysFromEnv = (): void => {
  if (initialized) return;

  const primary = process.env.AUDIT_HMAC_KEY;
  if (!primary) {
    throw new Error(
      'AUDIT_HMAC_KEY is not set — required for audit log integrity. Generate with `openssl rand -base64 48`.',
    );
  }
  const version = Number(process.env.AUDIT_HMAC_KEY_VERSION ?? '1');
  if (!Number.isInteger(version) || version < 1) {
    throw new Error(
      `AUDIT_HMAC_KEY_VERSION must be a positive integer; got ${JSON.stringify(process.env.AUDIT_HMAC_KEY_VERSION)}`,
    );
  }
  hmacKeys.load(version, Buffer.from(primary, 'base64'));

  const priorRaw = process.env.AUDIT_HMAC_KEYS_PRIOR;
  if (priorRaw) {
    const prior = JSON.parse(priorRaw) as Array<{ v: number; k: string }>;
    for (const { v, k } of prior) hmacKeys.load(v, Buffer.from(k, 'base64'));
  }

  initialized = true;
};

export const computeHmac = (canonical: string, key: Buffer): Buffer =>
  createHmac('sha256', key).update(canonical, 'utf8').digest();

export const verifyHmac = (canonical: string, expected: Buffer, key: Buffer): boolean => {
  const actual = computeHmac(canonical, key);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
};
