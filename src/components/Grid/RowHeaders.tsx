import { useCallback } from "react";
import { useSpreadsheet } from "../Spreadsheet/Spreadsheet.context";
import { toAddress } from "../../engine/cell-utils";

interface RowHeadersProps {
  rowIndex: number;
}

export function RowHeader({ rowIndex }: RowHeadersProps) {
  const { rowHeight, columnCount, selectRange } = useSpreadsheet();

  const handleClick = useCallback(() => {
    const start = toAddress(rowIndex, 0);
    const end = toAddress(rowIndex, columnCount - 1);
    selectRange(start, end);
  }, [rowIndex, columnCount, selectRange]);

  return (
    <div
      data-fancy-sheets-row-header=""
      className="flex shrink-0 cursor-pointer items-center justify-center border-r border-b border-zinc-300 bg-zinc-100 text-[11px] font-medium text-zinc-500 select-none hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
      style={{ width: 48, minWidth: 48, height: rowHeight }}
      onClick={handleClick}
    >
      {rowIndex + 1}
    </div>
  );
}

RowHeader.displayName = "RowHeader";
