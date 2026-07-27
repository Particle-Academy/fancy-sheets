// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
// SheetWorkbook is the COMPOSED surface — <Spreadsheet> alone renders only
// what you compose into it, so the chrome under test lives here.
import { SheetWorkbook } from "../src/components/SheetWorkbook/SheetWorkbook";
import { createEmptyWorkbook } from "../src/types/sheet";

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

/**
 * The workbook chrome is nameable and navigable.
 *
 * None of it was, and nothing here could have found out: the package had one
 * test suite — pure logic, in `src/hooks/` — and no jsdom at all, so not one of
 * its 12 React components could be rendered and inspected.
 *
 * The toolbar's buttons contain a bare `<svg>` and carried only a `title`, which
 * is not a reliable accessible name; the format picker was a `<select>` with no
 * label of any kind; and the sheet tabs were a row of plain buttons with no tab
 * semantics, so nothing announced which sheet was active.
 */
const workbook = () => createEmptyWorkbook();

describe("toolbar", () => {
  it("gives every button an accessible name", () => {
    const host = mount(<SheetWorkbook defaultData={workbook()} />);

    const buttons = [...host.querySelectorAll("[data-fancy-sheets-toolbar] button")];
    expect(buttons.length).toBeGreaterThan(0);

    const unnamed = buttons.filter(
      (b) => !b.getAttribute("aria-label") && !(b.textContent ?? "").trim(),
    );
    expect(unnamed).toHaveLength(0);
  });

  it("names the format picker, which had no label at all", () => {
    const host = mount(<SheetWorkbook defaultData={workbook()} />);

    const select = host.querySelector("[data-fancy-sheets-toolbar] select");
    expect(select).not.toBeNull();
    expect(select!.getAttribute("aria-label")).toBe("Cell format");
  });

  it("names the formula bar, the most-used control in the component", () => {
    const host = mount(<SheetWorkbook defaultData={workbook()} />);

    const input = host.querySelector("[data-fancy-sheets-formula-input]");
    expect(input?.getAttribute("aria-label")).toMatch(/Formula bar/);
  });
});

describe("sheet tabs", () => {
  it("is a tablist whose active tab says so", () => {
    // A row of plain buttons never announces which sheet you are on.
    const host = mount(<SheetWorkbook defaultData={workbook()} />);

    const list = host.querySelector('[data-fancy-sheets-tabs][role="tablist"]');
    expect(list).not.toBeNull();

    const tabs = [...host.querySelectorAll('[role="tab"]')];
    expect(tabs.length).toBeGreaterThan(0);
    expect(tabs.filter((t) => t.getAttribute("aria-selected") === "true")).toHaveLength(1);
  });

  it("gives each tab a handle keyed by its sheet", () => {
    // The Human+ contract: an agent switches sheets by id rather than by
    // counting DOM children.
    const host = mount(<SheetWorkbook defaultData={workbook()} />);

    const handles = [...host.querySelectorAll("[data-fancy-sheet-tab]")];
    expect(handles.length).toBeGreaterThan(0);
    expect(handles[0].getAttribute("data-fancy-sheet-tab")).toBeTruthy();
  });

  it("names the add-sheet control, whose label was a bare +", () => {
    const host = mount(<SheetWorkbook defaultData={workbook()} />);

    const add = [...host.querySelectorAll("[data-fancy-sheets-tabs] button")].find(
      (b) => b.getAttribute("aria-label") === "Add sheet",
    );
    expect(add).toBeTruthy();
  });
});
