import type { CellData, CellFormat, CellValue } from "../types/cell";
import { currencySymbol, formatWithCode } from "./number-format";

/** Decimal places a display format shows when the cell does not set `decimals`. */
export function defaultDecimals(displayFormat: CellFormat["displayFormat"]): number | undefined {
  switch (displayFormat) {
    case "number":
      return 0;
    case "currency":
      return 2;
    case "percentage":
      return 1;
    default:
      return undefined;
  }
}

/**
 * The spreadsheet format code a cell's display format stands for: exactly the
 * code holy-sheet writes into an .xlsx for the same `displayFormat`, `decimals`
 * and `currency` (`NumFmtBuilder` in all three of its runtimes). So a workbook
 * reads the same in this grid as in Excel or LibreOffice after export, and a
 * file holy-sheet read back renders as its author formatted it.
 *
 * `null` means no code: the value shows as it is.
 */
export function displayFormatCode(format: CellFormat | undefined): string | null {
  const fmt = format?.displayFormat;
  const places = (fallback: number) => {
    const d = format?.decimals ?? fallback;
    return d > 0 ? "." + "0".repeat(Math.floor(d)) : "";
  };

  switch (fmt) {
    case "number":
      return "#,##0" + places(0);
    case "percentage":
      return "0" + places(1) + "%";
    case "currency": {
      const symbol = `"${currencySymbol(format?.currency)}"`;
      const body = "#,##0" + places(2);
      return `${symbol}${body};-${symbol}${body}`;
    }
    case "date":
      return "yyyy-mm-dd";
    case "datetime":
      return "yyyy-mm-dd hh:mm:ss";
    case undefined:
    case "auto":
      // Auto shows the value, rounded when the cell asks for decimal places.
      return format?.decimals !== undefined ? "0" + places(0) : null;
    default:
      return null;
  }
}

/**
 * Detects a formula whose OUTERMOST function returns a date serial, so an
 * auto-formatted `=TODAY()` shows a date. `YEAR(DATE(...))` is not one: YEAR
 * returns a plain number.
 */
function isDateFormula(formula: string | undefined): boolean {
  if (!formula) return false;
  return /^(TODAY|NOW|DATE|EDATE)\s*\(/.test(formula.trim().toUpperCase());
}

/** A cell value as the grid displays it. Pure: usable headlessly, in SSR and exports. */
export function formatCellValue(val: CellValue | undefined, cell: CellData | undefined): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val !== "number") return String(val);

  const fmt = cell?.format?.displayFormat;
  if ((fmt === undefined || fmt === "auto") && isDateFormula(cell?.formula)) {
    return formatWithCode(val, val % 1 === 0 ? "yyyy-mm-dd" : "yyyy-mm-dd hh:mm:ss") ?? String(val);
  }

  const code = displayFormatCode(cell?.format);
  return code === null ? String(val) : (formatWithCode(val, code) ?? String(val));
}
