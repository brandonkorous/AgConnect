import type { Crew, CrewMember } from '@agconn/db';

type CrewWithCount = Crew;

export function shapeCrew(
  c: CrewWithCount,
  counts: { memberCount: number; activeMemberCount: number },
) {
  return {
    id: c.id,
    tenantId: c.tenantId,
    employerId: c.employerId,
    foremanUserId: c.foremanUserId,
    jobId: c.jobId,
    name: c.name,
    color: c.color,
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
