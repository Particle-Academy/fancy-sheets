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

  return (
    <div
      data-fancy-sheets-tabs=""
      className={cn(
        "flex items-center gap-0.5 border-t border-zinc-200 bg-zinc-50 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900/50",
        className,
      )}
    >
      {workbook.sheets.map((sheet) => {
        const isActive = sheet.id === workbook.activeSheetId;
        const isRenaming = renamingId === sheet.id;

        return (
          <div key={sheet.id} className="relative flex items-center">
            {isRenaming ? (
              <input
                className="rounded border border-blue-500 bg-white px-2 py-0.5 text-[12px] outline-none dark:bg-zinc-800 dark:text-zinc-100"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameConfirm}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameConfirm();
                  if (e.key === "Escape") setRenamingId(null);
                }}
                autoFocus
              />
            ) : (
              <button
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
            {!readOnly && workbook.sheets.length > 1 && isActive && !isRenaming && (
              <button
                className="ml-0.5 rounded p-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                onClick={() => deleteSheet(sheet.id)}
                title="Delete sheet"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            )}
          </div>
        );
      })}
      {!readOnly && (
        <button
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
