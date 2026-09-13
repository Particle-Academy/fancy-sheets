import { useCallback, memo, useState } from "react";
import { cn } from "@particle-academy/react-fancy";
import { useSpreadsheet } from "../Spreadsheet/Spreadsheet.context";
import type { CellData } from "../../types/cell";
import { formatCellValue } from "../../engine/cell-display";

const DEFAULT_COMMENT_COLOR = "#f59e0b";

interface CellProps {
  address: string;
  row: number;
  col: number;
}

function getCellDisplayValue(cell: CellData | undefined): string {
  if (!cell) return "";
  const val = cell.formula && cell.computedValue !== undefined ? cell.computedValue : cell.value;
  return formatCellValue(val, cell);
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
    highlights,
    _isDragging,
  } = useSpreadsheet();

  const cell = activeSheet.cells[address];
  const highlight = highlights[address];
  const isActive = isCellActive(address);
  const isSelected = isCellSelected(address);
  const isEditing = editingCell === address;
  const displayValue = getCellDisplayValue(cell);
  const width = getColumnWidth(col);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if (e.shiftKey) {
        extendSelection(address);
      } else if (e.ctrlKey || e.metaKey) {
        addSelection(address);
      } else {
        setSelection(address);
      }
      _isDragging.current = true;
    },
    [address, setSelection, extendSelection, addSelection, _isDragging],
  );

  const handleMouseEnter = useCallback(() => {
    if (_isDragging.current) {
      extendSelection(address);
    }
  }, [address, extendSelection, _isDragging]);

  const handleMouseUp = useCallback(() => {
    _isDragging.current = false;
  }, [_isDragging]);

  const handleDoubleClick = useCallback(() => {
    if (readOnly) return;
    startEdit();
  }, [readOnly, startEdit]);

  const formatStyle: React.CSSProperties = {};
  if (cell?.format?.bold) formatStyle.fontWeight = "bold";
  if (cell?.format?.italic) formatStyle.fontStyle = "italic";
  if (cell?.format?.textAlign) formatStyle.textAlign = cell.format.textAlign;
  if (cell?.format?.backgroundColor) {
    formatStyle.backgroundColor = cell.format.backgroundColor;
    // When a custom background is set but no explicit text color, force dark text
    // so content stays readable against light/pastel backgrounds in both modes.
    if (!cell.format.color) formatStyle.color = "#1f2937";
  }
  if (cell?.format?.color) formatStyle.color = cell.format.color;
  if (cell?.format?.fontSize) formatStyle.fontSize = cell.format.fontSize;
  if (cell?.format?.borderTop) {
    formatStyle.borderTopWidth = 1;
    formatStyle.borderTopStyle = "solid";
    formatStyle.borderTopColor = cell.format.borderTop;
  }
  if (cell?.format?.borderRight) formatStyle.borderRightColor = cell.format.borderRight;
  if (cell?.format?.borderBottom) formatStyle.borderBottomColor = cell.format.borderBottom;
  if (cell?.format?.borderLeft) {
    formatStyle.borderLeftWidth = 1;
    formatStyle.borderLeftStyle = "solid";
    formatStyle.borderLeftColor = cell.format.borderLeft;
  }

  // Comment indicator
  const comment = cell?.comment;
  const commentColor = comment?.color ?? DEFAULT_COMMENT_COLOR;
  if (comment) {
    formatStyle.borderColor = commentColor;
    formatStyle.borderWidth = 1;
    formatStyle.borderStyle = "solid";
  }

  const [showComment, setShowComment] = useState(false);

  return (
    <div
      data-fancy-sheets-cell=""
      data-selected={isSelected || undefined}
      data-active={isActive || undefined}
      data-highlighted={!!highlight || undefined}
      role="gridcell"
      className={cn(
        "relative flex items-center truncate border-r border-b border-zinc-200 bg-white px-1.5 text-[13px] select-none dark:border-zinc-700 dark:bg-zinc-900",
        isActive && "ring-2 ring-inset ring-blue-500",
        isSelected && !isActive && "bg-blue-50 dark:bg-blue-950/40",
        cell?.format?.className,
      )}
      style={{ width, minWidth: width, height: rowHeight, ...formatStyle }}
      onMouseDown={handleMouseDown}
      onMouseEnter={(e) => {
        handleMouseEnter();
        if (comment) setShowComment(true);
      }}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { if (comment) setShowComment(false); }}
      onDoubleClick={handleDoubleClick}
    >
      {highlight && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            outline: `2px solid ${highlight.color}`,
            outlineOffset: '-2px',
            backgroundColor: highlight.backgroundColor
              ?? (highlight.color.startsWith('#') ? `${highlight.color}1A` : undefined),
          }}
          aria-hidden
        />
      )}
      {highlight?.label && (
        <span
          className="pointer-events-none absolute top-0 left-0 z-[1] px-0.5 text-[8px] font-bold leading-none text-white"
          style={{ backgroundColor: highlight.color }}
          aria-hidden
        >
          {highlight.label}
        </span>
      )}
      {!isEditing && <span className="truncate">{displayValue}</span>}
      {comment && (
        <div
          className="absolute top-0 right-0 h-0 w-0"
          style={{
            borderTop: `6px solid ${commentColor}`,
            borderLeft: "6px solid transparent",
          }}
          aria-hidden
        />
      )}
      {comment && showComment && (
        <div
          className="absolute top-full left-0 z-50 mt-0.5 max-w-[200px] rounded border bg-white px-2 py-1.5 text-[11px] leading-tight shadow-lg dark:bg-zinc-800"
          style={{ borderColor: commentColor }}
        >
          {comment.author && (
            <div className="mb-0.5 font-semibold" style={{ color: commentColor }}>{comment.author}</div>
          )}
          <div className="text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap">{comment.text}</div>
        </div>
      )}
    </div>
  );
});

Cell.displayName = "Cell";
