import type { CellData } from "./cell";

/** Sparse cell map — only stores cells that have data */
export type CellMap = Record<string, CellData>;

/** Column width overrides (col index -> px) */
export type ColumnWidths = Record<number, number>;

/** Merged region defined by top-left and bottom-right addresses */
export interface MergedRegion {
  start: string;
  end: string;
}

/** A single sheet within a workbook */
export interface SheetData {
  id: string;
  name: string;
  cells: CellMap;
  columnWidths: ColumnWidths;
  mergedRegions: MergedRegion[];
  columnFilters: Record<number, string>;
  sortColumn?: number;
  sortDirection?: "asc" | "desc";
  frozenRows: number;
  frozenCols: number;
}

/** The complete workbook */
export interface WorkbookData {
  sheets: SheetData[];
  activeSheetId: string;
}

/** Create an empty sheet */
export function createEmptySheet(id: string, name: string): SheetData {
  return {
    id,
    name,
    cells: {},
    columnWidths: {},
    mergedRegions: [],
    columnFilters: {},
    frozenRows: 0,
    frozenCols: 0,
  };
}

/** Create an empty workbook with one sheet */
export function createEmptyWorkbook(): WorkbookData {
  const sheet = createEmptySheet("sheet-1", "Sheet 1");
  return {
    sheets: [sheet],
    activeSheetId: sheet.id,
  };
}
