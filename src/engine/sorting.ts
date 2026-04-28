import type { CellMap } from "../types/sheet";
import { parseAddress, toAddress } from "./cell-utils";

/** Sort rows by a column */
export function sortCellsByColumn(
  cells: CellMap,
  column: number,
  direction: "asc" | "desc",
  rowStart: number,
  rowEnd: number,
): CellMap {
  // Collect row data. Coerce booleans to 1/0 so the comparator below can
  // treat them numerically without a special case.
  const rows: { rowIdx: number; sortValue: string | number | null }[] = [];
  for (let r = rowStart; r <= rowEnd; r++) {
    const addr = toAddress(r, column);
    const cell = cells[addr];
    const raw = cell?.computedValue ?? cell?.value ?? null;
    const val: string | number | null = typeof raw === "boolean" ? (raw ? 1 : 0) : raw;
    rows.push({ rowIdx: r, sortValue: val });
  }

  // Sort
  rows.sort((a, b) => {
    const av = a.sortValue;
    const bv = b.sortValue;
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;

    const aNum = typeof av === "number" ? av : Number(av);
    const bNum = typeof bv === "number" ? bv : Number(bv);

    let cmp: number;
    if (!isNaN(aNum) && !isNaN(bNum)) {
      cmp = aNum - bNum;
    } else {
      cmp = String(av).localeCompare(String(bv));
    }

    return direction === "desc" ? -cmp : cmp;
  });

  // Build new cell map with reordered rows
  const newCells = { ...cells };

  // Find all columns that have data in the sort range
  const colSet = new Set<number>();
  for (const addr of Object.keys(cells)) {
    const { row, col } = parseAddress(addr);
    if (row >= rowStart && row <= rowEnd) colSet.add(col);
  }

  // Clear old positions
  for (let r = rowStart; r <= rowEnd; r++) {
    for (const c of colSet) {
      delete newCells[toAddress(r, c)];
    }
  }

  // Write new positions
  rows.forEach((item, newIdx) => {
    const targetRow = rowStart + newIdx;
    for (const c of colSet) {
      const oldAddr = toAddress(item.rowIdx, c);
      const cell = cells[oldAddr];
      if (cell) {
        newCells[toAddress(targetRow, c)] = cell;
      }
    }
  });

  return newCells;
}
