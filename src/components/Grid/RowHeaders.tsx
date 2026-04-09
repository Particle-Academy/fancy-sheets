import { useCallback } from "react";
import { cn } from "@particle-academy/react-fancy";
import { useSpreadsheet } from "../Spreadsheet/Spreadsheet.context";
import { toAddress, parseAddress } from "../../engine/cell-utils";

interface RowHeadersProps {
  rowIndex: number;
}

export function RowHeader({ rowIndex }: RowHeadersProps) {
  const { rowHeight, columnCount, selection, selectRange, _isDragging } = useSpreadsheet();

  // Only highlight if the ENTIRE row is selected (selection spans all columns)
  const isRowSelected = selection.ranges.some((range) => {
    const s = parseAddress(range.start);
    const e = parseAddress(range.end);
    const minRow = Math.min(s.row, e.row);
    const maxRow = Math.max(s.row, e.row);
    const minCol = Math.min(s.col, e.col);
    const maxCol = Math.max(s.col, e.col);
    return rowIndex >= minRow && rowIndex <= maxRow && minCol === 0 && maxCol >= columnCount - 1;
  });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if (e.shiftKey) {
        const activeRow = parseAddress(selection.activeCell).row;
        const minRow = Math.min(activeRow, rowIndex);
        const maxRow = Math.max(activeRow, rowIndex);
        selectRange(toAddress(minRow, 0), toAddress(maxRow, columnCount - 1));
      } else {
        selectRange(toAddress(rowIndex, 0), toAddress(rowIndex, columnCount - 1));
      }
      _isDragging.current = true;
    },
    [rowIndex, columnCount, selectRange, selection.activeCell, _isDragging],
  );

  const handleMouseEnter = useCallback(() => {
    if (_isDragging.current) {
      const activeRow = parseAddress(selection.activeCell).row;
      const minRow = Math.min(activeRow, rowIndex);
      const maxRow = Math.max(activeRow, rowIndex);
      selectRange(toAddress(minRow, 0), toAddress(maxRow, columnCount - 1));
    }
  }, [rowIndex, columnCount, selection.activeCell, selectRange, _isDragging]);

  const handleMouseUp = useCallback(() => {
    _isDragging.current = false;
  }, [_isDragging]);

  return (
    <div
      data-fancy-sheets-row-header=""
      className={cn(
        "flex shrink-0 cursor-pointer items-center justify-center border-r border-b border-zinc-300 text-[11px] font-medium select-none hover:bg-zinc-200 dark:border-zinc-600 dark:hover:bg-zinc-700",
        isRowSelected
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
      )}
      style={{ width: 48, minWidth: 48, height: rowHeight }}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseUp={handleMouseUp}
    >
      {rowIndex + 1}
    </div>
  );
}

RowHeader.displayName = "RowHeader";
