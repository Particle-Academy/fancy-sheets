import { useCallback } from "react";
import { cn } from "@particle-academy/react-fancy";
import { useSpreadsheet } from "../Spreadsheet/Spreadsheet.context";
import { columnToLetter, toAddress, parseAddress } from "../../engine/cell-utils";
import { ColumnResizeHandle } from "./ColumnResizeHandle";

export function ColumnHeaders() {
  const { columnCount, rowCount, rowHeight, getColumnWidth, selection, selectRange, _isDragging } = useSpreadsheet();

  const handleColumnMouseDown = useCallback(
    (colIdx: number, e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if (e.shiftKey) {
        const activeCol = parseAddress(selection.activeCell).col;
        const minCol = Math.min(activeCol, colIdx);
        const maxCol = Math.max(activeCol, colIdx);
        selectRange(toAddress(0, minCol), toAddress(rowCount - 1, maxCol));
      } else {
        selectRange(toAddress(0, colIdx), toAddress(rowCount - 1, colIdx));
      }
      _isDragging.current = true;
    },
    [rowCount, selectRange, selection.activeCell, _isDragging],
  );

  const handleColumnMouseEnter = useCallback(
    (colIdx: number) => {
      if (_isDragging.current) {
        const activeCol = parseAddress(selection.activeCell).col;
        const minCol = Math.min(activeCol, colIdx);
        const maxCol = Math.max(activeCol, colIdx);
        selectRange(toAddress(0, minCol), toAddress(rowCount - 1, maxCol));
      }
    },
    [rowCount, selection.activeCell, selectRange, _isDragging],
  );

  const handleMouseUp = useCallback(() => {
    _isDragging.current = false;
  }, [_isDragging]);

  return (
    <div
      data-fancy-sheets-column-headers=""
      className="flex border-b border-zinc-300 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800"
      style={{ height: rowHeight }}
    >
      {/* Corner cell */}
      <div
        className="flex shrink-0 items-center justify-center border-r border-zinc-300 bg-zinc-100 text-[11px] font-medium text-zinc-400 dark:border-zinc-600 dark:bg-zinc-800"
        style={{ width: 48, minWidth: 48 }}
      />
      {/* Column letters */}
      {Array.from({ length: columnCount }, (_, i) => {
        // Only highlight if the ENTIRE column is selected (spans all rows)
        const isColSelected = selection.ranges.some((range) => {
          const s = parseAddress(range.start);
          const e = parseAddress(range.end);
          const minCol = Math.min(s.col, e.col);
          const maxCol = Math.max(s.col, e.col);
          const minRow = Math.min(s.row, e.row);
          const maxRow = Math.max(s.row, e.row);
          return i >= minCol && i <= maxCol && minRow === 0 && maxRow >= rowCount - 1;
        });
        return (
          <div
            key={i}
            className={cn(
              "relative flex shrink-0 cursor-pointer items-center justify-center border-r border-zinc-300 text-[11px] font-medium select-none hover:bg-zinc-200 dark:border-zinc-600 dark:hover:bg-zinc-700",
              isColSelected
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                : "text-zinc-500 dark:text-zinc-400",
            )}
            style={{ width: getColumnWidth(i), minWidth: getColumnWidth(i) }}
            onMouseDown={(e) => handleColumnMouseDown(i, e)}
            onMouseEnter={() => handleColumnMouseEnter(i)}
            onMouseUp={handleMouseUp}
          >
            {columnToLetter(i)}
            <ColumnResizeHandle colIndex={i} />
          </div>
        );
      })}
    </div>
  );
}

ColumnHeaders.displayName = "ColumnHeaders";
