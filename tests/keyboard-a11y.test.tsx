// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SheetWorkbook } from "../src/components/SheetWorkbook/SheetWorkbook";
import { createEmptyWorkbook } from "../src/types/sheet";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Keyboard accessibility of the grid and the formula bar.
 *
 * Measured by an accessibility checker in Chromium with real Tab presses, at
 * 375 / 768 / 1280 px:
 * - the focused grid (`tabindex=0`, `focus:outline-none`) showed no focus
 *   indicator;
 * - the focused formula bar input (`outline-none`) showed none either;
 * - Tab on the grid was always cancelled and turned into cell navigation, so
 *   focus could never leave the grid (WCAG 2.1.2).
 *
 * jsdom cannot compute :focus-visible, so the ring is asserted by its classes on
 * the focused element itself. The trap is asserted through `defaultPrevented`:
 * an unprevented Tab is the browser moving focus on.
 */

let roots: Root[] = [];

function mount(el: ReactElement) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  act(() => root.render(el));
  return host;
}

afterEach(() => {
  for (const r of roots) act(() => r.unmount());
  roots = [];
  document.body.innerHTML = "";
});

function key(target: EventTarget, k: string, init: KeyboardEventInit = {}) {
  const e = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init });
  act(() => {
    target.dispatchEvent(e);
  });
  return e;
}

const grid = (host: HTMLElement) => host.querySelector<HTMLElement>("[data-fancy-sheets-grid]")!;
const formula = (host: HTMLElement) =>
  host.querySelector<HTMLInputElement>("[data-fancy-sheets-formula-input]")!;
const editor = (host: HTMLElement) => host.querySelector<HTMLInputElement>("[data-fancy-sheets-cell-editor]");
const activeCell = (host: HTMLElement) =>
  formula(host).getAttribute("aria-label")!.replace(/^Formula bar\W*/, "");

const RING = [
  "focus-visible:ring-2",
  "focus-visible:ring-inset",
  "focus-visible:ring-[color:var(--fancy-focus,var(--color-blue-500))]",
  "dark:focus-visible:ring-[color:var(--fancy-focus-dark,var(--color-blue-400))]",
];

function focusedClasses(el: HTMLElement): string[] {
  act(() => el.focus());
  expect(document.activeElement).toBe(el);
  return (document.activeElement as HTMLElement).className.split(/\s+/);
}

describe("visible focus", () => {
  it("the focused grid container itself carries the kit focus ring", () => {
    const host = mount(<SheetWorkbook defaultData={createEmptyWorkbook()} />);
    const classes = focusedClasses(grid(host));
    for (const c of RING) expect(classes).toContain(c);
  });

  it("the focused formula bar input itself carries the kit focus ring", () => {
    const host = mount(<SheetWorkbook defaultData={createEmptyWorkbook()} />);
    expect(formula(host)).not.toBeNull();
    const classes = focusedClasses(formula(host));
    for (const c of RING) expect(classes).toContain(c);
  });
});

describe("grid — no keyboard trap (APG data grid)", () => {
  it("does not intercept Tab when no cell is being edited, so focus leaves the grid", () => {
    const host = mount(<SheetWorkbook defaultData={createEmptyWorkbook()} />);
    expect(activeCell(host)).toBe("A1");
    const e = key(grid(host), "Tab");
    expect(e.defaultPrevented).toBe(false);
    expect(activeCell(host), "Tab must not move between cells").toBe("A1");
  });

  it("does not intercept Shift+Tab when no cell is being edited", () => {
    const host = mount(<SheetWorkbook defaultData={createEmptyWorkbook()} />);
    key(grid(host), "ArrowRight");
    expect(activeCell(host)).toBe("B1");
    const e = key(grid(host), "Tab", { shiftKey: true });
    expect(e.defaultPrevented).toBe(false);
    expect(activeCell(host)).toBe("B1");
  });

  it("does not intercept Tab in a read-only workbook either", () => {
    const host = mount(<SheetWorkbook defaultData={createEmptyWorkbook()} readOnly />);
    expect(key(grid(host), "Tab").defaultPrevented).toBe(false);
  });

  it("arrow keys still move between cells", () => {
    const host = mount(<SheetWorkbook defaultData={createEmptyWorkbook()} />);
    const e = key(grid(host), "ArrowRight");
    expect(e.defaultPrevented).toBe(true);
    expect(activeCell(host)).toBe("B1");
    key(grid(host), "ArrowDown");
    expect(activeCell(host)).toBe("B2");
  });

  it("Tab while editing a cell is still handled by the cell editor (commits)", () => {
    const host = mount(<SheetWorkbook defaultData={createEmptyWorkbook()} />);
    key(grid(host), "z");
    const ed = editor(host);
    expect(ed).not.toBeNull();
    const e = key(ed!, "Tab");
    expect(e.defaultPrevented).toBe(true);
    expect(editor(host), "Tab commits and closes the editor").toBeNull();
  });
});
