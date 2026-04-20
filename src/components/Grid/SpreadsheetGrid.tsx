import { useCallback, useRef, useState } from "react";
import { cn, ContextMenu } from "@particle-academy/react-fancy";
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
    setFrozenRows,
    setFrozenCols,
    extendSelection,
    undo,
    redo,
    contextMenuItems,
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
        const top = row * rowHeight;
        return { left, top };
      })()
    : null;

  const handleCopy = useCallback(() => {
    const range = selection.ranges[0];
    if (range) {
      const tsv = cellsToTSV(activeSheet.cells, range);
      navigator.clipboard.writeText(tsv);
    }
  }, [selection, activeSheet]);

  const handlePaste = useCallback(() => {
    navigator.clipboard.readText().then((text) => {
      if (!text) return;
      const { values } = tsvToCells(text);
      const { row: startRow, col: startCol } = parseAddress(selection.activeCell);
      for (let r = 0; r < values.length; r++) {
        for (let c = 0; c < values[r].length; c++) {
          setCellValue(toAddress(startRow + r, startCol + c), values[r][c]);
        }
      }
    });
  }, [selection, setCellValue]);

  const handleClearSelection = useCallback(() => {
    const range = selection.ranges[0];
    if (!range) return;
    const { start, end } = range;
    const s = parseAddress(start);
    const e = parseAddress(end);
    const minR = Math.min(s.row, e.row), maxR = Math.max(s.row, e.row);
    const minC = Math.min(s.col, e.col), maxC = Math.max(s.col, e.col);
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        setCellValue(toAddress(r, c), "");
      }
    }
  }, [selection, setCellValue]);

  return (
    <ContextMenu>
      <ContextMenu.Trigger className="min-h-0 flex-1">
        <div
          ref={containerRef}
          data-fancy-sheets-grid=""
          className={cn("relative h-full overflow-auto bg-white focus:outline-none dark:bg-zinc-900", className)}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          {/* Column headers */}
          <div className="sticky top-0 z-10">
            <ColumnHeaders />
          </div>

          {/* Rows */}
          <div className="relative">
            {Array.from({ length: rowCount }, (_, rowIdx) => {
              const isFrozenRow = rowIdx < activeSheet.frozenRows;
              return (
                <div
                  key={rowIdx}
                  className="flex"
                  style={isFrozenRow ? {
                    position: "sticky",
                    top: rowHeight + rowIdx * rowHeight,
                    zIndex: 8,
                  } : undefined}
                >
                  <div className="sticky left-0 z-[5]">
                    <RowHeader rowIndex={rowIdx} />
                  </div>
                  {Array.from({ length: columnCount }, (_, colIdx) => {
                    const addr = toAddress(rowIdx, colIdx);
                    const isFrozenCol = colIdx < activeSheet.frozenCols;
                    return (
                      <div
                        key={addr}
                        style={isFrozenCol ? {
                          position: "sticky",
                          left: 48 + Array.from({ length: colIdx }, (_, c) => getColumnWidth(c)).reduce((a, b) => a + b, 0),
                          zIndex: isFrozenRow ? 9 : 6,
                        } : undefined}
                      >
                        <Cell address={addr} row={rowIdx} col={colIdx} />
                      </div>
                    );
                  })}
                </div>
              );
            })}

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
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item onClick={handleCopy}>Copy</ContextMenu.Item>
        <ContextMenu.Item onClick={handlePaste} disabled={readOnly}>Paste</ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item onClick={handleClearSelection} disabled={readOnly}>Clear cells</ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item onClick={() => {
          const row = parseAddress(selection.activeCell).row;
          setFrozenRows(activeSheet.frozenRows > 0 ? 0 : row);
        }} disabled={readOnly}>
          {activeSheet.frozenRows > 0 ? "Unfreeze rows" : "Freeze rows above"}
        </ContextMenu.Item>
        <ContextMenu.Item onClick={() => {
          const col = parseAddress(selection.activeCell).col;
          setFrozenCols(activeSheet.frozenCols > 0 ? 0 : col);
        }} disabled={readOnly}>
          {activeSheet.frozenCols > 0 ? "Unfreeze columns" : "Freeze columns left"}
        </ContextMenu.Item>
        {(() => {
          const items = typeof contextMenuItems === "function"
            ? contextMenuItems(selection.activeCell)
            : contextMenuItems;
          if (!items || items.length === 0) return null;
          return (
            <>
              <ContextMenu.Separator />
              {items.map((item, i) => (
                <ContextMenu.Item
                  key={i}
                  onClick={() => item.onClick(selection.activeCell)}
                  disabled={typeof item.disabled === "function" ? item.disabled(selection.activeCell) : item.disabled}
                  danger={item.danger}
                >
                  {item.label}
                </ContextMenu.Item>
              ))}
            </>
          );
        })()}
      </ContextMenu.Content>
    </ContextMenu>
  );
}

SpreadsheetGrid.displayName = "SpreadsheetGrid";
