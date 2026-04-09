import { cn } from "@particle-academy/react-fancy";
import { useSpreadsheet } from "../Spreadsheet/Spreadsheet.context";

interface SpreadsheetToolbarProps {
  children?: React.ReactNode;
  className?: string;
}

const btnClass =
  "inline-flex items-center justify-center rounded px-2 py-1 text-[12px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800";

const activeBtnClass = "bg-zinc-200 dark:bg-zinc-700";

function DefaultToolbar() {
  const {
    selection,
    activeSheet,
    editingCell,
    editValue,
    updateEdit,
    confirmEdit,
    startEdit,
    setCellFormat,
    undo,
    redo,
    canUndo,
    canRedo,
    readOnly,
  } = useSpreadsheet();

  const cell = activeSheet.cells[selection.activeCell];
  const isBold = cell?.format?.bold ?? false;
  const isItalic = cell?.format?.italic ?? false;
  const textAlign = cell?.format?.textAlign ?? "left";

  const selectedAddresses = [selection.activeCell];

  const handleFormulaBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingCell) {
      updateEdit(e.target.value);
    } else {
      startEdit(e.target.value);
    }
  };

  const handleFormulaBarKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmEdit();
    }
  };

  const formulaBarValue = editingCell
    ? editValue
    : cell?.formula
      ? "=" + cell.formula
      : cell?.value != null
        ? String(cell.value)
        : "";

  return (
    <>
      {/* Action buttons */}
      <div className="flex items-center gap-0.5 border-b border-zinc-200 px-1.5 py-1 dark:border-zinc-700">
        <button className={btnClass} onClick={undo} disabled={!canUndo || readOnly} title="Undo (Ctrl+Z)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
        </button>
        <button className={btnClass} onClick={redo} disabled={!canRedo || readOnly} title="Redo (Ctrl+Y)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
        </button>
        <div className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
        <button
          className={cn(btnClass, isBold && activeBtnClass)}
          onClick={() => setCellFormat(selectedAddresses, { bold: !isBold })}
          disabled={readOnly}
          title="Bold"
        >
          <span className="font-bold">B</span>
        </button>
        <button
          className={cn(btnClass, isItalic && activeBtnClass)}
          onClick={() => setCellFormat(selectedAddresses, { italic: !isItalic })}
          disabled={readOnly}
          title="Italic"
        >
          <span className="italic">I</span>
        </button>
        <div className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
        {(["left", "center", "right"] as const).map((align) => (
          <button
            key={align}
            className={cn(btnClass, textAlign === align && activeBtnClass)}
            onClick={() => setCellFormat(selectedAddresses, { textAlign: align })}
            disabled={readOnly}
            title={`Align ${align}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1={align === "left" ? "3" : align === "center" ? "6" : "9"} y1="12" x2={align === "left" ? "15" : align === "center" ? "18" : "21"} y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        ))}
      </div>

      {/* Formula bar */}
      <div data-fancy-sheets-formula-bar="" className="flex items-center gap-2 border-b border-zinc-200 px-2 py-1 dark:border-zinc-700">
        <span className="w-12 shrink-0 text-center text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          {selection.activeCell}
        </span>
        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
        <input
          className="flex-1 bg-transparent text-[13px] outline-none dark:text-zinc-100"
          value={formulaBarValue}
          onChange={handleFormulaBarChange}
          onKeyDown={handleFormulaBarKeyDown}
          readOnly={readOnly}
          placeholder="Enter value or formula (=SUM(A1:A5))"
        />
      </div>
    </>
  );
}

export function SpreadsheetToolbar({ children, className }: SpreadsheetToolbarProps) {
  return (
    <div data-fancy-sheets-toolbar="" className={cn("", className)}>
      {children ?? <DefaultToolbar />}
    </div>
  );
}

SpreadsheetToolbar.displayName = "SpreadsheetToolbar";
