import { useCallback, memo } from "react";
import { cn } from "@particle-academy/react-fancy";
import { useSpreadsheet } from "../Spreadsheet/Spreadsheet.context";
import type { CellData } from "../../types/cell";

interface CellProps {
  address: string;
  row: number;
  col: number;
}

function getCellDisplayValue(cell: CellData | undefined): string {
  if (!cell) return "";
  if (cell.formula && cell.computedValue !== undefined) return String(cell.computedValue ?? "");
  if (cell.value === null) return "";
  return String(cell.value);
}

export const Cell = memo(function Cell({ address, row, col }: CellProps) {
  const {
    activeSheet,
    selection,
    editingCell,
    readOnly,
    setSelection,
    extendSelection,
    addSelection,
    startEdit,
    rowHeight,
    getColumnWidth,
    isCellSelected,
    isCellActive,
  } = useSpreadsheet();

  const cell = activeSheet.cells[address];
  const isActive = isCellActive(address);
  const isSelected = isCellSelected(address);
  const isEditing = editingCell === address;
  const displayValue = getCellDisplayValue(cell);
  const width = getColumnWidth(col);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.shiftKey) {
        extendSelection(address);
      } else if (e.ctrlKey || e.metaKey) {
        addSelection(address);
      } else {
        setSelection(address);
      }
    },
    [address, setSelection, extendSelection, addSelection],
  );

  const handleDoubleClick = useCallback(() => {
    if (readOnly) return;
    startEdit();
  }, [readOnly, startEdit]);

  const formatStyle: React.CSSProperties = {};
  if (cell?.format?.bold) formatStyle.fontWeight = "bold";
  if (cell?.format?.italic) formatStyle.fontStyle = "italic";
  if (cell?.format?.textAlign) formatStyle.textAlign = cell.format.textAlign;

  return (
    <div
      data-fancy-sheets-cell=""
      data-selected={isSelected || undefined}
      data-active={isActive || undefined}
      role="gridcell"
      className={cn(
        "relative flex items-center truncate border-r border-b border-zinc-200 px-1.5 text-[13px] dark:border-zinc-700",
        isActive && "ring-2 ring-inset ring-blue-500",
        isSelected && !isActive && "bg-blue-500/10",
      )}
      style={{ width, minWidth: width, height: rowHeight, ...formatStyle }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {!isEditing && <span className="truncate">{displayValue}</span>}
    </div>
  );
});

Cell.displayName = "Cell";
