/**
 * Spreadsheet serial dates: whole days since 1899-12-30, the time of day as the
 * fraction.
 *
 * Every conversion here is UTC arithmetic on the CALENDAR date. The engine used
 * `new Date(1899, 11, 30)` and local-time arithmetic, which is wrong wherever the
 * zone's offset today differs from its offset in 1899 or across daylight saving:
 * `DATE(2023,7,16)` was 45122 rather than 45123 in America/Chicago in summer and
 * in Asia/Kolkata all year, and every date cell showed the day after in
 * Pacific/Apia.
 *
 * Only `TODAY()` and `NOW()` read local time, because "today" is the user's.
 */

const EPOCH_MS = Date.UTC(1899, 11, 30);
export const DAY_MS = 86_400_000;

/** Serial of a calendar date. Months and days overflow as `DATE()` does: month 13 is January next year. */
export function serialFromCivil(year: number, monthIndex: number, day: number): number {
  const utc = new Date(0);
  utc.setUTCFullYear(year, monthIndex, day);
  utc.setUTCHours(0, 0, 0, 0);
  return Math.round((utc.getTime() - EPOCH_MS) / DAY_MS);
}

/** The calendar date of a serial's whole day, as a Date whose UTC fields are that date. */
export function dateOfSerial(serial: number): Date {
  return new Date(EPOCH_MS + Math.floor(serial) * DAY_MS);
}

/** Today's serial in the user's own time zone; with `withTime`, NOW(). */
export function serialOfLocal(now: Date, withTime: boolean): number {
  const day = serialFromCivil(now.getFullYear(), now.getMonth(), now.getDate());
  if (!withTime) return day;
  return day + (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400;
}

/**
 * Serial of a date string. A bare `YYYY-MM-DD` is that calendar date (JavaScript
 * would parse it as UTC midnight and a local reading would move it); anything
 * else is read in local time, as the user typed it.
 */
export function serialOfString(text: string): number {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim());
  if (iso) return serialFromCivil(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const parsed = new Date(text);
  if (isNaN(parsed.getTime())) return NaN;
  return serialFromCivil(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

/** Floor after rounding to 15 significant digits, so 971.9999999999997 is 972. */
export function approxFloor(value: number): number {
  return Math.floor(Number(value.toPrecision(15)));
}
