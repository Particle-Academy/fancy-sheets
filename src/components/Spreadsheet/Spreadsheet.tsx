import { useMemo, useCallback, useEffect } from "react";
import { cn } from "@particle-academy/react-fancy";
import { SpreadsheetContext } from "./Spreadsheet.context";
import { useSpreadsheetStore } from "../../hooks/use-spreadsheet-store";
import { parseAddress, toAddress, expandRange, normalizeRange } from "../../engine/cell-utils";
import type { SpreadsheetProps, SpreadsheetContextValue } from "./Spreadsheet.types";

// Sub-components (imported for Object.assign)
import { SpreadsheetGrid } from "../Grid/SpreadsheetGrid";
import { SpreadsheetToolbar } from "../Toolbar/SpreadsheetToolbar";
import { SpreadsheetSheetTabs } from "../SheetTabs/SpreadsheetSheetTabs";

function SpreadsheetRoot({
  children,
  className,
  data,
  defaultData,
  onChange,
  columnCount = 26,
  rowCount = 100,
  defaultColumnWidth = 100,
  rowHeight = 28,
  readOnly = false,
}: SpreadsheetProps) {
  const { state, actions } = useSpreadsheetStore(data ?? defaultData);

  // Sync controlled data
  useEffect(() => {
    if (data && data !== state.workbook) {
      actions.setWorkbook(data);
    }
  }, [data]);

  // Notify parent of changes
  useEffect(() => {
    onChange?.(state.workbook);
  }, [state.workbook]);

  const activeSheet = useMemo(
    () => state.workbook.sheets.find((s) => s.id === state.workbook.activeSheetId)!,
    [state.workbook],
  );

  const getColumnWidth = useCallback(
    (col: number) => activeSheet.columnWidths[col] ?? defaultColumnWidth,
    [activeSheet.columnWidths, defaultColumnWidth],
  );

  const isCellSelected = useCallback(
    (address: string) => {
      const target = parseAddress(address);
      return state.selection.ranges.some((range) => {
        const norm = normalizeRange(range.start, range.end);
        const s = parseAddress(norm.start);
        const e = parseAddress(norm.end);
        return target.row >= s.row && target.row <= e.row && target.col >= s.col && target.col <= e.col;
      });
    },
    [state.selection.ranges],
  );

  const isCellActive = useCallback(
    (address: string) => state.selection.activeCell === address,
    [state.selection.activeCell],
  );

  const ctx = useMemo<SpreadsheetContextValue>(
    () => ({
      workbook: state.workbook,
      activeSheet,
      columnCount,
      rowCount,
      defaultColumnWidth,
      rowHeight,
      readOnly,
      selection: state.selection,
      editingCell: state.editingCell,
      editValue: state.editValue,
      ...actions,
      canUndo: state.undoStack.length > 0,
      canRedo: state.redoStack.length > 0,
      getColumnWidth,
      isCellSelected,
      isCellActive,
    }),
    [state, activeSheet, columnCount, rowCount, defaultColumnWidth, rowHeight, readOnly, actions, getColumnWidth, isCellSelected, isCellActive],
  );

  return (
    <SpreadsheetContext.Provider value={ctx}>
      <div
        data-fancy-sheets=""
        className={cn("flex flex-col overflow-hidden", className)}
      >
        {children}
      </div>
    </SpreadsheetContext.Provider>
  );
}

SpreadsheetRoot.displayName = "Spreadsheet";

export const Spreadsheet = Object.assign(SpreadsheetRoot, {
  Toolbar: SpreadsheetToolbar,
  Grid: SpreadsheetGrid,
  SheetTabs: SpreadsheetSheetTabs,
});
