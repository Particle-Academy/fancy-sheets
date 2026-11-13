import { useState, useCallback } from "react";
import { cn } from "@particle-academy/react-fancy";
import { useSpreadsheet } from "../Spreadsheet/Spreadsheet.context";

interface SpreadsheetSheetTabsProps {
  className?: string;
}

export function SpreadsheetSheetTabs({ className }: SpreadsheetSheetTabsProps) {
  const { workbook, setActiveSheet, addSheet, renameSheet, deleteSheet, readOnly } = useSpreadsheet();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const handleDoubleClick = useCallback(
    (sheetId: string, name: string) => {
      if (readOnly) return;
      setRenamingId(sheetId);
      setRenameValue(name);
    },
    [readOnly],
  );

  const handleRenameConfirm = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      renameSheet(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  }, [renamingId, renameValue, renameSheet]);

  const activeSheet = workbook.sheets.find((s) => s.id === workbook.activeSheetId);
  const canDelete = !readOnly && workbook.sheets.length > 1 && activeSheet && renamingId !== activeSheet.id;

  // The bar holds the tablist AND the sheet controls; the tablist holds only
  // tabs. The add and delete buttons used to sit inside role="tablist", which
  // allows nothing but tabs (axe aria-required-children, critical).
  return (
    <div
      data-fancy-sheets-tabs=""
      className={cn(
        "flex items-center gap-0.5 border-t border-zinc-200 bg-zinc-50 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900/50",
        className,
      )}
    >
      <div role="tablist" aria-label="Sheets" data-fancy-sheets-tablist="" className="flex items-center gap-0.5">
      {workbook.sheets.map((sheet) => {
        const isActive = sheet.id === workbook.activeSheetId;
        const isRenaming = renamingId === sheet.id;

        return (
          <div key={sheet.id} className="relative flex items-center">
            {isRenaming ? (
              <input
                aria-label={`Rename sheet ${sheet.name}`}
                className="rounded border border-blue-500 bg-white px-2 py-0.5 text-[12px] outline-none dark:bg-zinc-800 dark:text-zinc-100"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameConfirm}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameConfirm();
                  if (e.key === "Escape") {
                    // Handled: cancelling the rename is this Escape's whole
                    // job, so a full-screen workbook must not also close on it.
                    e.preventDefault();
                    setRenamingId(null);
                  }
                }}
                autoFocus
              />
            ) : (
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                data-fancy-sheet-tab={sheet.id}
                title={`${sheet.name} — double-click to rename`}
                className={cn(
                  "rounded px-3 py-1 text-[12px] font-medium transition-colors",
                  isActive
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
                )}
                onClick={() => setActiveSheet(sheet.id)}
                onDoubleClick={() => handleDoubleClick(sheet.id, sheet.name)}
              >
                {sheet.name}
              </button>
            )}
          </div>
        );
      })}
      </div>
      {canDelete && (
        <button
          type="button"
          aria-label={`Delete sheet ${activeSheet.name}`}
          data-fancy-sheets-delete-sheet={activeSheet.id}
          className="ml-0.5 rounded p-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
          onClick={() => deleteSheet(activeSheet.id)}
          title="Delete sheet"
        >
          <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      )}
      {!readOnly && (
        <button
          type="button"
          aria-label="Add sheet"
          className="rounded px-2 py-1 text-[12px] font-medium text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          onClick={addSheet}
          title="Add sheet"
        >
          +
        </button>
      )}
    </div>
  );
}

SpreadsheetSheetTabs.displayName = "SpreadsheetSheetTabs";
