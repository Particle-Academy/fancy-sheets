import { createContext, useContext } from "react";
import type { SpreadsheetContextValue } from "./Spreadsheet.types";

export const SpreadsheetContext = createContext<SpreadsheetContextValue | null>(null);

export function useSpreadsheet(): SpreadsheetContextValue {
  const ctx = useContext(SpreadsheetContext);
  if (!ctx) {
    throw new Error("useSpreadsheet must be used within a <Spreadsheet> component");
  }
  return ctx;
}
