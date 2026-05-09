import { prisma } from '@agconn/db';

const employer = await prisma.user.findFirst({
  where: { role: 'employer' },
  include: { employerProfile: true },
});
console.log('employer:', employer?.id, employer?.employerProfile?.legalName, 'h2a=', employer?.employerProfile?.participatesInH2a);

const periods = await prisma.payrollPeriod.findMany({
  where: { employerId: employer.id },
  orderBy: { startDate: 'desc' },
  take: 3,
});
console.log('periods:', periods.map(p => ({ id: p.id, start: p.startDate.toISOString().slice(0,10), end: p.endDate.toISOString().slice(0,10), status: p.status })));

const period = periods[0];
if (period) {
  const assignments = await prisma.shiftAssignment.findMany({
    where: {
      shift: { employerId: employer.id, shiftDate: { gte: period.startDate, lte: period.endDate } },
      status: { in: ['completed', 'confirmed'] },
    },
    include: { shift: { select: { shiftDate: true, shiftType: true, crew: { select: { baseWageCents: true } } } } },
  });
  console.log('assignments in period:', assignments.length);
  for (const a of assignments.slice(0, 5)) {
    console.log(' -', a.workerUserId.slice(0, 8), 'date=', a.shift.shiftDate.toISOString().slice(0,10), 'type=', a.shift.shiftType, 'hrs=', a.hoursWorked?.toString(), 'pieces=', a.piecesCount, 'pieceRate=', a.pieceRateCents, 'crewBase=', a.shift.crew?.baseWageCents);
  }

  const allAssignments = await prisma.shiftAssignment.count({
    where: { shift: { employerId: employer.id } },
  });
  console.log('total assignments any period:', allAssignments);
}
await prisma.$disconnect();
