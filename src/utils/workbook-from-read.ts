import type { CellData } from "../types/cell";
import type { SheetData, WorkbookData } from "../types/sheet";

type Json = Record<string, unknown>;

const isObject = (v: unknown): v is Json => v !== null && typeof v === "object" && !Array.isArray(v);

function toCell(cell: unknown): CellData {
  if (!isObject(cell)) return { value: cell } as CellData;

  const out: Json = { value: cell.value ?? null };
  if (typeof cell.formula === "string") out.formula = cell.formula;
  if (isObject(cell.format)) out.format = cell.format;
  if (isObject(cell.comment)) out.comment = cell.comment;

  return out as unknown as CellData;
}

/**
 * A workbook as holy-sheet's reader returns it (PHP or JS, one schema) -> this
 * package's `WorkbookData`, for `SheetWorkbook`.
 *
 * The two share a cell model on purpose: holy-sheet's `format` IS this
 * package's `CellFormat`. So every cell field crosses -- value, formula, format,
 * comment -- rather than a chosen few. The version this replaces (in the lab)
 * kept value and formula only, and a cell the file formats as "$1,250,000.50"
 * showed as 1250000.5: the reader had recovered the format and the mapping
 * threw it away, which made a working reader look broken.
 */
export function workbookFromRead(read: unknown): WorkbookData {
  const schema = isObject(read) ? read : {};
  const sheets = Array.isArray(schema.sheets) ? schema.sheets : [];

  const mapped = sheets.map((raw: unknown, i: number): SheetData => {
    const sheet = isObject(raw) ? raw : {};
    const cells: Record<string, CellData> = {};

    for (const [address, cell] of Object.entries(isObject(sheet.cells) ? sheet.cells : {})) {
      cells[address] = toCell(cell);
    }

    return {
      id: `s${i}`,
      name: String(sheet.name ?? `Sheet${i + 1}`),
      cells,
      columnWidths: (isObject(sheet.columnWidths) ? sheet.columnWidths : {}) as SheetData["columnWidths"],
      mergedRegions: (Array.isArray(sheet.mergedRegions) ? sheet.mergedRegions : []) as SheetData["mergedRegions"],
      columnFilters: {},
      frozenRows: Number(sheet.frozenRows ?? 0),
      frozenCols: Number(sheet.frozenCols ?? 0),
    };
  });

  return { sheets: mapped, activeSheetId: mapped[0]?.id ?? "s0" };
}

/** Whether a value looks like a holy-sheet read (has a `sheets` list). */
export function isWorkbookRead(read: unknown): boolean {
  return isObject(read) && Array.isArray(read.sheets);
}
