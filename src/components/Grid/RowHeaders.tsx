import { useCallback } from "react";
import { useSpreadsheet } from "../Spreadsheet/Spreadsheet.context";
import { toAddress, parseAddress } from "../../engine/cell-utils";

interface RowHeadersProps {
  rowIndex: number;
}

export function RowHeader({ rowIndex }: RowHeadersProps) {
  const { rowHeight, columnCount, selection, selectRange, _isDragging } = useSpreadsheet();

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
      className="flex shrink-0 cursor-pointer items-center justify-center border-r border-b border-zinc-300 bg-zinc-100 text-[11px] font-medium text-zinc-500 select-none hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
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
