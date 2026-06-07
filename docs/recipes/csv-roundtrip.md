# Recipe: CSV round-trip

The CSV utilities are a complete, dependency-free library — usable headless (Node
import pipelines, exports) or in the browser.

```ts
import {
  csvToWorkbook,
  workbookToCSV,
  parseCSV,
  stringifyCSV,
} from "@particle-academy/fancy-sheets";
```

## Workbook ⇄ CSV

```ts
// CSV string → WorkbookData (one sheet)
const wb = csvToWorkbook("Name,Score\nAda,90\nGrace,95", "Results");

// WorkbookData → CSV string. Omitting sheetId uses the active sheet.
const csv = workbookToCSV(wb);
const csv2 = workbookToCSV(wb, "sheet-id-2"); // a specific sheet
```

`workbookToCSV` emits **computed** values for formula cells — run
`recalculateWorkbook(wb)` first if the workbook was assembled by hand so the
export carries final numbers, not blanks:

```ts
import { recalculateWorkbook } from "@particle-academy/fancy-sheets";
const csv = workbookToCSV(recalculateWorkbook(wb));
```

## Raw grid ⇄ CSV

When you just want the 2-D array (no workbook wrapper):

```ts
const rows = parseCSV("a,b\n1,2");   // [["a","b"], ["1","2"]]
const text = stringifyCSV(rows);     // 'a,b\n1,2'
```

## Gotchas

- **Quoting & escaping** are handled — fields containing commas, quotes, or
  newlines are round-tripped via standard `"…"` quoting with `""` escaping.
- **Everything is a string on import.** `csvToWorkbook` does not infer numeric
  types; cells hold the raw text. Coerce in your own adapter if you need numbers
  (or let formulas referencing them do the coercion).
- **One sheet per CSV.** CSV has no notion of multiple sheets — `csvToWorkbook`
  produces a single-sheet workbook, and `workbookToCSV` serializes one sheet at a
  time. Loop over `wb.sheets` and concatenate if you need a multi-tab export.
