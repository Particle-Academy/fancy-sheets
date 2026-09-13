// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { SheetWorkbook } from "../src/components/SheetWorkbook/SheetWorkbook";
import { createEmptyWorkbook } from "../src/types/sheet";
import type { CellData } from "../src/types/cell";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

/** A workbook whose A1 is the cell under test; A1 is the active cell on mount. */
function workbookWith(a1: CellData) {
  const wb = createEmptyWorkbook();
  wb.sheets[0].cells = { A1: a1 };
  return wb;
}

describe("a formatted cell in the grid", () => {
  it("renders a currency cell with its symbol and grouping", () => {
    // What holy-sheet's reader hands back for a cell its file formats as
    // "€"#,##0.00;-"€"#,##0.00. The grid showed "$1250000.50".
    const host = mount(
      <SheetWorkbook defaultData={workbookWith({ value: 1250000.5, format: { displayFormat: "currency", decimals: 2, currency: "EUR" } })} />,
    );
    expect(host.textContent).toContain("€1,250,000.50");
    expect(host.textContent).not.toContain("$1250000.50");
  });

  it("counts decimal places from what is on screen, not from the raw value", () => {
    // A percentage with no decimals set shows one place (18.4%). The stepper
    // counted the raw 0.184's three.
    const host = mount(<SheetWorkbook defaultData={workbookWith({ value: 0.184, format: { displayFormat: "percentage" } })} />);
    expect(host.textContent).toContain("18.4%");

    const decrease = host.querySelector('[data-fancy-sheets-toolbar] button[aria-label^="Decrease decimal places"]');
    expect(decrease?.getAttribute("aria-label")).toBe("Decrease decimal places (currently 1)");
  });
});
