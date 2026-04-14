# @particle-academy/fancy-sheets

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
- **Features** — editing, navigation, selection (single, range, multi-range), formatting (bold/italic/align), clipboard (copy/cut/paste with TSV), column resize, freeze rows/cols, undo/redo (50 steps), drag-to-select
- **Zero third-party dependencies** — custom lexer, parser, evaluator, and dependency graph

## License

MIT
