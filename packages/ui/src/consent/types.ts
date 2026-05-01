// Consent categories follow the standard CCPA/GDPR cookie taxonomy:
//   essential   — strictly necessary; auth, CSRF, audit log; no consent option
//   functional  — locale, theme preference; on by default in our jurisdiction
//   analytics   — PostHog, feature flags identification; opt-in required
//   marketing   — ad pixels, retargeting; opt-in required
//
// Storing consent as a versioned record creates a "consent receipt" — the
// timestamp + version + choices can be cited as proof in a regulatory inquiry.
// When the categories or wording change, bumping CONSENT_VERSION re-prompts
// every user.

export const CONSENT_VERSION = 1;
export const CONSENT_STORAGE_KEY = 'agconn.consent.v1';

export type ConsentChoices = {
  essential: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

export type ConsentRecord = {
  version: number;
  ts: number;
  choices: ConsentChoices;
};

export const defaultDenyChoices: ConsentChoices = {
  essential: true,
  functional: true,
  analytics: false,
  marketing: false,
};

export const defaultAcceptChoices: ConsentChoices = {
  essential: true,
  functional: true,
  analytics: true,
  marketing: true,
};
