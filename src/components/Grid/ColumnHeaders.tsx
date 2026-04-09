import { useSpreadsheet } from "../Spreadsheet/Spreadsheet.context";
import { columnToLetter } from "../../engine/cell-utils";
import { ColumnResizeHandle } from "./ColumnResizeHandle";

export function ColumnHeaders() {
  const { columnCount, rowHeight, getColumnWidth } = useSpreadsheet();

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
          className="relative flex shrink-0 items-center justify-center border-r border-zinc-300 text-[11px] font-medium text-zinc-500 select-none dark:border-zinc-600 dark:text-zinc-400"
          style={{ width: getColumnWidth(i), minWidth: getColumnWidth(i) }}
        >
          {columnToLetter(i)}
          <ColumnResizeHandle colIndex={i} />
        </div>
      ))}
    </div>
  );
}

ColumnHeaders.displayName = "ColumnHeaders";
