import type { CellValue } from "../../../types/cell";

export type FormulaFunction = (...args: CellValue[]) => CellValue;
export type FormulaRangeFunction = (args: CellValue[][]) => CellValue;

interface FunctionEntry {
  fn: FormulaRangeFunction;
}

const functionRegistry = new Map<string, FunctionEntry>();

export function registerFunction(name: string, fn: FormulaRangeFunction): void {
  functionRegistry.set(name.toUpperCase(), { fn });
}

export function getFunction(name: string): FunctionEntry | undefined {
  return functionRegistry.get(name.toUpperCase());
}
