// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { WorkbookFileView } from "../src/components/WorkbookFileView";
import { workbookFromRead } from "../src/utils/workbook-from-read";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/*
 * An .xlsx in fancy-code's FileViewer:
 * `registerOfficeViewer("xlsx", WorkbookFileView, { read: (b) => new XlsxReader().describe(b) })`.
 *
 * workbookFromRead is the mapping from holy-sheet's read schema to this
 * package's WorkbookData. It lived in the lab, so every other app showing a read
 * workbook had to write it again. Its first version kept only value and formula,
 * and a cell the file formats as "$1,250,000.50" showed as 1250000.5: the reader
 * had recovered the format and the mapping threw it away.
 */

function mount(el: ReactElement) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(el));
  return host;
}

afterEach(() => {
  document.body.innerHTML = "";
});

// The shape holy-sheet's reader returns for a formatted, commented cell.
const read = {
  sheets: [
    {
      name: "Revenue",
      cells: {
        A1: { value: "Total" },
        B1: {
          value: 1250000.5,
          format: { bold: true, displayFormat: "currency", decimals: 2, currency: "EUR" },
          comment: { text: "Audited", author: "Finance" },
        },
        B2: { value: 0.184, format: { displayFormat: "percentage", decimals: 1 } },
        B3: { value: 1250001, formula: "ROUND(B1,0)", format: { displayFormat: "number", decimals: 0 } },
        B4: "2026-01-15",
      },
      columnWidths: { 1: 140 },
      mergedRegions: [{ start: "A5", end: "B5" }],
      frozenRows: 1,
    },
    { name: "Notes", cells: {} },
  ],
};

describe("workbookFromRead", () => {
  it("carries format and comment across with value and formula", () => {
    const cells = workbookFromRead(read).sheets[0].cells;
    expect(cells.B1).toEqual({
      value: 1250000.5,
      format: { bold: true, displayFormat: "currency", decimals: 2, currency: "EUR" },
      comment: { text: "Audited", author: "Finance" },
    });
    expect(cells.B2.format).toEqual({ displayFormat: "percentage", decimals: 1 });
    expect(cells.B3).toEqual({ value: 1250001, formula: "ROUND(B1,0)", format: { displayFormat: "number", decimals: 0 } });
  });

  it("keeps a bare value and the sheet layout", () => {
    const [sheet, second] = workbookFromRead(read).sheets;
    expect(sheet.cells.A1).toEqual({ value: "Total" });
    expect(sheet.cells.B4).toEqual({ value: "2026-01-15" });
    expect(sheet.name).toBe("Revenue");
    expect(sheet.columnWidths).toEqual({ 1: 140 });
    expect(sheet.mergedRegions).toEqual([{ start: "A5", end: "B5" }]);
    expect(sheet.frozenRows).toBe(1);
    expect(sheet.frozenCols).toBe(0);
    expect(second.name).toBe("Notes");
    expect(workbookFromRead(read).activeSheetId).toBe(sheet.id);
  });
});

describe("WorkbookFileView", () => {
  it("shows the read workbook read-only, in the FauxClient frame", () => {
    const host = mount(<WorkbookFileView document={read} filename="budget.xlsx" />);
    expect(host.querySelector("[data-react-fancy-faux-client]")).not.toBeNull();
    expect(host.querySelector("[data-react-fancy-faux-client-zoom-in]")).not.toBeNull();
    expect(host.textContent).toContain("Revenue");
    expect(host.textContent).toContain("Notes");
  });

  it("says what is wrong when the document is not a workbook", () => {
    const host = mount(<WorkbookFileView document={{ nope: true }} filename="x.xlsx" />);
    expect(host.querySelector("[data-react-fancy-faux-client]")).toBeNull();
    expect(host.textContent).toContain("x.xlsx");
  });
});
