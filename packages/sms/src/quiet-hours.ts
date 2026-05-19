import { DateTime } from 'luxon';

const TZ = 'America/Los_Angeles';
const START_HOUR = 21;
const END_HOUR = 7;

export function isQuietHours(now: DateTime = DateTime.now()): boolean {
  // Pre-launch / staging escape hatch. When SMS_QUIET_HOURS_DISABLED is
  // truthy, every hour counts as sendable so a single tester isn't blocked by
  // the 9PM-7AM PT window. Gated here because both the producer
  // (computeQuietHoursDefer) and the worker's pre-send check call this — one
  // switch covers the whole path. MUST be unset before real workers are on
  // the platform: quiet-hours compliance is a TCPA/FCC legal requirement, not
  // a preference.
  const disabled = process.env.SMS_QUIET_HOURS_DISABLED;
  if (disabled === '1' || disabled === 'true') return false;
  const local = now.setZone(TZ);
  return local.hour >= START_HOUR || local.hour < END_HOUR;
}

export function computeQuietHoursDefer(now: DateTime = DateTime.now()): Date {
  const local = now.setZone(TZ);
  if (!isQuietHours(local)) {
    return now.toJSDate();
  }
  let target = local.set({ hour: END_HOUR, minute: 0, second: 0, millisecond: 0 });
  if (local.hour >= START_HOUR) {
    target = target.plus({ days: 1 });
  }
  return target.toJSDate();
}
