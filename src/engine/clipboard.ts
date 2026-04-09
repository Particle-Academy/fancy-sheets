import type { CellMap } from "../types/sheet";
import type { CellRange } from "../types/selection";
import { parseAddress, toAddress, normalizeRange } from "./cell-utils";

/** Serialize a cell range to TSV string */
export function cellsToTSV(cells: CellMap, range: CellRange): string {
  const norm = normalizeRange(range.start, range.end);
  const s = parseAddress(norm.start);
  const e = parseAddress(norm.end);
  const rows: string[] = [];

  for (let r = s.row; r <= e.row; r++) {
    const cols: string[] = [];
    for (let c = s.col; c <= e.col; c++) {
      const addr = toAddress(r, c);
      const cell = cells[addr];
      if (!cell) {
        cols.push("");
      } else if (cell.computedValue !== undefined && cell.computedValue !== null) {
        cols.push(String(cell.computedValue));
      } else if (cell.value !== null) {
        cols.push(String(cell.value));
      } else {
        cols.push("");
      }
    }
    rows.push(cols.join("\t"));
  }

  return rows.join("\n");
}

/** Parse TSV string into cell data */
export function tsvToCells(tsv: string): { values: string[][]; rows: number; cols: number } {
  const lines = tsv.split("\n");
  const values = lines.map((line) => line.split("\t"));
  const rows = values.length;
  const cols = Math.max(...values.map((v) => v.length));
  return { values, rows, cols };
}
