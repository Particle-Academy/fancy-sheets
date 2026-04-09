import { useEffect, useRef } from "react";
import { useSpreadsheet } from "../Spreadsheet/Spreadsheet.context";
import { parseAddress } from "../../engine/cell-utils";

export function CellEditor() {
  const {
    editingCell,
    editValue,
    updateEdit,
    confirmEdit,
    cancelEdit,
    getColumnWidth,
    rowHeight,
    activeSheet,
  } = useSpreadsheet();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  if (!editingCell) return null;

  const { row, col } = parseAddress(editingCell);
  const width = getColumnWidth(col);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    } else if (e.key === "Tab") {
      e.preventDefault();
      confirmEdit();
    }
  };

  return (
    <input
      ref={inputRef}
      data-fancy-sheets-cell-editor=""
      className="absolute z-20 border-2 border-blue-500 bg-white px-1 text-[13px] outline-none dark:bg-zinc-800 dark:text-zinc-100"
      style={{ width: Math.max(width, 60), height: rowHeight }}
      value={editValue}
      onChange={(e) => updateEdit(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={confirmEdit}
    />
  );
}

CellEditor.displayName = "CellEditor";
