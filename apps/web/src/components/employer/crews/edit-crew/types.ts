import type {
  CrewView,
  CrewMemberView,
  CrewInsightsView,
  CrewColor,
  CrewType,
  CrewCrop,
  CrewSkill,
  CrewCommsChannels,
  ActiveHireView,
} from '@/lib/api/employer-ops';

// Form draft. Mirrors the PATCH body — bag-of-fields the editor mutates as
// the user works through the section rail. Member roster mutations are
// applied immediately against the API rather than batched in the draft.
export type CrewDraft = {
  name: string;
  shortCode: string;
  crewType: CrewType | '';
  primaryCrop: CrewCrop | '';
  color: CrewColor;
  requiredSkills: Set<CrewSkill>;
  baseWageCents: number | null;
  pieceRateCents: number | null;
  pieceRateUnit: string;
  foremanPremiumCents: number | null;
  commsChannels: CrewCommsChannels;
  notes: string;
  foremanUserId: string | null;
};

export type CrewEditorPageProps = {
  locale: string;
  mode: 'new' | 'edit';
  crew: CrewView | null;
  members: CrewMemberView[];
  insights: CrewInsightsView;
  hires: ActiveHireView[];
};

export const SECTION_IDS = [
  'basics',
  'foreman',
  'roster',
  'skills',
  'pay',
  'comms',
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const CREW_COLORS: { key: CrewColor; cssVar: string; hex: string; chip: string }[] = [
  { key: 'grape', cssVar: '#6B2B5E', hex: '#6B2B5E', chip: 'bg-[#6B2B5E]' },
  { key: 'almond', cssVar: '#C58A5A', hex: '#C58A5A', chip: 'bg-[#C58A5A]' },
  { key: 'citrus', cssVar: '#E07A1F', hex: '#E07A1F', chip: 'bg-[#E07A1F]' },
  { key: 'tomato', cssVar: '#C73E2A', hex: '#C73E2A', chip: 'bg-[#C73E2A]' },
  { key: 'lettuce', cssVar: '#4A8C3A', hex: '#4A8C3A', chip: 'bg-[#4A8C3A]' },
  { key: 'olive', cssVar: 'var(--color-primary)', hex: '#5B6E2E', chip: 'bg-primary' },
];

export const CREW_TYPES: CrewType[] = [
  'harvest',
  'setup',
  'sort',
  'irrigation',
  'pruning',
  'general',
];

export const CREW_CROPS: CrewCrop[] = [
  'grape',
  'almond',
  'citrus',
  'tomato',
  'lettuce',
  'strawberry',
];

export const CREW_SKILLS: CrewSkill[] = [
  'forklift',
  'cdl',
  'wps',
  'bilingual',
  'lead',
  'irrigation',
];

export const COMMS_KEYS = [
  'groupChat',
  'smsDigest',
  'voiceBroadcast',
] as const;
export type CommsKey = (typeof COMMS_KEYS)[number];

export function emptyDraft(): CrewDraft {
  return {
    name: '',
    shortCode: '',
    crewType: '',
    primaryCrop: '',
    color: 'olive',
    requiredSkills: new Set<CrewSkill>(),
    baseWageCents: null,
    pieceRateCents: null,
    pieceRateUnit: 'lb',
    foremanPremiumCents: null,
    commsChannels: {},
    notes: '',
    foremanUserId: null,
  };
}

export function draftFromCrew(c: CrewView): CrewDraft {
  return {
    name: c.name,
    shortCode: c.shortCode ?? '',
    crewType: (c.crewType as CrewType | null) ?? '',
    primaryCrop: (c.primaryCrop as CrewCrop | null) ?? '',
    color: c.color,
    requiredSkills: new Set<CrewSkill>(c.requiredSkills),
    baseWageCents: c.baseWageCents,
    pieceRateCents: c.pieceRateCents,
    pieceRateUnit: c.pieceRateUnit ?? 'lb',
    foremanPremiumCents: c.foremanPremiumCents,
    commsChannels: c.commsChannels ?? {},
    notes: c.notes ?? '',
    foremanUserId: c.foremanUserId,
  };
}
