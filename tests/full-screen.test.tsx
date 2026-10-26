// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, useState, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SheetWorkbook } from "../src/components/SheetWorkbook/SheetWorkbook";
import { Spreadsheet, useSpreadsheet } from "../src/components/Spreadsheet";
import { createEmptyWorkbook } from "../src/types/sheet";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * SheetWorkbook full screen, through react-fancy's `useFullScreen`.
 *
 * Asked for by a consumer (MOIC); the owner's ruling was that Fancy provides
 * the editors, so the editors carry full screen themselves rather than every
 * app wrapping them in its own overlay.
 *
 * The trap these tests exist for is Escape. A spreadsheet already uses it to
 * cancel a cell edit, and the full-screen surface also leaves on Escape. One
 * key, one step back: the first Escape cancels the edit, and only a second one
 * leaves full screen.
 */

let roots: Root[] = [];

function mount(el: ReactElement) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  act(() => root.render(el));
  return { host, root };
}

afterEach(() => {
  for (const r of roots) act(() => r.unmount());
  roots = [];
  document.body.innerHTML = "";
});

const workbook = () => createEmptyWorkbook();

const surface = (host: HTMLElement) => host.querySelector<HTMLElement>("[data-fancy-sheets]")!;
const toggle = (host: HTMLElement) =>
  host.querySelector<HTMLButtonElement>("[data-fancy-sheets-toolbar] [data-react-fancy-fullscreen-toggle]");
const grid = (host: HTMLElement) => host.querySelector<HTMLElement>("[data-fancy-sheets-grid]")!;
const editor = (host: HTMLElement) => host.querySelector<HTMLInputElement>("[data-fancy-sheets-cell-editor]");

function key(target: EventTarget, k: string) {
  const e = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true });
  act(() => {
    target.dispatchEvent(e);
  });
  return e;
}

describe("SheetWorkbook full screen: state", () => {
  it("is off by default and the surface carries the handle", () => {
    const { host } = mount(<SheetWorkbook defaultData={workbook()} />);
    expect(surface(host).getAttribute("data-fullscreen")).toBe("false");
    expect(surface(host).style.position).toBe("");
  });

  it("starts full screen when uncontrolled with defaultFullScreen", () => {
    const { host } = mount(<SheetWorkbook defaultData={workbook()} defaultFullScreen />);
    const root = surface(host);
    expect(root.getAttribute("data-fullscreen")).toBe("true");
    expect(root.getAttribute("data-fullscreen-mode")).toBe("overlay");
    expect(root.style.position).toBe("fixed");
  });

  it("follows the controlled prop and only REQUESTS changes through onFullScreenChange", () => {
    const onChange = vi.fn();
    const { host, root } = mount(
      <SheetWorkbook defaultData={workbook()} fullScreen={false} onFullScreenChange={onChange} />,
    );

    act(() => toggle(host)!.click());
    expect(onChange).toHaveBeenCalledWith(true);
    // Controlled: the parent has not said yes, so it stays put.
    expect(surface(host).getAttribute("data-fullscreen")).toBe("false");

    act(() => root.render(<SheetWorkbook defaultData={workbook()} fullScreen onFullScreenChange={onChange} />));
    expect(surface(host).getAttribute("data-fullscreen")).toBe("true");
  });

  it("passes fullScreenMode through", () => {
    const { host } = mount(<SheetWorkbook defaultData={workbook()} defaultFullScreen fullScreenMode="overlay" />);
    expect(surface(host).getAttribute("data-fullscreen-mode")).toBe("overlay");
  });
});

describe("SheetWorkbook full screen: the toggle", () => {
  it("sits in the workbook's own toolbar, named, and toggles both ways", () => {
    const onChange = vi.fn();
    const { host } = mount(<SheetWorkbook defaultData={workbook()} onFullScreenChange={onChange} />);

    const btn = toggle(host);
    expect(btn).not.toBeNull();
    expect(btn!.getAttribute("aria-label")).toBe("Enter full screen");
    expect(btn!.getAttribute("aria-pressed")).toBe("false");

    act(() => btn!.click());
    expect(surface(host).getAttribute("data-fullscreen")).toBe("true");
    expect(toggle(host)!.getAttribute("aria-label")).toBe("Exit full screen");
    expect(toggle(host)!.getAttribute("aria-pressed")).toBe("true");

    act(() => toggle(host)!.click());
    expect(surface(host).getAttribute("data-fullscreen")).toBe("false");
    expect(onChange.mock.calls).toEqual([[true], [false]]);
  });

  it("is a toolbar button group, so an explicit button list can leave it out", () => {
    const { host } = mount(<SheetWorkbook defaultData={workbook()} toolbarButtons={["undo"]} />);
    expect(toggle(host)).toBeNull();

    const { host: withIt } = mount(<SheetWorkbook defaultData={workbook()} toolbarButtons={["undo", "fullScreen"]} />);
    expect(toggle(withIt)).not.toBeNull();
  });

  it("composes into custom chrome as Spreadsheet.FullScreenToggle", () => {
    const { host } = mount(
      <Spreadsheet defaultData={workbook()}>
        <div data-testid="my-chrome">
          <Spreadsheet.FullScreenToggle />
        </div>
        <Spreadsheet.Grid />
      </Spreadsheet>,
    );
    const btn = host.querySelector<HTMLButtonElement>("[data-testid=my-chrome] [data-react-fancy-fullscreen-toggle]");
    expect(btn).not.toBeNull();
    act(() => btn!.click());
    expect(surface(host).getAttribute("data-fullscreen")).toBe("true");
  });
});

describe("SheetWorkbook full screen: Escape", () => {
  it("leaves full screen on Escape from the grid when nothing is being edited", () => {
    const onChange = vi.fn();
    const { host } = mount(<SheetWorkbook defaultData={workbook()} defaultFullScreen onFullScreenChange={onChange} />);

    key(grid(host), "Escape");
    expect(surface(host).getAttribute("data-fullscreen")).toBe("false");
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("an Escape while editing a cell cancels the edit ONLY; a second one leaves full screen", () => {
    const onChange = vi.fn();
    const { host } = mount(<SheetWorkbook defaultData={workbook()} defaultFullScreen onFullScreenChange={onChange} />);

    // Typing a printable key on the grid starts an edit seeded with it.
    key(grid(host), "x");
    const input = editor(host);
    expect(input).not.toBeNull();
    expect(input!.value).toBe("x");

    const first = key(input!, "Escape");
    expect(first.defaultPrevented).toBe(true);
    expect(editor(host)).toBeNull();
    // The edit was cancelled, not committed.
    expect(host.querySelector<HTMLInputElement>("[data-fancy-sheets-formula-input]")!.value).toBe("");
    expect(surface(host).getAttribute("data-fullscreen")).toBe("true");
    expect(onChange).not.toHaveBeenCalled();

    // The editor unmounted, so focus is on <body>: the real-browser target of
    // the second keystroke. useFullScreen answers a stray Escape there.
    key(document.body, "Escape");
    expect(surface(host).getAttribute("data-fullscreen")).toBe("false");
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("an Escape that cancels a sheet rename does not also leave full screen", () => {
    const { host } = mount(<SheetWorkbook defaultData={workbook()} defaultFullScreen />);

    const tab = host.querySelector<HTMLButtonElement>("[data-fancy-sheet-tab]")!;
    act(() => {
      tab.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    });
    const rename = host.querySelector<HTMLInputElement>("[data-fancy-sheets-tabs] input")!;
    expect(rename).not.toBeNull();

    key(rename, "Escape");
    expect(host.querySelector("[data-fancy-sheets-tabs] input")).toBeNull();
    expect(surface(host).getAttribute("data-fullscreen")).toBe("true");
  });

  it("an Escape outside full screen requests nothing", () => {
    const onChange = vi.fn();
    const { host } = mount(<SheetWorkbook defaultData={workbook()} onFullScreenChange={onChange} />);
    key(grid(host), "Escape");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("SheetWorkbook full screen: layout, host slot, context", () => {
  it("is a flex column while full screen, with the grid taking the remaining height", () => {
    const { host } = mount(<SheetWorkbook defaultData={workbook()} defaultFullScreen />);
    const root = surface(host);
    expect(root.className).toMatch(/\bflex\b/);
    expect(root.className).toMatch(/\bflex-col\b/);
    // Without a background the top-layer box is transparent and the page shows through.
    expect(root.className).toMatch(/bg-white/);
    expect(root.className).toMatch(/dark:bg-zinc-900/);
    const trigger = grid(host).parentElement!;
    expect(trigger.className).toMatch(/\bflex-1\b/);
    expect(trigger.className).toMatch(/\bmin-h-0\b/);
  });

  it("keeps the toolbarExtra host slot inside the full-screen surface", () => {
    const { host } = mount(
      <SheetWorkbook defaultData={workbook()} defaultFullScreen toolbarExtra={<button type="button" data-testid="host-action">Save</button>} />,
    );
    expect(surface(host).getAttribute("data-fullscreen")).toBe("true");
    const action = host.querySelector("[data-testid=host-action]")!;
    expect(action).not.toBeNull();
    expect(surface(host).contains(action)).toBe(true);
    expect(action.closest("[data-fancy-sheets-toolbar]")).not.toBeNull();
  });

  it("exposes fullScreen / setFullScreen through useSpreadsheet", () => {
    const seen: boolean[] = [];
    function Probe() {
      const { fullScreen, setFullScreen } = useSpreadsheet();
      seen.push(fullScreen);
      return (
        <button type="button" data-testid="probe" onClick={() => setFullScreen(!fullScreen)}>
          probe
        </button>
      );
    }
    const { host } = mount(<SheetWorkbook defaultData={workbook()} toolbarExtra={<Probe />} />);

    expect(seen[seen.length - 1]).toBe(false);
    act(() => host.querySelector<HTMLButtonElement>("[data-testid=probe]")!.click());
    expect(surface(host).getAttribute("data-fullscreen")).toBe("true");
    expect(seen[seen.length - 1]).toBe(true);
    act(() => host.querySelector<HTMLButtonElement>("[data-testid=probe]")!.click());
    expect(surface(host).getAttribute("data-fullscreen")).toBe("false");
  });

  it("drives a controlled workbook from a parent", () => {
    function Host() {
      const [fs, setFs] = useState(false);
      return (
        <>
          <button type="button" data-testid="outside" onClick={() => setFs(true)}>open</button>
          <SheetWorkbook defaultData={workbook()} fullScreen={fs} onFullScreenChange={setFs} />
        </>
      );
    }
    const { host } = mount(<Host />);
    act(() => host.querySelector<HTMLButtonElement>("[data-testid=outside]")!.click());
    expect(surface(host).getAttribute("data-fullscreen")).toBe("true");
    key(grid(host), "Escape");
    expect(surface(host).getAttribute("data-fullscreen")).toBe("false");
  });
});
