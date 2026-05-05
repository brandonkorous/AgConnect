import type { CrewDraft } from './types';

export function draftsEqual(a: CrewDraft, b: CrewDraft): boolean {
  if (a.name !== b.name) return false;
  if (a.shortCode !== b.shortCode) return false;
  if (a.crewType !== b.crewType) return false;
  if (a.primaryCrop !== b.primaryCrop) return false;
  if (a.color !== b.color) return false;
  if (a.baseWageCents !== b.baseWageCents) return false;
  if (a.pieceRateCents !== b.pieceRateCents) return false;
  if (a.pieceRateUnit !== b.pieceRateUnit) return false;
  if (a.foremanPremiumCents !== b.foremanPremiumCents) return false;
  if (a.foremanUserId !== b.foremanUserId) return false;
  if (a.notes !== b.notes) return false;
  if (a.requiredSkills.size !== b.requiredSkills.size) return false;
  for (const s of a.requiredSkills) if (!b.requiredSkills.has(s)) return false;
  const aKeys = Object.keys(a.commsChannels) as (keyof typeof a.commsChannels)[];
  const bKeys = Object.keys(b.commsChannels) as (keyof typeof b.commsChannels)[];
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) if (a.commsChannels[k] !== b.commsChannels[k]) return false;
  return true;
}
