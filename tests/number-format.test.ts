import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { displayFormatCode, formatCellValue } from "../src/engine/cell-display";
import { formatWithCode } from "../src/engine/number-format";
import { recalculateWorkbook } from "../src/engine/recalc";
import { createEmptyWorkbook } from "../src/types/sheet";
import type { CellFormat } from "../src/types/cell";

/**
 * A formatted number shows what a spreadsheet application shows.
 *
 * The grid ignored most of a cell's format: `currency` was always "$" with no
 * thousands separator and ignored `currency`, `number` without `decimals` showed
 * the raw double, and every rounding went through `toFixed`, so 1.005 showed as
 * 1.00. A workbook holy-sheet read back displayed "1250000.5" for a cell its file
 * formats as "$1,250,000.50". `TEXT()` knew `0.00` and `%` and nothing else.
 *
 * Every expectation comes from tests/fixtures/libreoffice, which
 * scripts/libreoffice-goldens/build.mjs produces by writing these cases through
 * holy-sheet and letting LibreOffice display them.
 */
const fixture = <T>(name: string): T =>
  JSON.parse(readFileSync(new URL(`./fixtures/libreoffice/${name}`, import.meta.url), "utf8")) as T;

interface DisplayFixture {
  values: number[];
  columns: Array<{ header: string; format: CellFormat; code: string; shown: string[] }>;
}

interface TextFixture {
  values: number[];
  codes: string[];
  shown: string[][];
}

describe("a formatted cell displays as the exported file does", () => {
  const display = fixture<DisplayFixture>("display.json");

  for (const column of display.columns) {
    it(`${column.header} uses the code holy-sheet writes, ${column.code}`, () => {
      expect(displayFormatCode(column.format)).toBe(column.code);
    });

    it(`${column.header} shows every value as LibreOffice does`, () => {
      const shown = display.values.map((value) => formatCellValue(value, { value, format: column.format }));
      expect(shown).toEqual(column.shown);
    });
  }
});

describe("formatWithCode matches LibreOffice's TEXT()", () => {
  const text = fixture<TextFixture>("text.json");

  // A/P is compared separately below; a date past 9999-12-31 is LibreOffice's
  // "#FMT", which TEXT() reports as #VALUE!.
  const comparedSeparately = (code: string, shown: string) => code === "h:mm A/P" || shown === "#FMT";

  text.codes.forEach((code, c) => {
    it(`renders ${code}`, () => {
      const expected: string[] = [];
      const actual: string[] = [];
      text.values.forEach((value, r) => {
        const shown = text.shown[r][c];
        if (comparedSeparately(code, shown)) return;
        expected.push(`${value} -> ${shown}`);
        actual.push(`${value} -> ${formatWithCode(value, code)}`);
      });
      expect(actual).toEqual(expected);
    });
  });

  it("reports a date past 9999-12-31 as unrenderable", () => {
    expect(formatWithCode(123456789, "yyyy-mm-dd")).toBeNull();
  });

  it("writes A/P in the case the code uses", () => {
    // LibreOffice writes "p" for A/P. Microsoft's format-code reference says A/P
    // shows A or P and a/p shows a or p, so the case follows the code here.
    const c = text.codes.indexOf("h:mm A/P");
    text.values.forEach((value, r) => {
      const libreoffice = text.shown[r][c];
      if (libreoffice === "#FMT") return;
      expect(formatWithCode(value, "h:mm A/P")).toBe(libreoffice.toUpperCase());
      expect(formatWithCode(value, "h:mm a/p")).toBe(libreoffice.toLowerCase());
    });
  });

  it("is what TEXT() returns in a formula", () => {
    const wb = createEmptyWorkbook();
    wb.sheets[0].cells = {
      A1: { value: "", formula: 'TEXT(1234.567,"$#,##0.00")' },
      A2: { value: "", formula: 'TEXT(45123.75,"mmmm d, yyyy h:mm AM/PM")' },
      A3: { value: "", formula: 'TEXT(123456789,"yyyy")' },
    };
    const cells = recalculateWorkbook(wb).sheets[0].cells;
    expect(cells.A1.computedValue).toBe("$1,234.57");
    expect(cells.A2.computedValue).toBe("July 16, 2023 6:00 PM");
    expect(cells.A3.computedValue).toBe("#VALUE!");
  });
});

describe("date display does not depend on the time zone", () => {
  /**
   * The grid converted serials with `new Date(1899, 11, 30)` in LOCAL time. In a
   * zone whose offset in 1899 was far from today's, every date showed as the
   * next day: 45000 read 2023-03-16 in Pacific/Apia.
   */
  for (const tz of ["UTC", "America/Chicago", "Pacific/Apia", "Pacific/Kiritimati", "Asia/Kolkata"]) {
    it(`shows serial 45000 as 2023-03-15 in ${tz}`, async () => {
      const previous = process.env.TZ;
      process.env.TZ = tz;
      try {
        vi.resetModules();
        const { formatCellValue: format } = await import("../src/engine/cell-display");
        expect(format(45000, { value: 45000, format: { displayFormat: "date" } })).toBe("2023-03-15");
        expect(format(45123.75, { value: 45123.75, format: { displayFormat: "datetime" } })).toBe("2023-07-16 18:00:00");
      } finally {
        process.env.TZ = previous;
      }
    });
  }
});

describe("formats the grid shows without a code of their own", () => {
  it("auto shows the value, rounded when decimals are set", () => {
    expect(formatCellValue(1234.567, { value: 1234.567 })).toBe("1234.567");
    expect(formatCellValue(1.005, { value: 1.005, format: { decimals: 2 } })).toBe("1.01");
  });

  it("an auto-formatted date formula shows a date", () => {
    expect(formatCellValue(45123, { value: "", formula: "DATE(2023,7,16)" })).toBe("2023-07-16");
    expect(formatCellValue(2023, { value: "", formula: "YEAR(DATE(2023,7,16))" })).toBe("2023");
  });

  it("text, booleans and empties", () => {
    expect(formatCellValue(1234.5, { value: 1234.5, format: { displayFormat: "text" } })).toBe("1234.5");
    expect(formatCellValue(true, undefined)).toBe("TRUE");
    expect(formatCellValue(null, undefined)).toBe("");
    expect(formatCellValue("2026-01-15", { value: "2026-01-15", format: { displayFormat: "date" } })).toBe("2026-01-15");
  });
});
