import type { ReactNode } from "react";
import type { WorkbookData } from "../../types/sheet";
import type { CellFormat } from "../../types/cell";
import type { SelectionState } from "../../types/selection";

export interface SpreadsheetProps {
  children: ReactNode;
  className?: string;
  /** Controlled workbook data */
  data?: WorkbookData;
  /** Default data (uncontrolled) */
  defaultData?: WorkbookData;
  /** Called on any data change */
  onChange?: (data: WorkbookData) => void;
  /** Number of columns (default: 26) */
  columnCount?: number;
  /** Number of rows (default: 100) */
  rowCount?: number;
  /** Default column width in px (default: 100) */
  defaultColumnWidth?: number;
  /** Row height in px (default: 28) */
  rowHeight?: number;
  /** Read-only mode */
  readOnly?: boolean;
}

export interface SpreadsheetContextValue {
  // Data
  workbook: WorkbookData;
  activeSheet: import("../../types/sheet").SheetData;
  // Config
  columnCount: number;
  rowCount: number;
  defaultColumnWidth: number;
  rowHeight: number;
  readOnly: boolean;
  // Selection
  selection: SelectionState;
  editingCell: string | null;
  editValue: string;
  // Actions
  setCellValue: (address: string, value: string) => void;
  setCellFormat: (addresses: string[], format: Partial<CellFormat>) => void;
  setSelection: (cell: string) => void;
  extendSelection: (cell: string) => void;
  addSelection: (cell: string) => void;
  navigate: (direction: "up" | "down" | "left" | "right", extend?: boolean) => void;
  startEdit: (value?: string) => void;
  updateEdit: (value: string) => void;
  confirmEdit: () => void;
  cancelEdit: () => void;
  resizeColumn: (col: number, width: number) => void;
  addSheet: () => void;
  renameSheet: (sheetId: string, name: string) => void;
  deleteSheet: (sheetId: string) => void;
  setActiveSheet: (sheetId: string) => void;
  setFrozenRows: (count: number) => void;
  setFrozenCols: (count: number) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  // Helpers
  getColumnWidth: (col: number) => number;
  isCellSelected: (address: string) => boolean;
  isCellActive: (address: string) => boolean;
}
