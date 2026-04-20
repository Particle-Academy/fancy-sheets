import type { ReactNode } from "react";
import { Spreadsheet } from "../Spreadsheet/Spreadsheet";
import type { WorkbookData } from "../../types/sheet";
import type { SpreadsheetContextMenuItem } from "../Spreadsheet/Spreadsheet.types";
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
}

export function SheetWorkbook({
  hideToolbar = false,
  hideTabs = false,
  toolbarExtra,
  toolbarButtons,
  contextMenuItems,
  ...props
}: SheetWorkbookProps) {
  return (
    <Spreadsheet {...props} contextMenuItems={contextMenuItems}>
      {!hideToolbar && <Spreadsheet.Toolbar extra={toolbarExtra} buttons={toolbarButtons} />}
      <Spreadsheet.Grid />
      {!hideTabs && <Spreadsheet.SheetTabs />}
    </Spreadsheet>
  );
}

SheetWorkbook.displayName = "SheetWorkbook";
