import type { Shift } from '@agconn/db';

export function shapeShift(
  s: Shift,
  extras: { crewName: string | null; assignedCount: number; confirmedCount: number },
) {
  return {
    id: s.id,
    tenantId: s.tenantId,
    employerId: s.employerId,
    crewId: s.crewId,
    crewName: extras.crewName,
    jobId: s.jobId,
    shiftDate: s.shiftDate.toISOString().slice(0, 10),
    startTime: s.startTime,
    endTime: s.endTime,
    locationLabel: s.locationLabel,
    locationLat: s.locationLat ? Number(s.locationLat.toString()) : null,
    locationLng: s.locationLng ? Number(s.locationLng.toString()) : null,
    status: s.status,
    notes: s.notes,
    assignedCount: extras.assignedCount,
    confirmedCount: extras.confirmedCount,
    capacity: null as number | null,
  };
}
