# Recipe: headless recalculation (Node, SSR, exports, tests)

The formula engine is pure — no React, no DOM. You can compute formula
`computedValue`s on a server, in a worker, or in a test, without booting a
component.

```ts
import { recalculateWorkbook, createEmptyWorkbook } from "@particle-academy/fancy-sheets";
import type { WorkbookData } from "@particle-academy/fancy-sheets";

const wb = createEmptyWorkbook();
wb.sheets[0].cells = {
  A1: { value: 10 },
  A2: { value: 20 },
  A3: { value: null, formula: "SUM(A1:A2)" },   // note: no leading "="
  B1: { value: null, formula: "A3*2" },
};

const computed = recalculateWorkbook(wb);
computed.sheets[0].cells.A3.computedValue; // 30
computed.sheets[0].cells.B1.computedValue; // 60
```

`recalculateWorkbook` returns a **new** workbook (inputs are not mutated), runs a
two-pass sweep so cross-sheet references resolve in any order, topologically
orders dependent cells, and marks circular references `#CIRC!` / runtime failures
`#ERROR!`.

## Single sheet

```ts
import { recalculateSheet } from "@particle-academy/fancy-sheets";

const sheet = recalculateSheet(mySheet);              // intra-sheet only
const sheet2 = recalculateSheet(mySheet, allSheets);  // pass siblings for cross-sheet refs
```

## Server-rendered preview (no recalc flash)

Compute on the server so the initial HTML already carries final values:

```ts
// Laravel/Inertia controller, Next.js loader, etc.
const props = { workbook: recalculateWorkbook(snapshot) };
// → <SheetWorkbook data={props.workbook} /> renders final values on first paint
```

## Low-level lex / parse / evaluate

For custom pipelines (linting, transforms, your own grid), the three stages are
exported too. The formula string is the body **without** the leading `=`:

```ts
import { lexFormula, parseFormula, evaluateAST } from "@particle-academy/fancy-sheets";

const ast = parseFormula(lexFormula("2 + 3 * 4"));
const value = evaluateAST(
  ast,
  (address) => cellValues[address] ?? null,           // getCellValue
  (start, end) => rangeValues(start, end),            // getRangeValues
  /* ctx */ { getSheetCellValue, getSheetRangeValues } // optional, for Sheet!A1 refs
);
// value === 14
```

`evaluateAST` is provider-agnostic: you supply the cell/range getters, so it can
read from any backing store (a plain object, a DB row, an agent's snapshot).
