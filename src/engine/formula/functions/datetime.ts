import { registerFunction } from "./registry";

// Excel serial date: days since 1900-01-01 (with the 1900 leap year bug)
const EXCEL_EPOCH = new Date(1899, 11, 30).getTime(); // Dec 30, 1899

function dateToSerial(d: Date): number {
  const ms = d.getTime() - EXCEL_EPOCH;
  return Math.floor(ms / 86400000);
}

function serialToDate(serial: number): Date {
  return new Date(EXCEL_EPOCH + serial * 86400000);
}

function toSerial(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return dateToSerial(d);
  }
  return NaN;
}

registerFunction("TODAY", () => {
  return dateToSerial(new Date());
});

registerFunction("NOW", () => {
  const now = new Date();
  const serial = dateToSerial(now);
  const fraction = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400;
  return serial + fraction;
});

registerFunction("DATE", (args) => {
  const flat = args.flat();
  const year = Number(flat[0]);
  const month = Number(flat[1]) - 1; // JS months are 0-based
  const day = Number(flat[2]);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return "#VALUE!";
  return dateToSerial(new Date(year, month, day));
});

registerFunction("YEAR", (args) => {
  const serial = toSerial(args.flat()[0]);
  if (isNaN(serial)) return "#VALUE!";
  return serialToDate(serial).getFullYear();
});

registerFunction("MONTH", (args) => {
  const serial = toSerial(args.flat()[0]);
  if (isNaN(serial)) return "#VALUE!";
  return serialToDate(serial).getMonth() + 1;
});

registerFunction("DAY", (args) => {
  const serial = toSerial(args.flat()[0]);
  if (isNaN(serial)) return "#VALUE!";
  return serialToDate(serial).getDate();
});

registerFunction("HOUR", (args) => {
  const val = Number(args.flat()[0]);
  if (isNaN(val)) return "#VALUE!";
  const fraction = val % 1;
  return Math.floor(fraction * 24);
});

registerFunction("MINUTE", (args) => {
  const val = Number(args.flat()[0]);
  if (isNaN(val)) return "#VALUE!";
  const fraction = val % 1;
  return Math.floor((fraction * 24 * 60) % 60);
});

registerFunction("SECOND", (args) => {
  const val = Number(args.flat()[0]);
  if (isNaN(val)) return "#VALUE!";
  const fraction = val % 1;
  return Math.floor((fraction * 24 * 3600) % 60);
});

registerFunction("WEEKDAY", (args) => {
  const flat = args.flat();
  const serial = toSerial(flat[0]);
  if (isNaN(serial)) return "#VALUE!";
  const day = serialToDate(serial).getDay(); // 0=Sun, 6=Sat
  const type = Number(flat[1] ?? 1);
  if (type === 1) return day + 1;     // 1=Sun, 7=Sat (Excel default)
  if (type === 2) return day === 0 ? 7 : day; // 1=Mon, 7=Sun
  return day; // 0-based
});

registerFunction("DATEDIF", (args) => {
  const flat = args.flat();
  const startSerial = toSerial(flat[0]);
  const endSerial = toSerial(flat[1]);
  const unit = String(flat[2] ?? "D").toUpperCase();
  if (isNaN(startSerial) || isNaN(endSerial)) return "#VALUE!";
  const startDate = serialToDate(startSerial);
  const endDate = serialToDate(endSerial);
  if (unit === "D") return Math.floor(endSerial - startSerial);
  if (unit === "M") {
    return (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());
  }
  if (unit === "Y") return endDate.getFullYear() - startDate.getFullYear();
  return "#VALUE!";
});

registerFunction("EDATE", (args) => {
  const flat = args.flat();
  const serial = toSerial(flat[0]);
  const months = Number(flat[1]);
  if (isNaN(serial) || isNaN(months)) return "#VALUE!";
  const d = serialToDate(serial);
  d.setMonth(d.getMonth() + months);
  return dateToSerial(d);
});
