import { DateTime } from 'luxon';

const TZ = 'America/Los_Angeles';
const START_HOUR = 21;
const END_HOUR = 7;

export function isQuietHours(now: DateTime = DateTime.now()): boolean {
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
