import { useCallback } from "react";
import { useSpreadsheet } from "../Spreadsheet/Spreadsheet.context";
import { columnToLetter, toAddress, parseAddress } from "../../engine/cell-utils";
import { ColumnResizeHandle } from "./ColumnResizeHandle";

export function ColumnHeaders() {
  const { columnCount, rowCount, rowHeight, getColumnWidth, selection, selectRange } = useSpreadsheet();

  const handleColumnClick = useCallback(
    (colIdx: number, e: React.MouseEvent) => {
      if (e.shiftKey) {
        // Extend from active cell's column to this column
        const activeCol = parseAddress(selection.activeCell).col;
        const minCol = Math.min(activeCol, colIdx);
        const maxCol = Math.max(activeCol, colIdx);
        selectRange(toAddress(0, minCol), toAddress(rowCount - 1, maxCol));
      } else {
        selectRange(toAddress(0, colIdx), toAddress(rowCount - 1, colIdx));
      }
    },
    [rowCount, selectRange, selection.activeCell],
  );

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
      {Array.from({ length: columnCount }, (_, i) => (
        <div
          key={i}
          className="relative flex shrink-0 cursor-pointer items-center justify-center border-r border-zinc-300 text-[11px] font-medium text-zinc-500 select-none hover:bg-zinc-200 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700"
          style={{ width: getColumnWidth(i), minWidth: getColumnWidth(i) }}
          onClick={(e) => handleColumnClick(i, e)}
        >
          {columnToLetter(i)}
          <ColumnResizeHandle colIndex={i} />
        </div>
      ))}
    </div>
  );
}

ColumnHeaders.displayName = "ColumnHeaders";
