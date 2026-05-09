// AB 1513 (CA Labor Code §226.2) + AEWR (federal H-2A) payroll calculation.
//
// Pure functions, no I/O. Inputs are shift assignments + a calc context;
// output is one PayrollLine result per worker. Re-run cheap, easy to test.
//
// AB 1513 rules implemented:
//   - Piece-rate productive time pays sum(pieces × rate). If the workweek
//     piece-rate average falls below the applicable minimum wage, the line
//     is topped up to minimum (regular pay column).
//   - Non-productive time (shift_type = 'training' here) pays the
//     applicable hourly rate, floored at minimum wage.
//   - Rest-and-recovery periods are imputed at 10 min per 4 hours of
//     piece-rate work and paid SEPARATELY at the HIGHER of the workweek
//     average hourly rate (excluding rest pay) or the applicable minimum.
//
// AEWR rule: when isH2a is true, the wage floor for ALL hours is
// max(state minimum, AEWR, contract rate). Top-up is recorded in
// aewrTopUpCents and applied to the gross.
//
// What's intentionally NOT in this MVP: 3/4 guarantee (multi-period),
// transport/housing reimbursement, daily double-time at >12h/day, daily
// vs weekly OT max-of-the-two refinement (see comment below).

export type CalcAssignment = {
  workerId: string;
  shiftDate: Date;
  shiftType: 'work' | 'training' | 'off' | 'holiday';
  hoursWorked: number;
  piecesCount: number;
  pieceRateCents: number;
  hourlyRateCents: number;
};

export type CalcContext = {
  isH2a: boolean;
  stateCode: string;
  aewrHourlyCents: number | null;
  stateMinWageCents: number;
  contractHourlyCents: number;
  taxRate: number;
};

export type LineResult = {
  workerId: string;
  hours: number;
  overtimeHours: number;
  nonProductiveHours: number;
  restPeriodHours: number;
  regularPayCents: number;
  overtimePayCents: number;
  pieceRatePayCents: number;
  nonProductivePayCents: number;
  restPeriodPayCents: number;
  aewrTopUpCents: number;
  appliedFloorCents: number;
  isH2a: boolean;
  grossCents: number;
  bonusCents: number;
  taxesCents: number;
  netCents: number;
};

const REST_FACTOR = 1 / 24;

export function effectiveFloorCents(ctx: CalcContext): number {
  return Math.max(
    ctx.stateMinWageCents,
    ctx.isH2a ? (ctx.aewrHourlyCents ?? 0) : 0,
    ctx.contractHourlyCents,
  );
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function computeOvertimeHours(byDay: Map<string, number>): {
  overtime: number;
  regular: number;
} {
  let dailyOTSum = 0;
  let totalHours = 0;
  for (const dayHours of byDay.values()) {
    totalHours += dayHours;
    if (dayHours > 8) dailyOTSum += dayHours - 8;
  }
  const weeklyOT = Math.max(0, totalHours - 40);
  // CA rule: take the larger so workers aren't shorted. We don't double-count
  // because each rule applies to a different slice — when both fire, the
  // result is whichever is higher, not their sum.
  const overtime = Math.max(dailyOTSum, weeklyOT);
  return { overtime, regular: Math.max(0, totalHours - overtime) };
}

function roundCents(v: number): number {
  return Math.round(v);
}

export function calcWorker(
  workerId: string,
  assignments: CalcAssignment[],
  ctx: CalcContext,
): LineResult {
  let pieceRateHours = 0;
  let regularHourlyHours = 0;
  let nonProductiveHours = 0;
  let pieceRatePayCents = 0;

  const productiveByDay = new Map<string, number>();

  for (const a of assignments) {
    if (a.workerId !== workerId) continue;
    if (a.shiftType === 'off' || a.shiftType === 'holiday') continue;

    const hrs = Math.max(0, a.hoursWorked);

    if (a.shiftType === 'training') {
      nonProductiveHours += hrs;
      continue;
    }

    if (a.pieceRateCents > 0 && a.piecesCount > 0) {
      pieceRateHours += hrs;
      pieceRatePayCents += a.piecesCount * a.pieceRateCents;
    } else {
      regularHourlyHours += hrs;
    }

    const k = dayKey(a.shiftDate);
    productiveByDay.set(k, (productiveByDay.get(k) ?? 0) + hrs);
  }

  const productiveHours = pieceRateHours + regularHourlyHours;
  const restPeriodHours = round2(pieceRateHours * REST_FACTOR);

  const { overtime, regular } = computeOvertimeHours(productiveByDay);

  const floor = effectiveFloorCents(ctx);

  // Regular pay floor split: hourly productive hours get paid at the
  // contract hourly rate (or floor, whichever is higher). Piece-rate
  // productive hours are valued via piecesPay; if piece-rate average <
  // floor, the difference is the AB 1513 minimum-wage top-up booked on
  // regularPayCents below.
  const regularNonOT = Math.max(0, regular - regularHourlyHours);
  // ^ piece-rate slice within "regular" hours, used only for floor checks.

  const hourlyRateCents = Math.max(ctx.contractHourlyCents, floor);
  const hourlyRegularCents = roundCents(
    Math.min(regular, regularHourlyHours) * hourlyRateCents,
  );

  // Piece-rate floor check (AB 1513): pay is min(piecePay, floor*hours)
  // top-up. This only applies to piece-rate slice of regular hours; OT is
  // computed on the higher-of basis below.
  const pieceFloorPay = roundCents(regularNonOT * floor);
  const pieceRegularPay = roundCents(
    pieceRateHours > 0
      ? (pieceRatePayCents * Math.min(regularNonOT, pieceRateHours)) / pieceRateHours
      : 0,
  );
  const pieceTopUp = Math.max(0, pieceFloorPay - pieceRegularPay);

  const regularPayCents = hourlyRegularCents + pieceTopUp;

  // Overtime premium = 0.5× of base. Base for OT is the regular rate
  // (hourly rate) or piece-rate effective hourly average — use the higher
  // for piece-rate workers. Multiply by overtime hours.
  const pieceAvgHourly =
    pieceRateHours > 0 ? pieceRatePayCents / pieceRateHours : 0;
  const otBaseCents = Math.max(hourlyRateCents, pieceAvgHourly);
  const overtimePayCents = roundCents(overtime * otBaseCents * 0.5);

  // Non-productive time pays at the higher of contract hourly rate or floor.
  const nonProductivePayCents = roundCents(nonProductiveHours * Math.max(hourlyRateCents, floor));

  // Rest-period pay (AB 1513): higher of workweek average hourly or floor.
  // Workweek average = total comp (excluding rest pay) / total hours worked
  // (excluding rest hours).
  const totalCompForAvg =
    pieceRatePayCents + hourlyRegularCents + overtimePayCents + nonProductivePayCents;
  const totalHoursForAvg = productiveHours + nonProductiveHours;
  const workweekAvgHourly = totalHoursForAvg > 0 ? totalCompForAvg / totalHoursForAvg : 0;
  const restRateCents = Math.max(workweekAvgHourly, floor);
  const restPeriodPayCents = roundCents(restPeriodHours * restRateCents);

  // AEWR top-up: only for H-2A workers. Floor for ALL productive +
  // non-productive hours is the effective floor. Sum of regular +
  // overtime base + piece + non-productive should already be at or above
  // floor, but if the contract rate is below AEWR, top up.
  let aewrTopUpCents = 0;
  if (ctx.isH2a && ctx.aewrHourlyCents) {
    const expectedFloor = roundCents(totalHoursForAvg * ctx.aewrHourlyCents);
    const paidSoFar = pieceRatePayCents + regularPayCents + overtimePayCents + nonProductivePayCents;
    aewrTopUpCents = Math.max(0, expectedFloor - paidSoFar);
  }

  const grossCents =
    pieceRatePayCents +
    regularPayCents +
    overtimePayCents +
    nonProductivePayCents +
    restPeriodPayCents +
    aewrTopUpCents;

  const taxesCents = roundCents(grossCents * ctx.taxRate);
  const netCents = grossCents - taxesCents;

  return {
    workerId,
    hours: round2(productiveHours),
    overtimeHours: round2(overtime),
    nonProductiveHours: round2(nonProductiveHours),
    restPeriodHours,
    regularPayCents,
    overtimePayCents,
    pieceRatePayCents,
    nonProductivePayCents,
    restPeriodPayCents,
    aewrTopUpCents,
    appliedFloorCents: floor,
    isH2a: ctx.isH2a,
    grossCents,
    bonusCents: pieceRatePayCents,
    taxesCents,
    netCents,
  };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

// California 2026 statewide minimum wage. Statewide minimum applies to
// agricultural workers; some industries (fast-food) have higher floors,
// not relevant here. Source: CA DIR §1182.12, effective 2026-01-01.
export const CA_STATE_MIN_WAGE_CENTS_2026 = 1650;

// Default contract rate when neither the crew base wage nor the job
// posting hourly rate is known. Mirrors prior generate-lines default.
export const DEFAULT_CONTRACT_HOURLY_CENTS = 2000;

// Tax approximation. Federal + CA flat estimate used for net-pay display.
// Real W-4/DE 4 withholding is post-MVP.
export const DEFAULT_TAX_RATE = 0.142;
