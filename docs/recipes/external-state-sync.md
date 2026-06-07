# Recipe: external state sync + autosave

Drive `<SheetWorkbook>` from a controlled `data` prop that changes from *outside*
the component — a server round-trip, an agent bridge, undo/redo, a websocket. As
of **0.7.6** an externally-replaced `data` prop recalculates correctly (formulas
re-evaluate against the new cells), so this pattern is solid.

## Controlled component

`data` + `onChange` make `<SheetWorkbook>` fully controlled. Hold the workbook in
your own state and feed it back:

```tsx
import { SheetWorkbook } from "@particle-academy/fancy-sheets";
import type { WorkbookData } from "@particle-academy/fancy-sheets";
import { useState } from "react";

function Editor({ initial }: { initial: WorkbookData }) {
  const [wb, setWb] = useState(initial);
  return <SheetWorkbook data={wb} onChange={setWb} />;
}
```

Because it's controlled, *anything* can set `wb` — the grid reflects it on the
next render and re-runs formulas.

## Autosave (debounced)

`onChange` fires on every mutation. Debounce it to persist:

```tsx
function AutosaveEditor({ initial, save }: { initial: WorkbookData; save: (w: WorkbookData) => Promise<void> }) {
  const [wb, setWb] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const onChange = (next: WorkbookData) => {
    setWb(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(next), 600);
  };

  return <SheetWorkbook data={wb} onChange={onChange} />;
}
```

## Agent bridge / collaborative edits

Apply remote patches by replacing `data`. Run `recalculateWorkbook` first if the
patch source didn't compute values (e.g. a raw agent edit):

```tsx
import { recalculateWorkbook } from "@particle-academy/fancy-sheets";

socket.on("workbook:patch", (incoming: WorkbookData) => {
  setWb(recalculateWorkbook(incoming)); // ensure computedValues before paint
});
```

## Undo/redo from outside

The component has its own internal undo stack, but if you manage history yourself
(to coordinate with non-grid state), just push/pop full `WorkbookData` snapshots
and set them as `data`:

```tsx
const undo = () => { const prev = history.pop(); if (prev) setWb(prev); };
```

> Tip: keep one source of truth. Either let the component own state (`defaultData`,
> read via `onChange`) **or** control it (`data` + `onChange`) — don't mix
> `defaultData` and `data` on the same instance.
