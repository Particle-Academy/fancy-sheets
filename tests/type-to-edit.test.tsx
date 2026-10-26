// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SheetWorkbook } from "../src/components/SheetWorkbook/SheetWorkbook";
import { createEmptyWorkbook } from "../src/types/sheet";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Typing on a selected cell starts an edit seeded with that key. The keydown
 * must then be cancelled: the editor takes focus before the browser inserts
 * the character, so an uncancelled key lands a SECOND time in the editor.
 * Typing "zz" on a cell gave "zzz" in Chromium.
 *
 * jsdom does not perform the browser's default text insertion, so this cannot
 * observe the doubled character directly. It asserts the precondition that
 * decides it, `defaultPrevented`, which is what the browser reads before
 * inserting.
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
const editor = (host: HTMLElement) => host.querySelector<HTMLInputElement>("[data-fancy-sheets-cell-editor]");

describe("type-to-edit", () => {
  it("cancels the key that starts the edit, so the browser does not insert it again", () => {
    const host = mount(<SheetWorkbook defaultData={createEmptyWorkbook()} />);
    const e = key(grid(host), "z");
    expect(editor(host), "typing should open the cell editor").not.toBeNull();
    expect(editor(host)!.value).toBe("z");
    expect(e.defaultPrevented).toBe(true);
  });

  it("does not start an edit for a modified key (Alt+z is not a typed character)", () => {
    const host = mount(<SheetWorkbook defaultData={createEmptyWorkbook()} />);
    key(grid(host), "z", { altKey: true });
    expect(editor(host)).toBeNull();
  });

  it("does not cancel keys in a read-only workbook", () => {
    const host = mount(<SheetWorkbook defaultData={createEmptyWorkbook()} readOnly />);
    const e = key(grid(host), "z");
    expect(editor(host)).toBeNull();
    expect(e.defaultPrevented).toBe(false);
  });
});
