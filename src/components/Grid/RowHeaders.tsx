import { useSpreadsheet } from "../Spreadsheet/Spreadsheet.context";

interface RowHeadersProps {
  rowIndex: number;
}

export function RowHeader({ rowIndex }: RowHeadersProps) {
  const { rowHeight } = useSpreadsheet();

  return (
    <div
      data-fancy-sheets-row-header=""
      className="flex shrink-0 items-center justify-center border-r border-b border-zinc-300 bg-zinc-100 text-[11px] font-medium text-zinc-500 select-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
      style={{ width: 48, minWidth: 48, height: rowHeight }}
    >
      {rowIndex + 1}
    </div>
  );
}

RowHeader.displayName = "RowHeader";
