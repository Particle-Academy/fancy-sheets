import type { ReactNode } from "react";
import { Spreadsheet } from "../Spreadsheet/Spreadsheet";
import type { WorkbookData } from "../../types/sheet";
import type { CellData, CellHighlightMap } from "../../types/cell";
import type { SpreadsheetContextMenuItem, SpreadsheetProps } from "../Spreadsheet/Spreadsheet.types";
import type { ToolbarButton } from "../Toolbar/SpreadsheetToolbar";

export interface SheetWorkbookProps {
  /** Controlled workbook data */
  data?: WorkbookData;
  /** Default data (uncontrolled) */
  defaultData?: WorkbookData;
  /** Called on any data change */
  onChange?: (data: WorkbookData) => void;
  className?: string;
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
  /** Hide the toolbar (default: false) */
  hideToolbar?: boolean;
  /** Hide the sheet tabs (default: false) */
  hideTabs?: boolean;
  /** Extra content appended to the default toolbar */
  toolbarExtra?: ReactNode;
  /** Which built-in toolbar buttons to show (default: all). Pass [] for only custom extra. */
  toolbarButtons?: ToolbarButton[];
  /** Custom context menu items */
  contextMenuItems?: SpreadsheetContextMenuItem[] | ((address: string) => SpreadsheetContextMenuItem[]);
  /** Consumer-driven cell highlights */
  highlights?: CellHighlightMap;
  /** Fires when the active cell changes */
  onActiveCellChange?: (address: string, cell: CellData | undefined) => void;
  /**
   * Controlled full-screen flag. Pair with `onFullScreenChange`. The toggle is
   * in the toolbar (the `"fullScreen"` button group). Escape leaves, except an
   * Escape that cancels a cell edit or a sheet rename, which does only that.
   */
  fullScreen?: SpreadsheetProps["fullScreen"];
  /** Initial full-screen flag when uncontrolled. @default false */
  defaultFullScreen?: SpreadsheetProps["defaultFullScreen"];
  /** Fired when the toggle, Escape, an agent or the browser changes full screen. */
  onFullScreenChange?: SpreadsheetProps["onFullScreenChange"];
  /** `"overlay"` (default, always works) or `"native"` (browser Fullscreen API, falls back to the overlay). */
  fullScreenMode?: SpreadsheetProps["fullScreenMode"];
}

export function SheetWorkbook({
  hideToolbar = false,
  hideTabs = false,
  toolbarExtra,
  toolbarButtons,
  contextMenuItems,
  highlights,
  onActiveCellChange,
  ...props
}: SheetWorkbookProps) {
  return (
    <Spreadsheet {...props} contextMenuItems={contextMenuItems} highlights={highlights} onActiveCellChange={onActiveCellChange}>
      {!hideToolbar && <Spreadsheet.Toolbar extra={toolbarExtra} buttons={toolbarButtons} />}
      <Spreadsheet.Grid />
      {!hideTabs && <Spreadsheet.SheetTabs />}
    </Spreadsheet>
  );
}

SheetWorkbook.displayName = "SheetWorkbook";
