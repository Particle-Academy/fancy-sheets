# Recipe: custom formula functions

Register your own functions with `registerFunction`. They're available in every
workbook (the registry is module-global) and callable from any cell formula.

```ts
import { registerFunction } from "@particle-academy/fancy-sheets";
import type { FormulaRangeFunction } from "@particle-academy/fancy-sheets";
```

## The signature

```ts
type FormulaRangeFunction = (args: CellValue[][]) => CellValue;
```

Each argument arrives as an **array of cell values** — because any argument can be
a range. A scalar argument is a one-element array; a range like `A1:A10` is the
full list of values. Return any `CellValue` (`number | string | boolean | null`).
Throwing is allowed — the cell shows `#ERROR!`.

## Scalar example

```ts
registerFunction("GREET", (args) => {
  const name = args[0]?.[0] ?? "world";
  return `Hello, ${name}`;
});
// =GREET("Ada")  →  "Hello, Ada"
```

## Range example — `=NPV(rate, cashflows…)`

```ts
registerFunction("NPV", (args) => {
  const rate = Number(args[0]?.[0] ?? 0);
  const flows = args.slice(1).flat().map(Number);   // flatten all range args
  return flows.reduce((acc, cf, i) => acc + cf / (1 + rate) ** (i + 1), 0);
});
// =NPV(0.1, B2:B6)
```

## Register early

Call `registerFunction` once at module load, before the grid renders (or before
`recalculateWorkbook` runs headlessly), so the evaluator can find it:

```ts
// formulas.ts — imported once from your app entry
registerFunction("TAXED", (args) => Number(args[0]?.[0] ?? 0) * 1.2);
```

> Names are case-insensitive and upper-cased internally; `=taxed(A1)` and
> `=TAXED(A1)` resolve to the same function. Re-registering a name overrides it.

See [docs/formulas.md](../formulas.md) for the 80+ built-ins.
