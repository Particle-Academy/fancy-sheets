import { useEffect, useRef, useCallback } from "react";
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
  } = useSpreadsheet();

  const inputRef = useRef<HTMLInputElement>(null);
  const mountedAt = useRef(0);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      mountedAt.current = Date.now();
      inputRef.current.focus();
    }
  }, [editingCell]);

  const handleBlur = useCallback(() => {
    // Ignore blur within 100ms of mount to avoid double-click race condition
    if (Date.now() - mountedAt.current < 100) return;
    confirmEdit();
  }, [confirmEdit]);

  if (!editingCell) return null;

  const { col } = parseAddress(editingCell);
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
      onBlur={handleBlur}
    />
  );
}

CellEditor.displayName = "CellEditor";
