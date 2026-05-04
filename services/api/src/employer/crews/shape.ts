import type { Crew, CrewMember, Prisma } from '@agconn/db';

type CrewWithCount = Crew;

export function shapeCrew(
  c: CrewWithCount,
  counts: {
    memberCount: number;
    activeMemberCount: number;
    foremanName?: string | null;
    jobTitle?: string | null;
  },
) {
  return {
    id: c.id,
    tenantId: c.tenantId,
    employerId: c.employerId,
    foremanUserId: c.foremanUserId,
    foremanName: counts.foremanName ?? null,
    jobId: c.jobId,
    jobTitle: counts.jobTitle ?? null,
    name: c.name,
    shortCode: c.shortCode,
    crewType: c.crewType,
    primaryCrop: c.primaryCrop,
    color: c.color,
    requiredSkills: c.requiredSkills,
    baseWageCents: c.baseWageCents,
    pieceRateCents: c.pieceRateCents,
    pieceRateUnit: c.pieceRateUnit,
    foremanPremiumCents: c.foremanPremiumCents,
    commsChannels: (c.commsChannels ?? {}) as Prisma.JsonObject,
    notes: c.notes,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    memberCount: counts.memberCount,
    activeMemberCount: counts.activeMemberCount,
  };
}

export function shapeMember(m: CrewMember, firstName: string, lastName: string) {
  return {
    id: m.id,
    crewId: m.crewId,
    workerUserId: m.workerUserId,
    firstName,
    lastInitial: (lastName[0] ?? '').toUpperCase(),
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
    leftAt: m.leftAt?.toISOString() ?? null,
  };
}
