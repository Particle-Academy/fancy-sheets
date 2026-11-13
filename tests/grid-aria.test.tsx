// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
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

/** Nearest ancestor carrying an ARIA role; generic divs are transparent. */
function roleParent(el: Element): Element | null {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const r = p.getAttribute("role");
    if (r && r !== "presentation" && r !== "none") return p;
  }
  return null;
}

/**
 * The grid's ARIA structure is valid (lab run 601, K29).
 *
 * axe recorded `aria-required-parent` (critical) on every cell: each was
 * `role="gridcell"` with no row and no grid above it, so a screen reader had a
 * few thousand loose cells and no table. The sheet tabs were
 * `aria-required-children`: the add and delete buttons sat inside the tablist.
 */
describe("grid structure", () => {
  it("puts every cell in a row, and every row in a grid", () => {
    const host = mount(<SheetWorkbook defaultData={createEmptyWorkbook()} rowCount={3} columnCount={3} />);

    const cells = [...host.querySelectorAll('[role="gridcell"]')];
    expect(cells.length).toBe(9);
    for (const cell of cells) {
      const row = roleParent(cell);
      expect(row?.getAttribute("role")).toBe("row");
      expect(roleParent(row!)?.getAttribute("role")).toBe("grid");
    }
  });

  it("names the grid and marks its headers", () => {
    const host = mount(<SheetWorkbook defaultData={createEmptyWorkbook()} rowCount={3} columnCount={3} />);

    const grid = host.querySelector('[data-fancy-sheets-grid][role="grid"]');
    expect(grid).not.toBeNull();
    expect(grid!.getAttribute("aria-label")).toBeTruthy();
    expect(grid!.getAttribute("aria-rowcount")).toBe("4"); // header row + 3
    expect(grid!.getAttribute("aria-colcount")).toBe("4"); // row-number column + 3

    expect(host.querySelectorAll('[role="columnheader"]').length).toBe(3);
    expect(host.querySelectorAll('[role="rowheader"]').length).toBe(3);
    for (const h of host.querySelectorAll('[role="columnheader"], [role="rowheader"]')) {
      expect(roleParent(h)?.getAttribute("role")).toBe("row");
    }
  });

  it("keeps only tabs inside the tablist", () => {
    // Two sheets, so the delete control renders as well as add.
    const wb = createEmptyWorkbook();
    wb.sheets.push({ ...wb.sheets[0], id: "s2", name: "Sheet2" });
    const host = mount(<SheetWorkbook defaultData={wb} />);

    const list = host.querySelector('[role="tablist"]')!;
    expect(list).not.toBeNull();
    const owned = [...list.querySelectorAll("button, input, [role]")];
    expect(owned.length).toBeGreaterThan(0);
    for (const el of owned) expect(el.getAttribute("role")).toBe("tab");

    // The controls still exist, in the tab bar.
    const bar = host.querySelector("[data-fancy-sheets-tabs]")!;
    expect([...bar.querySelectorAll("button")].some((b) => b.getAttribute("aria-label") === "Add sheet")).toBe(true);
    expect([...bar.querySelectorAll("button")].some((b) => /^Delete sheet/.test(b.getAttribute("aria-label") ?? ""))).toBe(true);
  });

  it("draws header numbers and letters dark enough for their grey ground", () => {
    // text-zinc-500 on bg-zinc-100 is 4.39:1 at 11px (axe color-contrast).
    const host = mount(<SheetWorkbook defaultData={createEmptyWorkbook()} rowCount={2} columnCount={2} />);
    const headers = [...host.querySelectorAll('[role="rowheader"], [role="columnheader"]')];
    expect(headers.length).toBe(4);
    for (const h of headers) {
      expect(h.className).not.toMatch(/(^|\s)text-zinc-500(\s|$)/);
    }
  });
});

describe("decimal buttons", () => {
  it("do not show text that is missing from their name", () => {
    // axe label-content-name-mismatch: ".0" / ".00" shown, absent from the
    // aria-label. The glyphs are decoration; the name says what they do.
    const host = mount(<SheetWorkbook defaultData={createEmptyWorkbook()} />);
    const buttons = [...host.querySelectorAll("[data-fancy-sheets-toolbar] button")].filter((b) =>
      /decimal places/.test(b.getAttribute("aria-label") ?? ""),
    );
    expect(buttons).toHaveLength(2);
    for (const b of buttons) {
      const walker = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
      let seen = 0;
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!(n.textContent ?? "").trim()) continue;
        seen++;
        expect(n.parentElement!.closest('[aria-hidden="true"]')).not.toBeNull();
      }
      expect(seen).toBeGreaterThan(0);
    }
  });
});
