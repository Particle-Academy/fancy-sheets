import type { WorkbookData, SheetData } from "../types/sheet";
import { createEmptySheet } from "../types/sheet";
import { toAddress } from "./cell-utils";

/** Parse CSV text into a 2D string array */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(current);
        current = "";
      } else if (ch === "\n" || (ch === "\r" && text[i + 1] === "\n")) {
        row.push(current);
        current = "";
        rows.push(row);
        row = [];
        if (ch === "\r") i++;
      } else {
        current += ch;
      }
    }
  }

  row.push(current);
  if (row.some((c) => c !== "")) rows.push(row);

  return rows;
}

/** Stringify a 2D array to CSV text */
export function stringifyCSV(data: string[][]): string {
  return data
    .map((row) =>
      row
        .map((cell) => {
          if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
            return '"' + cell.replace(/"/g, '""') + '"';
          }
          return cell;
        })
        .join(","),
    )
    .join("\n");
}

/** Convert CSV text to a WorkbookData */
export function csvToWorkbook(csv: string, sheetName: string = "Sheet 1"): WorkbookData {
  const data = parseCSV(csv);
  const sheet = createEmptySheet("sheet-1", sheetName);

  for (let r = 0; r < data.length; r++) {
    for (let c = 0; c < data[r].length; c++) {
      const val = data[r][c];
      if (val === "") continue;
      const addr = toAddress(r, c);
      const numVal = Number(val);
      sheet.cells[addr] = { value: isNaN(numVal) || val === "" ? val : numVal };
    }
  }

  return { sheets: [sheet], activeSheetId: sheet.id };
}

/** Convert WorkbookData active sheet to CSV */
export function workbookToCSV(workbook: WorkbookData, sheetId?: string): string {
  const sheet = sheetId
    ? workbook.sheets.find((s) => s.id === sheetId)
    : workbook.sheets.find((s) => s.id === workbook.activeSheetId);

  if (!sheet) return "";

  // Find bounds
  let maxRow = 0;
  let maxCol = 0;
  for (const addr of Object.keys(sheet.cells)) {
    const match = addr.match(/^([A-Z]+)(\d+)$/);
    if (!match) continue;
    const col = match[1].split("").reduce((acc, ch) => acc * 26 + ch.charCodeAt(0) - 64, 0) - 1;
    const row = parseInt(match[2], 10) - 1;
    maxRow = Math.max(maxRow, row);
    maxCol = Math.max(maxCol, col);
  }

  const data: string[][] = [];
  for (let r = 0; r <= maxRow; r++) {
    const row: string[] = [];
    for (let c = 0; c <= maxCol; c++) {
      const addr = toAddress(r, c);
      const cell = sheet.cells[addr];
      if (!cell) {
        row.push("");
      } else if (cell.computedValue !== undefined && cell.computedValue !== null) {
        row.push(String(cell.computedValue));
      } else if (cell.value !== null) {
        row.push(String(cell.value));
      } else {
        row.push("");
      }
    }
    data.push(row);
  }

  return stringifyCSV(data);
}
