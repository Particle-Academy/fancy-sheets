import { useReducer, useCallback, useMemo } from "react";
import type { CellValue, CellData, CellFormat } from "../types/cell";
import type { WorkbookData, SheetData } from "../types/sheet";
import type { SelectionState, CellRange } from "../types/selection";
import { createEmptyWorkbook, createEmptySheet } from "../types/sheet";
import { parseAddress, toAddress, expandRange } from "../engine/cell-utils";
import { lexFormula } from "../engine/formula/lexer";
import { parseFormula } from "../engine/formula/parser";
import { evaluateAST } from "../engine/formula/evaluator";
import { buildDependencyGraph, detectCircularRefs, getRecalculationOrder } from "../engine/formula/dependency-graph";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface SpreadsheetState {
  workbook: WorkbookData;
  selection: SelectionState;
  editingCell: string | null;
  editValue: string;
  undoStack: WorkbookData[];
  redoStack: WorkbookData[];
}

function recalculateWorkbook(workbook: WorkbookData): WorkbookData {
  return {
    ...workbook,
    sheets: workbook.sheets.map(recalculateSheet),
  };
}

function createInitialState(data?: WorkbookData): SpreadsheetState {
  const workbook = data ?? createEmptyWorkbook();
  return {
    workbook: recalculateWorkbook(workbook),
    selection: { activeCell: "A1", ranges: [{ start: "A1", end: "A1" }] },
    editingCell: null,
    editValue: "",
    undoStack: [],
    redoStack: [],
  };
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type Action =
  | { type: "SET_CELL_VALUE"; address: string; value: string }
  | { type: "SET_CELL_FORMAT"; addresses: string[]; format: Partial<CellFormat> }
  | { type: "SET_SELECTION"; cell: string }
  | { type: "EXTEND_SELECTION"; cell: string }
  | { type: "ADD_SELECTION"; cell: string }
  | { type: "SELECT_RANGE"; start: string; end: string }
  | { type: "NAVIGATE"; direction: "up" | "down" | "left" | "right"; extend?: boolean }
  | { type: "START_EDIT"; value?: string }
  | { type: "UPDATE_EDIT"; value: string }
  | { type: "CONFIRM_EDIT" }
  | { type: "CANCEL_EDIT" }
  | { type: "RESIZE_COLUMN"; col: number; width: number }
  | { type: "ADD_SHEET" }
  | { type: "RENAME_SHEET"; sheetId: string; name: string }
  | { type: "DELETE_SHEET"; sheetId: string }
  | { type: "SET_ACTIVE_SHEET"; sheetId: string }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SET_WORKBOOK"; workbook: WorkbookData };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getActiveSheet(state: SpreadsheetState): SheetData {
  return state.workbook.sheets.find((s) => s.id === state.workbook.activeSheetId)!;
}

function updateActiveSheet(state: SpreadsheetState, updater: (sheet: SheetData) => SheetData): WorkbookData {
  return {
    ...state.workbook,
    sheets: state.workbook.sheets.map((s) =>
      s.id === state.workbook.activeSheetId ? updater(s) : s,
    ),
  };
}

function pushUndo(state: SpreadsheetState): { undoStack: WorkbookData[]; redoStack: WorkbookData[] } {
  const stack = [...state.undoStack, state.workbook];
  if (stack.length > 50) stack.shift();
  return { undoStack: stack, redoStack: [] };
}

/** Recalculate all formula cells in a sheet */
function recalculateSheet(sheet: SheetData): SheetData {
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
      const result = evaluateAST(ast, getCellValue, getRangeValues);
      cells[addr] = { ...cell, computedValue: result };
    } catch {
      cells[addr] = { ...cell, computedValue: "#ERROR!" };
    }
  }

  return { ...sheet, cells };
}

function getCellDisplayValue(cell: CellData | undefined): string {
  if (!cell) return "";
  if (cell.computedValue !== undefined) return String(cell.computedValue);
  if (cell.value === null) return "";
  return String(cell.value);
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function reducer(state: SpreadsheetState, action: Action): SpreadsheetState {
  switch (action.type) {
    case "SET_CELL_VALUE": {
      const history = pushUndo(state);
      const isFormula = action.value.startsWith("=");
      const cellData: CellData = isFormula
        ? { value: action.value, formula: action.value.slice(1), computedValue: null }
        : { value: isNaN(Number(action.value)) || action.value === "" ? action.value : Number(action.value) };

      // Preserve existing format
      const sheet = getActiveSheet(state);
      const existing = sheet.cells[action.address];
      if (existing?.format) cellData.format = existing.format;

      const workbook = updateActiveSheet(state, (s) => {
        const updated = { ...s, cells: { ...s.cells, [action.address]: cellData } };
        return recalculateSheet(updated);
      });

      return { ...state, workbook, ...history };
    }

    case "SET_CELL_FORMAT": {
      const history = pushUndo(state);
      const workbook = updateActiveSheet(state, (s) => {
        const cells = { ...s.cells };
        for (const addr of action.addresses) {
          const existing = cells[addr] ?? { value: null };
          cells[addr] = { ...existing, format: { ...existing.format, ...action.format } };
        }
        return { ...s, cells };
      });
      return { ...state, workbook, ...history };
    }

    case "SET_SELECTION":
      return {
        ...state,
        selection: {
          activeCell: action.cell,
          ranges: [{ start: action.cell, end: action.cell }],
        },
        editingCell: null,
      };

    case "EXTEND_SELECTION":
      return {
        ...state,
        selection: {
          ...state.selection,
          ranges: [
            { start: state.selection.activeCell, end: action.cell },
            ...state.selection.ranges.slice(1),
          ],
        },
      };

    case "ADD_SELECTION":
      return {
        ...state,
        selection: {
          activeCell: action.cell,
          ranges: [...state.selection.ranges, { start: action.cell, end: action.cell }],
        },
      };

    case "SELECT_RANGE":
      return {
        ...state,
        selection: {
          activeCell: action.start,
          ranges: [{ start: action.start, end: action.end }],
        },
      };

    case "NAVIGATE": {
      const { row, col } = parseAddress(state.selection.activeCell);
      let newRow = row;
      let newCol = col;
      switch (action.direction) {
        case "up": newRow = Math.max(0, row - 1); break;
        case "down": newRow = row + 1; break;
        case "left": newCol = Math.max(0, col - 1); break;
        case "right": newCol = col + 1; break;
      }
      const newAddr = toAddress(newRow, newCol);
      if (action.extend) {
        return {
          ...state,
          selection: {
            ...state.selection,
            ranges: [
              { start: state.selection.activeCell, end: newAddr },
              ...state.selection.ranges.slice(1),
            ],
          },
        };
      }
      return {
        ...state,
        selection: { activeCell: newAddr, ranges: [{ start: newAddr, end: newAddr }] },
        editingCell: null,
      };
    }

    case "START_EDIT": {
      const sheet = getActiveSheet(state);
      const cell = sheet.cells[state.selection.activeCell];
      const initialValue = action.value ?? (cell?.formula ? "=" + cell.formula : getCellDisplayValue(cell));
      return { ...state, editingCell: state.selection.activeCell, editValue: initialValue };
    }

    case "UPDATE_EDIT":
      return { ...state, editValue: action.value };

    case "CONFIRM_EDIT": {
      if (!state.editingCell) return state;
      const newState = reducer(state, { type: "SET_CELL_VALUE", address: state.editingCell, value: state.editValue });
      // Move down after confirm
      const { row, col } = parseAddress(state.editingCell);
      const nextAddr = toAddress(row + 1, col);
      return {
        ...newState,
        editingCell: null,
        editValue: "",
        selection: { activeCell: nextAddr, ranges: [{ start: nextAddr, end: nextAddr }] },
      };
    }

    case "CANCEL_EDIT":
      return { ...state, editingCell: null, editValue: "" };

    case "RESIZE_COLUMN": {
      const workbook = updateActiveSheet(state, (s) => ({
        ...s,
        columnWidths: { ...s.columnWidths, [action.col]: Math.max(30, action.width) },
      }));
      return { ...state, workbook };
    }

    case "ADD_SHEET": {
      const id = `sheet-${Date.now()}`;
      const num = state.workbook.sheets.length + 1;
      const sheet = createEmptySheet(id, `Sheet ${num}`);
      return {
        ...state,
        workbook: {
          sheets: [...state.workbook.sheets, sheet],
          activeSheetId: id,
        },
      };
    }

    case "RENAME_SHEET":
      return {
        ...state,
        workbook: {
          ...state.workbook,
          sheets: state.workbook.sheets.map((s) =>
            s.id === action.sheetId ? { ...s, name: action.name } : s,
          ),
        },
      };

    case "DELETE_SHEET": {
      if (state.workbook.sheets.length <= 1) return state;
      const remaining = state.workbook.sheets.filter((s) => s.id !== action.sheetId);
      const activeId = state.workbook.activeSheetId === action.sheetId
        ? remaining[0].id
        : state.workbook.activeSheetId;
      return {
        ...state,
        workbook: { sheets: remaining, activeSheetId: activeId },
      };
    }

    case "SET_ACTIVE_SHEET":
      return {
        ...state,
        workbook: { ...state.workbook, activeSheetId: action.sheetId },
        selection: { activeCell: "A1", ranges: [{ start: "A1", end: "A1" }] },
        editingCell: null,
      };

    case "UNDO": {
      if (state.undoStack.length === 0) return state;
      const prev = state.undoStack[state.undoStack.length - 1];
      return {
        ...state,
        workbook: prev,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, state.workbook],
      };
    }

    case "REDO": {
      if (state.redoStack.length === 0) return state;
      const next = state.redoStack[state.redoStack.length - 1];
      return {
        ...state,
        workbook: next,
        undoStack: [...state.undoStack, state.workbook],
        redoStack: state.redoStack.slice(0, -1),
      };
    }

    case "SET_WORKBOOK":
      return { ...state, workbook: action.workbook };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSpreadsheetStore(initialData?: WorkbookData) {
  const [state, dispatch] = useReducer(reducer, initialData, (data) => createInitialState(data));

  const actions = useMemo(() => ({
    setCellValue: (address: string, value: string) => dispatch({ type: "SET_CELL_VALUE", address, value }),
    setCellFormat: (addresses: string[], format: Partial<CellFormat>) => dispatch({ type: "SET_CELL_FORMAT", addresses, format }),
    setSelection: (cell: string) => dispatch({ type: "SET_SELECTION", cell }),
    extendSelection: (cell: string) => dispatch({ type: "EXTEND_SELECTION", cell }),
    addSelection: (cell: string) => dispatch({ type: "ADD_SELECTION", cell }),
    selectRange: (start: string, end: string) => dispatch({ type: "SELECT_RANGE", start, end }),
    navigate: (direction: "up" | "down" | "left" | "right", extend?: boolean) => dispatch({ type: "NAVIGATE", direction, extend }),
    startEdit: (value?: string) => dispatch({ type: "START_EDIT", value }),
    updateEdit: (value: string) => dispatch({ type: "UPDATE_EDIT", value }),
    confirmEdit: () => dispatch({ type: "CONFIRM_EDIT" }),
    cancelEdit: () => dispatch({ type: "CANCEL_EDIT" }),
    resizeColumn: (col: number, width: number) => dispatch({ type: "RESIZE_COLUMN", col, width }),
    addSheet: () => dispatch({ type: "ADD_SHEET" }),
    renameSheet: (sheetId: string, name: string) => dispatch({ type: "RENAME_SHEET", sheetId, name }),
    deleteSheet: (sheetId: string) => dispatch({ type: "DELETE_SHEET", sheetId }),
    setActiveSheet: (sheetId: string) => dispatch({ type: "SET_ACTIVE_SHEET", sheetId }),
    undo: () => dispatch({ type: "UNDO" }),
    redo: () => dispatch({ type: "REDO" }),
    setWorkbook: (workbook: WorkbookData) => dispatch({ type: "SET_WORKBOOK", workbook }),
  }), []);

  return { state, actions };
}
