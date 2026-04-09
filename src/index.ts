// Components
export { Spreadsheet, useSpreadsheet } from "./components/Spreadsheet";
export type { SpreadsheetProps, SpreadsheetContextValue } from "./components/Spreadsheet";

// Types
export type {
  CellAddress, CellValue, CellData, CellFormat, TextAlign,
  CellMap, ColumnWidths, MergedRegion, SheetData, WorkbookData,
  CellRange, SelectionState,
} from "./types";
export { createEmptyWorkbook, createEmptySheet } from "./types";

// Engine utilities
export { columnToLetter, letterToColumn, parseAddress, toAddress } from "./engine/cell-utils";
export { parseCSV, stringifyCSV, csvToWorkbook, workbookToCSV } from "./engine/csv";
export { registerFunction } from "./engine/formula/functions/registry";
