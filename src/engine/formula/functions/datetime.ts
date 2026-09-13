import { registerFunction } from "./registry";
import { approxFloor, dateOfSerial, serialFromCivil, serialOfLocal, serialOfString } from "../../serial-date";

// Serial dates are days since 1899-12-30; see engine/serial-date.ts for why all
// of this is UTC arithmetic. Expectations in datetime.test.ts are what
// LibreOffice 26.2 returned for the same formulas.

function toSerial(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") return serialOfString(val);
  return NaN;
}

/** The time-of-day fraction of a serial. */
function fractionOf(serial: number): number {
  return serial - Math.floor(serial);
}

registerFunction("TODAY", () => serialOfLocal(new Date(), false));

registerFunction("NOW", () => serialOfLocal(new Date(), true));

registerFunction("DATE", (args) => {
  const flat = args.flat();
  const year = Number(flat[0]);
  const month = Number(flat[1]) - 1; // JS months are 0-based
  const day = Number(flat[2]);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return "#VALUE!";
  // A year below 100 is 1900 + year, as it always was here (JavaScript's local
  // Date constructor did it) and as Excel documents. LibreOffice windows it to
  // 1930-2029 instead, so DATE(23,1,1) is 1923 here and 2023 there.
  const y = Math.trunc(year);
  return serialFromCivil(y >= 0 && y < 100 ? 1900 + y : y, Math.trunc(month), Math.trunc(day));
});

registerFunction("YEAR", (args) => {
  const serial = toSerial(args.flat()[0]);
  if (isNaN(serial)) return "#VALUE!";
  return dateOfSerial(serial).getUTCFullYear();
});

registerFunction("MONTH", (args) => {
  const serial = toSerial(args.flat()[0]);
  if (isNaN(serial)) return "#VALUE!";
  return dateOfSerial(serial).getUTCMonth() + 1;
});

registerFunction("DAY", (args) => {
  const serial = toSerial(args.flat()[0]);
  if (isNaN(serial)) return "#VALUE!";
  return dateOfSerial(serial).getUTCDate();
});

// HOUR and MINUTE floor and SECOND rounds, each on its own, which is how
// LibreOffice answers: 23:59:59.99 is HOUR 23, MINUTE 59, SECOND 0.
registerFunction("HOUR", (args) => {
  const val = Number(args.flat()[0]);
  if (isNaN(val)) return "#VALUE!";
  return approxFloor(fractionOf(val) * 24);
});

registerFunction("MINUTE", (args) => {
  const val = Number(args.flat()[0]);
  if (isNaN(val)) return "#VALUE!";
  return approxFloor(fractionOf(val) * 1440) % 60;
});

registerFunction("SECOND", (args) => {
  const val = Number(args.flat()[0]);
  if (isNaN(val)) return "#VALUE!";
  return Math.round(fractionOf(val) * 86400) % 60;
});

registerFunction("WEEKDAY", (args) => {
  const flat = args.flat();
  const serial = toSerial(flat[0]);
  if (isNaN(serial)) return "#VALUE!";
  const day = dateOfSerial(serial).getUTCDay(); // 0=Sun, 6=Sat
  const type = Number(flat[1] ?? 1);
  if (type === 1) return day + 1; // 1=Sun, 7=Sat (the default)
  if (type === 2) return day === 0 ? 7 : day; // 1=Mon, 7=Sun
  if (type === 3) return (day + 6) % 7; // 0=Mon, 6=Sun
  if (type >= 11 && type <= 17) return ((day - ((type - 10) % 7) + 7) % 7) + 1; // 1 = Mon (11) ... Sun (17)
  return "#NUM!";
});

registerFunction("DATEDIF", (args) => {
  const flat = args.flat();
  const startSerial = toSerial(flat[0]);
  const endSerial = toSerial(flat[1]);
  const unit = String(flat[2] ?? "D").toUpperCase();
  if (isNaN(startSerial) || isNaN(endSerial)) return "#VALUE!";
  if (unit === "D") return Math.floor(endSerial) - Math.floor(startSerial);

  // Complete months: a month only counts once its day of the month is reached.
  const start = dateOfSerial(startSerial);
  const end = dateOfSerial(endSerial);
  const months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth()) -
    (end.getUTCDate() < start.getUTCDate() ? 1 : 0);
  if (unit === "M") return months;
  if (unit === "Y") return Math.floor(months / 12);
  return "#VALUE!";
});

registerFunction("EDATE", (args) => {
  const flat = args.flat();
  const serial = toSerial(flat[0]);
  const months = Number(flat[1]);
  if (isNaN(serial) || isNaN(months)) return "#VALUE!";
  const d = dateOfSerial(serial);
  const target = d.getUTCMonth() + Math.trunc(months);
  // The same day in the target month, or its last day when that month is shorter.
  const lastDay = new Date(Date.UTC(2000, 0, 1));
  lastDay.setUTCFullYear(d.getUTCFullYear(), target + 1, 0);
  return serialFromCivil(d.getUTCFullYear(), target, Math.min(d.getUTCDate(), lastDay.getUTCDate()));
});
