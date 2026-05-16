// Shared response-shaper for an employer-facing job. Returns the v2 detail
// shape (everything the Edit Job page needs); list/card endpoints pick a
// subset.

type Decimalish = { toString: () => string } | null;

export type JobRowFull = {
  id: string;
  seoSlug: string | null;
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  county: string;
  city: string | null;
  zipCode: string | null;
  wageMin: { toString: () => string };
  wageMax: { toString: () => string };
  wageUnit: string;
  startDate: Date;
  endDate: Date | null;
  applyBy: Date | null;
  skills: string[];
  housing: boolean;
  transport: boolean;
  positionsTotal: number;
  hireCount: number;
  status: string;
  publishedAt: Date | null;
  filledAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;

  cropId: string | null;
  roleTypeId: string | null;
  dailyStartTime: Date | null;
  dailyEndTime: Date | null;
  workingDays: number;
  wageStructure: 'hourly' | 'hourly_piece' | 'piece';
  pieceRate: Decimalish;
  pieceUnit: string | null;
  payFrequency: 'weekly' | 'biweekly' | 'daily';
  mealsProvided: boolean;
  endOfSeasonBonusCents: number | null;
  pickupPoint: string | null;
  minExperience: 'none' | 'one_year' | 'three_years' | 'five_years';
  minAge: 'sixteen' | 'eighteen' | 'twenty_one';
  autoMatchEnabled: boolean;
  autoTranslateEnabled: boolean;
  renotifyPaused: boolean;
  smsApplyEnabled: boolean;
  smsApplyKeyword: string | null;
  applicationDeadlineAt: Date | null;
  foremanContactId: string | null;
  siteAddress: string | null;
  siteAcres: Decimalish;
  siteLat: number | null;
  siteLng: number | null;
  humanId: string | null;
  autosavedAt: Date | null;

  foremanContact?: ContactRow | null;
  photos?: PhotoRow[];
  screeningQuestions?: ScreeningRow[];
};

type ContactRow = {
  id: string;
  name: string;
  phone: string;
  role: { key: string };
  languages: string[];
  sortOrder: number;
};

type PhotoRow = {
  id: string;
  url: string;
  captionEn: string | null;
  captionEs: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
};

type ScreeningRow = {
  id: string;
  sortOrder: number;
  questionEn: string;
  questionEs: string;
  answerType: 'yes_no' | 'text';
  required: boolean;
};

export function shapeJob(j: JobRowFull, counts: Record<string, number>) {
  return {
    id: j.id,
    seoSlug: j.seoSlug,
    titleEn: j.titleEn,
    titleEs: j.titleEs,
    descriptionEn: j.descriptionEn,
    descriptionEs: j.descriptionEs,
    county: j.county,
    city: j.city,
    wageMin: Number(j.wageMin.toString()),
    wageMax: Number(j.wageMax.toString()),
    wageUnit: j.wageUnit,
    startDate: dateOnly(j.startDate),
    endDate: j.endDate ? dateOnly(j.endDate) : null,
    employerName: '',
    employerVerified: true,
    skills: j.skills,
    housing: j.housing,
    transport: j.transport,
    positionsTotal: j.positionsTotal,
    hireCount: j.hireCount,
    status: j.status,
    publishedAt: j.publishedAt?.toISOString() ?? null,
    filledAt: j.filledAt?.toISOString() ?? null,
    closedAt: j.closedAt?.toISOString() ?? null,
    createdAt: j.createdAt.toISOString(),
    applicationCounts: {
      applied: counts.applied ?? 0,
      reviewed: counts.reviewed ?? 0,
      hired: counts.hired ?? 0,
      rejected: counts.rejected ?? 0,
    },

    cropId: j.cropId,
    roleTypeId: j.roleTypeId,
    dailyStartTime: timeOnly(j.dailyStartTime),
    dailyEndTime: timeOnly(j.dailyEndTime),
    workingDays: j.workingDays,
    wageStructure: j.wageStructure,
    pieceRate: j.pieceRate ? Number(j.pieceRate.toString()) : null,
    pieceUnit: j.pieceUnit,
    payFrequency: j.payFrequency,
    mealsProvided: j.mealsProvided,
    endOfSeasonBonusCents: j.endOfSeasonBonusCents,
    pickupPoint: j.pickupPoint,
    minExperience: j.minExperience,
    minAge: j.minAge,
    autoMatchEnabled: j.autoMatchEnabled,
    autoTranslateEnabled: j.autoTranslateEnabled,
    renotifyPaused: j.renotifyPaused,
    smsApplyEnabled: j.smsApplyEnabled,
    smsApplyKeyword: j.smsApplyKeyword,
    applicationDeadlineAt: j.applicationDeadlineAt?.toISOString() ?? null,
    foremanContactId: j.foremanContactId,
    foremanContact: j.foremanContact
      ? {
          id: j.foremanContact.id,
          name: j.foremanContact.name,
          phone: j.foremanContact.phone,
          role: j.foremanContact.role.key,
          languages: j.foremanContact.languages as ('en' | 'es')[],
          sortOrder: j.foremanContact.sortOrder,
        }
      : null,
    siteAddress: j.siteAddress,
    siteAcres: j.siteAcres ? Number(j.siteAcres.toString()) : null,
    siteLat: j.siteLat,
    siteLng: j.siteLng,
    humanId: j.humanId,
    autosavedAt: j.autosavedAt?.toISOString() ?? null,
    photos: (j.photos ?? []).map((p) => ({
      id: p.id,
      url: p.url,
      captionEn: p.captionEn,
      captionEs: p.captionEs,
      width: p.width,
      height: p.height,
      sortOrder: p.sortOrder,
    })),
    screeningQuestions: (j.screeningQuestions ?? []).map((q) => ({
      id: q.id,
      sortOrder: q.sortOrder,
      questionEn: q.questionEn,
      questionEs: q.questionEs,
      answerType: q.answerType,
      required: q.required,
    })),
  };
}

function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function timeOnly(d: Date | null): string | null {
  if (!d) return null;
  // Postgres TIME column round-trips through Date with the time portion in UTC.
  const h = d.getUTCHours().toString().padStart(2, '0');
  const m = d.getUTCMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}
