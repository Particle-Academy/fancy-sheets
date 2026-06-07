import type { CellValue } from "../types/cell";
import type { WorkbookData, SheetData } from "../types/sheet";
import { expandRange } from "./cell-utils";
import { lexFormula } from "./formula/lexer";
import { parseFormula } from "./formula/parser";
import { evaluateAST } from "./formula/evaluator";
import { buildDependencyGraph, detectCircularRefs, getRecalculationOrder } from "./formula/dependency-graph";

/**
 * Recalculate every formula cell in a workbook, resolving cross-sheet
 * references. Pure — no React, no DOM — so it runs headless in Node for SSR,
 * snapshots, export pipelines, and tests. Returns a new workbook with each
 * formula cell's `computedValue` populated.
 */
export function recalculateWorkbook(workbook: WorkbookData): WorkbookData {
  // Recalculate sequentially so cross-sheet refs see already-computed values
  const recalculated: SheetData[] = [];
  for (const sheet of workbook.sheets) {
    recalculated.push(recalculateSheet(sheet, recalculated));
  }
  // Second pass: recalculate again with ALL sheets computed
  // (handles reverse-order cross-sheet refs like Sheet1 referencing Sheet3)
  const finalSheets: SheetData[] = [];
  for (const sheet of recalculated) {
    finalSheets.push(recalculateSheet(sheet, recalculated));
  }
  return { ...workbook, sheets: finalSheets };
}

/**
 * Recalculate all formula cells in a single sheet, with optional cross-sheet
 * reference support when `allSheets` is supplied. Pure.
 */
export function recalculateSheet(sheet: SheetData, allSheets?: SheetData[]): SheetData {
  const graph = buildDependencyGraph(sheet.cells);
  if (graph.size === 0) return sheet;

  const circular = detectCircularRefs(graph);
  const order = getRecalculationOrder(graph);
  const cells = { ...sheet.cells };

  const getCellValue = (addr: string): CellValue => {
    const c = cells[addr];
    if (!c) return null;
    if (c.formula && c.computedValue !== undefined) return c.computedValue;
    return c.value;
  };

  const getRangeValues = (startAddr: string, endAddr: string): CellValue[] => {
    const addresses = expandRange(startAddr, endAddr);
    return addresses.map(getCellValue);
  };

  // Cross-sheet getters
  const getSheetCellValue = (sheetName: string, addr: string): CellValue => {
    if (!allSheets) return "#REF!";
    const target = allSheets.find((s) => s.name === sheetName || s.id === sheetName);
    if (!target) return "#REF!";
    const c = target.cells[addr];
    if (!c) return null;
    if (c.formula && c.computedValue !== undefined) return c.computedValue;
    return c.value;
  };

  const getSheetRangeValues = (sheetName: string, startAddr: string, endAddr: string): CellValue[] => {
    if (!allSheets) return [];
    const target = allSheets.find((s) => s.name === sheetName || s.id === sheetName);
    if (!target) return [];
    const addresses = expandRange(startAddr, endAddr);
    return addresses.map((a) => {
      const c = target.cells[a];
      if (!c) return null;
      if (c.formula && c.computedValue !== undefined) return c.computedValue;
      return c.value;
    });
  };

  const ctx = { getSheetCellValue, getSheetRangeValues };

  for (const addr of order) {
    const cell = cells[addr];
    if (!cell?.formula) continue;

    if (circular.has(addr)) {
      cells[addr] = { ...cell, computedValue: "#CIRC!" };
      continue;
    }

    try {
      const tokens = lexFormula(cell.formula);
      const ast = parseFormula(tokens);
      const result = evaluateAST(ast, getCellValue, getRangeValues, ctx);
      cells[addr] = { ...cell, computedValue: result };
    } catch {
      cells[addr] = { ...cell, computedValue: "#ERROR!" };
    }
  }

  return { ...sheet, cells };
}
