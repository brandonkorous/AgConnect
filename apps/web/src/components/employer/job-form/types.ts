// Form-state shape that mirrors the API contract. Components read+write this
// via a single `update` callback so each section stays small and stateless.

import type {
  EmployerJobView,
  WageStructure,
  PayFrequency,
  MinExperience,
  MinAge,
  JobPhotoView,
  JobScreeningQuestionView,
} from '@/lib/api/employer';

export type JobFormState = {
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  county: string;
  city: string;
  cropId: string | null;
  roleTypeId: string | null;
  positionsTotal: number;

  startDate: string; // YYYY-MM-DD
  endDate: string;
  dailyStartTime: string; // HH:MM
  dailyEndTime: string;
  workingDays: number;

  wageStructure: WageStructure;
  wageMin: number;
  wageMax: number;
  pieceRate: number | null;
  pieceUnit: string | null;
  payFrequency: PayFrequency;
  mealsProvided: boolean;
  endOfSeasonBonusCents: number | null;

  skills: string[];
  minExperience: MinExperience;
  minAge: MinAge;
  autoMatchEnabled: boolean;

  siteAddress: string;
  siteAcres: number | null;
  siteLat: number | null;
  siteLng: number | null;
  zipCode: string;
  pickupPoint: string;
  transport: boolean;
  housing: boolean;

  smsApplyEnabled: boolean;
  autoTranslateEnabled: boolean;
  foremanContactId: string | null;
  applicationDeadlineAt: string; // ISO datetime

  photos: JobPhotoView[];
  screeningQuestions: JobScreeningQuestionView[];
};

export type JobFormUpdate = (patch: Partial<JobFormState>) => void;

export function fromView(j: EmployerJobView | undefined): JobFormState {
  return {
    titleEn: j?.titleEn ?? '',
    titleEs: j?.titleEs ?? '',
    descriptionEn: j?.descriptionEn ?? '',
    descriptionEs: j?.descriptionEs ?? '',
    county: j?.county ?? 'Madera',
    city: j?.city ?? '',
    cropId: j?.cropId ?? null,
    roleTypeId: j?.roleTypeId ?? null,
    positionsTotal: j?.positionsTotal ?? 1,

    startDate: j?.startDate ?? '',
    endDate: j?.endDate ?? '',
    dailyStartTime: j?.dailyStartTime ?? '',
    dailyEndTime: j?.dailyEndTime ?? '',
    workingDays: j?.workingDays ?? 31,

    wageStructure: j?.wageStructure ?? 'hourly',
    wageMin: j?.wageMin ?? 0,
    wageMax: j?.wageMax ?? 0,
    pieceRate: j?.pieceRate ?? null,
    pieceUnit: j?.pieceUnit ?? null,
    payFrequency: j?.payFrequency ?? 'weekly',
    mealsProvided: j?.mealsProvided ?? false,
    endOfSeasonBonusCents: j?.endOfSeasonBonusCents ?? null,

    skills: j?.skills ?? [],
    minExperience: j?.minExperience ?? 'none',
    minAge: j?.minAge ?? 'eighteen',
    autoMatchEnabled: j?.autoMatchEnabled ?? true,

    siteAddress: j?.siteAddress ?? '',
    siteAcres: j?.siteAcres ?? null,
    siteLat: j?.siteLat ?? null,
    siteLng: j?.siteLng ?? null,
    zipCode: j?.zipCode ?? '',
    pickupPoint: j?.pickupPoint ?? '',
    transport: j?.transport ?? false,
    housing: j?.housing ?? false,

    smsApplyEnabled: j?.smsApplyEnabled ?? true,
    autoTranslateEnabled: j?.autoTranslateEnabled ?? true,
    foremanContactId: j?.foremanContactId ?? null,
    applicationDeadlineAt: j?.applicationDeadlineAt ?? '',

    photos: j?.photos ?? [],
    screeningQuestions: j?.screeningQuestions ?? [],
  };
}

export function toApiBody(s: JobFormState): Record<string, unknown> {
  return {
    titleEn: s.titleEn,
    titleEs: s.titleEs,
    descriptionEn: s.descriptionEn,
    descriptionEs: s.descriptionEs,
    county: s.county,
    city: s.city || undefined,
    cropId: s.cropId,
    roleTypeId: s.roleTypeId,
    positionsTotal: s.positionsTotal,
    startDate: s.startDate,
    endDate: s.endDate || undefined,
    dailyStartTime: s.dailyStartTime || null,
    dailyEndTime: s.dailyEndTime || null,
    workingDays: s.workingDays,
    wageStructure: s.wageStructure,
    wageMin: s.wageMin,
    wageMax: s.wageMax,
    wageUnit: 'hour',
    pieceRate: s.wageStructure === 'hourly' ? null : s.pieceRate,
    pieceUnit: s.wageStructure === 'hourly' ? null : s.pieceUnit,
    payFrequency: s.payFrequency,
    mealsProvided: s.mealsProvided,
    endOfSeasonBonusCents: s.endOfSeasonBonusCents,
    skills: s.skills,
    minExperience: s.minExperience,
    minAge: s.minAge,
    autoMatchEnabled: s.autoMatchEnabled,
    siteAddress: s.siteAddress || null,
    siteAcres: s.siteAcres,
    zipCode: s.zipCode || null,
    pickupPoint: s.pickupPoint || null,
    transport: s.transport,
    housing: s.housing,
    smsApplyEnabled: s.smsApplyEnabled,
    autoTranslateEnabled: s.autoTranslateEnabled,
    foremanContactId: s.foremanContactId,
    applicationDeadlineAt: s.applicationDeadlineAt || null,
  };
}

// Working-days bitmask helpers — bit 0 = Mon, bit 6 = Sun.
export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export function dayBit(d: Weekday): number {
  return 1 << WEEKDAYS.indexOf(d);
}
export function isDayOn(mask: number, d: Weekday): boolean {
  return (mask & dayBit(d)) !== 0;
}
export function toggleDay(mask: number, d: Weekday): number {
  return mask ^ dayBit(d);
}
