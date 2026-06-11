import { describe, it, expect } from "vitest";
import { reduceWorkbook } from "./use-sheet-state";
import { createEmptyWorkbook } from "../types";

/** Fresh single-sheet workbook — sheet id "sheet-1", name "Sheet 1". */
const wb = () => createEmptyWorkbook();

describe("reduceWorkbook", () => {
  it("set_cell writes a value and recalculates dependent formulas", () => {
    let w = wb();
    w = reduceWorkbook(w, { type: "set_cell", sheet: "sheet-1", address: "A1", value: 5 });
    w = reduceWorkbook(w, { type: "set_cell", sheet: "sheet-1", address: "B1", value: "", formula: "A1*2" });

    const cells = w.sheets[0].cells;
    expect(cells.A1.value).toBe(5);
    expect(cells.B1.formula).toBe("A1*2");
    expect(cells.B1.computedValue).toBe(10);
  });

  it("matches the target sheet by name as well as id", () => {
    let w = wb();
    w = reduceWorkbook(w, { type: "set_cell", sheet: "Sheet 1", address: "A1", value: "hi" });
    expect(w.sheets[0].cells.A1.value).toBe("hi");
  });

  it("ignores an op for an unknown sheet (returns the same reference)", () => {
    const w = wb();
    const out = reduceWorkbook(w, { type: "set_cell", sheet: "nope", address: "A1", value: 1 });
    expect(out).toBe(w);
  });

  it("set_range writes a row-major block anchored at start", () => {
    let w = wb();
    w = reduceWorkbook(w, {
      type: "set_range",
      sheet: "sheet-1",
      start: "A1",
      values: [[1, 2], [3, 4]],
    });
    const c = w.sheets[0].cells;
    expect([c.A1.value, c.B1.value, c.A2.value, c.B2.value]).toEqual([1, 2, 3, 4]);
  });

  it("clears the formula when a later set_cell omits it, preserving value", () => {
    let w = wb();
    w = reduceWorkbook(w, { type: "set_cell", sheet: "sheet-1", address: "A1", value: "", formula: "1+1" });
    expect(w.sheets[0].cells.A1.formula).toBe("1+1");

    w = reduceWorkbook(w, { type: "set_cell", sheet: "sheet-1", address: "A1", value: 9 });
    expect(w.sheets[0].cells.A1.formula).toBeUndefined();
    expect(w.sheets[0].cells.A1.value).toBe(9);
  });

  it("preserves an existing cell's format on a value write", () => {
    let w = wb();
    w.sheets[0].cells.A1 = { value: 1, format: { bold: true } } as never;
    w = reduceWorkbook(w, { type: "set_cell", sheet: "sheet-1", address: "A1", value: 2 });
    expect(w.sheets[0].cells.A1.value).toBe(2);
    expect((w.sheets[0].cells.A1.format as { bold?: boolean }).bold).toBe(true);
  });

  it("set_workbook replaces the whole workbook", () => {
    let w = wb();
    w = reduceWorkbook(w, { type: "set_cell", sheet: "sheet-1", address: "A1", value: 1 });
    const out = reduceWorkbook(w, { type: "set_workbook", data: createEmptyWorkbook() });
    expect(out.sheets[0].cells).toEqual({});
  });

  it("does not mutate the input workbook", () => {
    const w = wb();
    const before = JSON.stringify(w);
    reduceWorkbook(w, { type: "set_cell", sheet: "sheet-1", address: "A1", value: 42 });
    expect(JSON.stringify(w)).toBe(before);
  });
});
