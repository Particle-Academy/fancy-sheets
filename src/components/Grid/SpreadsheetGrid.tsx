import { useCallback, useRef } from "react";
import { cn } from "@particle-academy/react-fancy";
import { useSpreadsheet } from "../Spreadsheet/Spreadsheet.context";
import { ColumnHeaders } from "./ColumnHeaders";
import { RowHeader } from "./RowHeaders";
import { Cell } from "./Cell";
import { CellEditor } from "./CellEditor";
import { SelectionOverlay } from "./SelectionOverlay";
import { toAddress, parseAddress } from "../../engine/cell-utils";
import { cellsToTSV, tsvToCells } from "../../engine/clipboard";

interface SpreadsheetGridProps {
  className?: string;
}

export function SpreadsheetGrid({ className }: SpreadsheetGridProps) {
  const {
    columnCount,
    rowCount,
    rowHeight,
    getColumnWidth,
    selection,
    editingCell,
    readOnly,
    activeSheet,
    navigate,
    startEdit,
    confirmEdit,
    cancelEdit,
    setCellValue,
    undo,
    redo,
  } = useSpreadsheet();

  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Don't intercept when editing (CellEditor handles its own keys)
      if (editingCell) return;

      // Navigation
      if (e.key === "ArrowUp") { e.preventDefault(); navigate("up", e.shiftKey); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); navigate("down", e.shiftKey); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); navigate("left", e.shiftKey); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); navigate("right", e.shiftKey); return; }
      if (e.key === "Tab") { e.preventDefault(); navigate(e.shiftKey ? "left" : "right"); return; }
      if (e.key === "Enter") { e.preventDefault(); if (!readOnly) startEdit(); return; }

      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        const range = selection.ranges[0];
        if (range) {
          const tsv = cellsToTSV(activeSheet.cells, range);
          navigator.clipboard.writeText(tsv);
        }
        return;
      }

      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        navigator.clipboard.readText().then((text) => {
          if (!text) return;
          const { values } = tsvToCells(text);
          const { row: startRow, col: startCol } = parseAddress(selection.activeCell);
          for (let r = 0; r < values.length; r++) {
            for (let c = 0; c < values[r].length; c++) {
              const addr = toAddress(startRow + r, startCol + c);
              setCellValue(addr, values[r][c]);
            }
          }
        });
        return;
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); redo(); return; }

      // Start editing by typing
      if (!readOnly && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
        startEdit(e.key);
      }

      // Delete/Backspace clears cell
      if (!readOnly && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        startEdit("");
        // Immediately confirm with empty value
        setTimeout(() => confirmEdit(), 0);
      }
    },
    [editingCell, readOnly, navigate, startEdit, confirmEdit, undo, redo],
  );

  // Calculate the position of the editing cell for the overlay editor
  const editorPosition = editingCell
    ? (() => {
        const { row, col } = parseAddress(editingCell);
        let left = 48; // row header width
        for (let c = 0; c < col; c++) left += getColumnWidth(c);
        const top = rowHeight + row * rowHeight; // column header height + row offset
        return { left, top };
      })()
    : null;

  return (
    <div
      ref={containerRef}
      data-fancy-sheets-grid=""
      className={cn("relative flex-1 overflow-auto bg-white focus:outline-none dark:bg-zinc-900", className)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Column headers */}
      <div className="sticky top-0 z-10">
        <ColumnHeaders />
      </div>

      {/* Rows */}
      <div className="relative">
        {Array.from({ length: rowCount }, (_, rowIdx) => (
          <div key={rowIdx} className="flex">
            <div className="sticky left-0 z-[5]">
              <RowHeader rowIndex={rowIdx} />
            </div>
            {Array.from({ length: columnCount }, (_, colIdx) => {
              const addr = toAddress(rowIdx, colIdx);
              return <Cell key={addr} address={addr} row={rowIdx} col={colIdx} />;
            })}
          </div>
        ))}

        {/* Selection overlay */}
        <SelectionOverlay />

        {/* Cell editor overlay */}
        {editorPosition && (
          <div
            className="absolute z-20"
            style={{ left: editorPosition.left, top: editorPosition.top }}
          >
            <CellEditor />
          </div>
        )}
      </div>
    </div>
  );
}

SpreadsheetGrid.displayName = "SpreadsheetGrid";
