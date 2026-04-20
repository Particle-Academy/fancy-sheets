import type { ReactNode } from "react";
import type { WorkbookData } from "../../types/sheet";
import type { CellData, CellFormat, CellHighlightMap } from "../../types/cell";
import type { SelectionState } from "../../types/selection";

/** Custom context menu item for right-click menus */
export interface SpreadsheetContextMenuItem {
  /** Display label */
  label: string;
  /** Called with the active cell address when the item is clicked (omit for submenu parents) */
  onClick?: (address: string) => void;
  /** Whether the item is disabled — static or per-cell function */
  disabled?: boolean | ((address: string) => boolean);
  /** Render with danger styling */
  danger?: boolean;
  /** Nested sub-items — renders as a submenu when present */
  items?: SpreadsheetContextMenuItem[];
}

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
  /** Custom context menu items appended after built-in items */
  contextMenuItems?: SpreadsheetContextMenuItem[] | ((address: string) => SpreadsheetContextMenuItem[]);
  /** Consumer-driven cell highlights — rendered as visual overlays, independent of selection */
  highlights?: CellHighlightMap;
  /** Fires when the active cell changes */
  onActiveCellChange?: (address: string, cell: CellData | undefined) => void;
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
  selectRange: (start: string, end: string) => void;
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
  /** Custom context menu items from consumer */
  contextMenuItems?: SpreadsheetContextMenuItem[] | ((address: string) => SpreadsheetContextMenuItem[]);
  /** Consumer-provided cell highlights */
  highlights: CellHighlightMap;
  /** @internal drag-to-select state */
  _isDragging: React.RefObject<boolean>;
}
