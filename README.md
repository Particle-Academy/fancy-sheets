# @particle-academy/fancy-sheets

[![Fancified](art/fancified.svg)](https://particle.academy)

A full-featured spreadsheet component with formulas, formatting, selection, multi-sheet workbooks, clipboard, CSV import/export, and undo/redo. Custom engine — no third-party dependency.

## Installation

```bash
npm install @particle-academy/fancy-sheets
# or: pnpm add @particle-academy/fancy-sheets
# or: yarn add @particle-academy/fancy-sheets
```

**Peer dependencies:** `react >= 18`, `react-dom >= 18`, `@particle-academy/react-fancy >= 1.5`

## Setup

```css
@import "tailwindcss";
@import "@particle-academy/fancy-sheets/styles.css";
@source "../node_modules/@particle-academy/fancy-sheets/dist/**/*.js";
```

## Quick Start

```tsx
import { Spreadsheet } from "@particle-academy/fancy-sheets";

function App() {
  return (
    <div style={{ height: 600 }}>
      <Spreadsheet>
        <Spreadsheet.Toolbar />
        <Spreadsheet.Grid />
        <Spreadsheet.SheetTabs />
      </Spreadsheet>
    </div>
  );
}
```

The component fills its container — wrap it in a sized element (height is required).

## Documentation

| Topic | Doc |
|-------|-----|
| Full component API (props, sub-components, `useSpreadsheet` hook, data model, keyboard shortcuts) | [docs/Spreadsheet.md](./docs/Spreadsheet.md) |
| 80+ built-in formula functions + custom function registration | [docs/formulas.md](./docs/formulas.md) |
| CSV import / export utilities | [docs/csv.md](./docs/csv.md) |
| **Headless recalculation** (Node / SSR / exports / tests) | [docs/recipes/headless-recalc.md](./docs/recipes/headless-recalc.md) |
| **External state sync + autosave** (controlled `data`, agent bridge, undo/redo) | [docs/recipes/external-state-sync.md](./docs/recipes/external-state-sync.md) |
| **Custom formula functions** (`registerFunction` walkthrough) | [docs/recipes/custom-functions.md](./docs/recipes/custom-functions.md) |
| **CSV round-trip** | [docs/recipes/csv-roundtrip.md](./docs/recipes/csv-roundtrip.md) |

### Headless formula engine (0.8+)

The engine is pure functions — no React, no DOM — so backends, schedulers,
exporters, and test rigs can use it directly:

```ts
import {
  recalculateWorkbook, recalculateSheet,   // recompute computedValues
  lexFormula, parseFormula, evaluateAST,    // low-level lex → parse → eval
} from "@particle-academy/fancy-sheets";

const computed = recalculateWorkbook(workbook); // new workbook, formulas evaluated
```

See [docs/recipes/headless-recalc.md](./docs/recipes/headless-recalc.md).

## Commands

```bash
pnpm --filter @particle-academy/fancy-sheets build    # Build with tsup (ESM + CJS + DTS)
pnpm --filter @particle-academy/fancy-sheets dev      # Watch mode
pnpm --filter @particle-academy/fancy-sheets lint     # Type-check (tsc --noEmit)
pnpm --filter @particle-academy/fancy-sheets clean    # Remove dist/
```

## At a Glance

- **Compound component API** — `Spreadsheet` + `Toolbar` / `Grid` / `SheetTabs`
- **`useSpreadsheet` hook** — full workbook state and actions accessible from any child
- **80+ built-in formulas** — Math, Text, Logic, Conditional aggregates, Lookup, Date/Time, Info
- **Multi-sheet workbooks** — cross-sheet references via `Sheet2!A1` syntax
- **Headless engine (0.8+)** — `recalculateWorkbook` / `lexFormula` / `parseFormula` / `evaluateAST` exported as pure, React-free functions for SSR, exports, and Node tests
- **Features** — editing, navigation, selection (single, range, multi-range), formatting (bold/italic/align), clipboard (copy/cut/paste with TSV), column resize, freeze rows/cols, undo/redo (50 steps), drag-to-select
- **Zero third-party dependencies** — custom lexer, parser, evaluator, and dependency graph

## Inertia.js integration

Spreadsheet uses canvas grid measurement and is **not SSR-safe**. In an Inertia app, wrap with [`<FancyClientOnly>`](https://github.com/Particle-Academy/fancy-inertia/blob/main/docs/USAGE.md#fancyclientonly) from `@particle-academy/fancy-inertia`:

```tsx
import { FancyClientOnly } from "@particle-academy/fancy-inertia";
import { Spreadsheet } from "@particle-academy/fancy-sheets";

<FancyClientOnly fallback={<div className="h-96 animate-pulse rounded bg-zinc-100" />}>
  <Spreadsheet rows={100} cols={26} />
</FancyClientOnly>
```

## License

MIT
