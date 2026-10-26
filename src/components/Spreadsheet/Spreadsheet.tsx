import { useMemo, useCallback, useEffect, useRef } from "react";
import { cn, FullScreenProvider, useFullScreen } from "@particle-academy/react-fancy";
import { SpreadsheetContext } from "./Spreadsheet.context";
import { useSpreadsheetStore } from "../../hooks/use-spreadsheet-store";
import { parseAddress, toAddress, expandRange, normalizeRange } from "../../engine/cell-utils";
import type { SpreadsheetProps, SpreadsheetContextValue } from "./Spreadsheet.types";

// Sub-components (imported for Object.assign)
import { SpreadsheetGrid } from "../Grid/SpreadsheetGrid";
import { SpreadsheetToolbar } from "../Toolbar/SpreadsheetToolbar";
import { SpreadsheetSheetTabs } from "../SheetTabs/SpreadsheetSheetTabs";
import { SpreadsheetFullScreenToggle } from "./SpreadsheetFullScreenToggle";

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
  contextMenuItems,
  highlights,
  onActiveCellChange,
  fullScreen: fullScreenProp,
  defaultFullScreen = false,
  onFullScreenChange,
  fullScreenMode = "overlay",
}: SpreadsheetProps) {
  // Full screen is the root itself covering the viewport (top layer, with a
  // position: fixed fallback), never a portal: reparenting would remount the
  // grid and drop the selection, an open cell edit and the scroll position.
  const fs = useFullScreen<HTMLDivElement>({
    fullScreen: fullScreenProp,
    defaultFullScreen,
    onFullScreenChange,
    mode: fullScreenMode,
  });
  const { state, actions } = useSpreadsheetStore(data ?? defaultData);
  const onChangeRef = useRef(onChange);
  const isExternalSync = useRef(false);
  const prevDataRef = useRef(data);
  onChangeRef.current = onChange;

  // Sync controlled data from parent
  useEffect(() => {
    if (data && data !== prevDataRef.current && data !== state.workbook) {
      isExternalSync.current = true;
      actions.setWorkbook(data);
      prevDataRef.current = data;
    }
  }, [data]);

  // Notify parent of internal changes only
  useEffect(() => {
    if (isExternalSync.current) {
      isExternalSync.current = false;
      return;
    }
    prevDataRef.current = state.workbook;
    onChangeRef.current?.(state.workbook);
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

  // Fire onActiveCellChange when active cell changes
  const onActiveCellChangeRef = useRef(onActiveCellChange);
  onActiveCellChangeRef.current = onActiveCellChange;
  useEffect(() => {
    const addr = state.selection.activeCell;
    const cell = activeSheet.cells[addr];
    onActiveCellChangeRef.current?.(addr, cell);
  }, [state.selection.activeCell, activeSheet]);

  const isDraggingRef = useRef(false);
  const highlightsResolved = highlights ?? {};

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
      contextMenuItems,
      highlights: highlightsResolved,
      fullScreen: fs.fullScreen,
      setFullScreen: fs.setFullScreen,
      _isDragging: isDraggingRef,
    }),
    [state, activeSheet, columnCount, rowCount, defaultColumnWidth, rowHeight, readOnly, actions, getColumnWidth, isCellSelected, isCellActive, contextMenuItems, highlightsResolved, fs.fullScreen, fs.setFullScreen],
  );

  return (
    <SpreadsheetContext.Provider value={ctx}>
      {/* Makes <Spreadsheet.FullScreenToggle /> work anywhere inside, and keeps
          the context menu and other portals inside the surface while it is
          full screen, where the page behind is covered. */}
      <FullScreenProvider value={fs}>
        <div
          {...fs.targetProps}
          data-fancy-sheets=""
          className={cn(
            "flex h-full flex-col overflow-hidden",
            className,
            // The top-layer box is reset to transparent, so without a surface of
            // its own the page would show through the toolbar and tab strip.
            fs.fullScreen && "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100",
          )}
        >
          {children}
        </div>
      </FullScreenProvider>
    </SpreadsheetContext.Provider>
  );
}

SpreadsheetRoot.displayName = "Spreadsheet";

export const Spreadsheet = Object.assign(SpreadsheetRoot, {
  Toolbar: SpreadsheetToolbar,
  Grid: SpreadsheetGrid,
  SheetTabs: SpreadsheetSheetTabs,
  FullScreenToggle: SpreadsheetFullScreenToggle,
});
