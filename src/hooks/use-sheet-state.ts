import { parseAddress, toAddress } from "../engine/cell-utils";
import { recalculateWorkbook } from "../engine/recalc";
import type { CellData, CellMap, CellValue, WorkbookData } from "../types";
import type { SheetOp } from "../types/op";

/**
 * Apply a single {@link SheetOp} to a workbook, returning a new workbook (pure,
 * React-free). The same reducer drives replayed remote ops and could back a
 * server-side store, so independent agent implementations converge on identical
 * state. Formulas are recalculated after every op so computed values stay fresh.
 */
export function reduceWorkbook(workbook: WorkbookData, op: SheetOp): WorkbookData {
  if (op.type === "set_workbook") {
    return recalculateWorkbook(op.data);
  }

  const index = workbook.sheets.findIndex((s) => s.id === op.sheet || s.name === op.sheet);
  if (index === -1) return workbook;

  const sheet = workbook.sheets[index];
  const cells: CellMap = { ...sheet.cells };

  if (op.type === "set_cell") {
    setCell(cells, op.address, op.value, op.formula);
  } else {
    const { row: r0, col: c0 } = parseAddress(op.start);
    op.values.forEach((rowVals, r) => {
      rowVals.forEach((value, c) => {
        setCell(cells, toAddress(r0 + r, c0 + c), value);
      });
    });
  }

  const sheets = [...workbook.sheets];
  sheets[index] = { ...sheet, cells };
  return recalculateWorkbook({ ...workbook, sheets });
}

/** Write a cell in place — preserves existing format/comment/meta; clears the
 *  formula when none is supplied. A null write to an absent cell is a no-op. */
function setCell(cells: CellMap, address: string, value: CellValue, formula?: string): void {
  const existing = cells[address];
  if (value === null && formula === undefined && existing === undefined) return;

  const next: CellData = { ...existing, value };
  if (formula !== undefined) {
    next.formula = formula;
  } else {
    delete next.formula;
  }
  cells[address] = next;
}
