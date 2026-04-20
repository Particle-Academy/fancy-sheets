import { useMemo } from "react";
import { Spreadsheet } from "../Spreadsheet/Spreadsheet";
import type { SheetData, WorkbookData } from "../../types/sheet";
import type { SpreadsheetContextMenuItem } from "../Spreadsheet/Spreadsheet.types";

export interface SheetProps {
  /** Single sheet data (controlled) */
  data?: SheetData;
  /** Called when sheet data changes */
  onChange?: (data: SheetData) => void;
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
  /** Custom context menu items */
  contextMenuItems?: SpreadsheetContextMenuItem[] | ((address: string) => SpreadsheetContextMenuItem[]);
}

export function Sheet({ data, onChange, contextMenuItems, ...props }: SheetProps) {
  const workbook = useMemo<WorkbookData | undefined>(
    () => data ? { sheets: [data], activeSheetId: data.id } : undefined,
    [data],
  );

  const handleChange = useMemo(() => {
    if (!onChange) return undefined;
    return (wb: WorkbookData) => onChange(wb.sheets[0]);
  }, [onChange]);

  return (
    <Spreadsheet data={workbook} onChange={handleChange} contextMenuItems={contextMenuItems} {...props}>
      <Spreadsheet.Grid />
    </Spreadsheet>
  );
}

Sheet.displayName = "Sheet";
