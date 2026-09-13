import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Date and time functions return what LibreOffice returns, in every time zone.
 *
 * They did local-time arithmetic against `new Date(1899, 11, 30)`, so the answer
 * depended on where the browser was: DATE(2023,7,16) was 45122 in
 * America/Chicago in summer and in Asia/Kolkata all year, and DAY, WEEKDAY and
 * DATE were a day out in Pacific/Apia. Independently of the zone, HOUR, MINUTE
 * and SECOND truncated binary error (MINUTE(2.675) was 11), EDATE ran past the
 * end of a short month, DATEDIF counted a month before its day was reached, and
 * WEEKDAY type 3 counted from Sunday.
 *
 * Expectations come from tests/fixtures/libreoffice/datetime.json, produced by
 * scripts/libreoffice-goldens/build.mjs.
 */
interface DatetimeFixture {
  libreoffice: string;
  cases: Array<{ formula: string; result: number | string }>;
}

const fixture = JSON.parse(
  readFileSync(new URL("./fixtures/libreoffice/datetime.json", import.meta.url), "utf8"),
) as DatetimeFixture;

const ZONES = ["UTC", "America/Chicago", "Pacific/Apia", "Asia/Kolkata", "Australia/Lord_Howe"];
const originalTz = process.env.TZ;

/** Loads the engine fresh under `tz`, so nothing computed at import time leaks between zones. */
async function engineIn(tz: string) {
  process.env.TZ = tz;
  vi.resetModules();
  const { recalculateWorkbook } = await import("../src/engine/recalc");
  const { createEmptyWorkbook } = await import("../src/types/sheet");

  return (formulas: string[]) => {
    const wb = createEmptyWorkbook();
    formulas.forEach((formula, i) => {
      wb.sheets[0].cells[`A${i + 1}`] = { value: "", formula };
    });
    const cells = recalculateWorkbook(wb).sheets[0].cells;
    return formulas.map((_, i) => cells[`A${i + 1}`].computedValue);
  };
}

afterEach(() => {
  process.env.TZ = originalTz;
  vi.useRealTimers();
});

describe(`date functions match ${fixture.libreoffice}`, () => {
  for (const tz of ZONES) {
    it(`in ${tz}`, async () => {
      const evaluate = await engineIn(tz);
      const results = evaluate(fixture.cases.map((c) => c.formula));
      expect(fixture.cases.map((c, i) => `${c.formula} = ${results[i]}`)).toEqual(
        fixture.cases.map((c) => `${c.formula} = ${c.result}`),
      );
    });
  }
});

describe("the rest of the date contract", () => {
  for (const tz of ZONES) {
    it(`reads a YYYY-MM-DD string as that calendar date in ${tz}`, async () => {
      // holy-sheet's reader turns a date cell into exactly this string.
      const evaluate = await engineIn(tz);
      expect(evaluate(['DAY("2026-01-15")', 'MONTH("2026-01-15")', 'YEAR("2026-01-15")', 'WEEKDAY("2026-01-15")'])).toEqual([15, 1, 2026, 5]);
    });
  }

  it("TODAY and NOW use the user's own calendar date", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-07-16T11:30:00Z"));

    // 00:30 on the 17th in Apia (+13), 06:30 on the 16th in Chicago (-5).
    const apia = await engineIn("Pacific/Apia");
    expect(apia(["TODAY()", "NOW()"])).toEqual([45124, 45124 + 1800 / 86400]);

    const chicago = await engineIn("America/Chicago");
    expect(chicago(["TODAY()", "NOW()"])).toEqual([45123, 45123 + 23400 / 86400]);
  });

  it("reads a year below 100 as 1900 + year", async () => {
    // Excel's documented rule and this engine's behaviour before the rewrite.
    // LibreOffice windows two-digit years to 1930-2029, so it is not the reference here.
    const evaluate = await engineIn("UTC");
    const [short, long] = evaluate(["DATE(23,1,1)", "DATE(1923,1,1)"]);
    expect(short).toBe(long);
  });

  it("refuses a WEEKDAY return type it does not define", async () => {
    // LibreOffice answers Err:502 (invalid argument); Excel's error for it is #NUM!.
    const evaluate = await engineIn("UTC");
    expect(evaluate(["WEEKDAY(45123,4)"])).toEqual(["#NUM!"]);
  });
});
