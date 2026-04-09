# @particle-academy/fancy-sheets

Spreadsheet editor with formula engine, multi-sheet tabs, and full cell editing. Part of the `@particle-academy` component ecosystem.

## Installation

```bash
# npm
npm install @particle-academy/fancy-sheets

# pnpm
pnpm add @particle-academy/fancy-sheets

# yarn
yarn add @particle-academy/fancy-sheets
```

**Peer dependencies:** `react >= 18`, `react-dom >= 18`, `@particle-academy/react-fancy >= 1.5`

## Usage

```css
@import "tailwindcss";
@import "@particle-academy/fancy-sheets/styles.css";
@source "../node_modules/@particle-academy/fancy-sheets/dist/**/*.js";
```

```tsx
import { Spreadsheet, createEmptyWorkbook } from "@particle-academy/fancy-sheets";
import "@particle-academy/fancy-sheets/styles.css";

function App() {
  const [data, setData] = useState(createEmptyWorkbook());

  return (
    <div style={{ height: 500 }}>
      <Spreadsheet data={data} onChange={setData}>
        <Spreadsheet.Toolbar />
        <Spreadsheet.Grid />
        <Spreadsheet.SheetTabs />
      </Spreadsheet>
    </div>
  );
}
```

The spreadsheet fills its container — set a fixed height on the parent element.

## Commands

```bash
pnpm --filter @particle-academy/fancy-sheets build    # Build with tsup (ESM + CJS + DTS)
pnpm --filter @particle-academy/fancy-sheets dev      # Watch mode
pnpm --filter @particle-academy/fancy-sheets lint     # Type-check (tsc --noEmit)
pnpm --filter @particle-academy/fancy-sheets clean    # Remove dist/
```

## Component API

### Compound Components

| Component | Description |
|-----------|-------------|
| `Spreadsheet` | Root wrapper — state management, context provider |
| `Spreadsheet.Toolbar` | Undo/redo, bold/italic/align buttons, formula bar |
| `Spreadsheet.Grid` | Editable cell grid with headers, selection, editing |
| `Spreadsheet.SheetTabs` | Multi-sheet tab bar with add/rename/delete |

### Spreadsheet Props

```ts
interface SpreadsheetProps {
  children: ReactNode;
  className?: string;
  data?: WorkbookData;             // Controlled workbook data
  defaultData?: WorkbookData;      // Uncontrolled initial data
  onChange?: (data: WorkbookData) => void;
  columnCount?: number;            // Default: 26 (A-Z)
  rowCount?: number;               // Default: 100
  defaultColumnWidth?: number;     // Default: 100px
  rowHeight?: number;              // Default: 28px
  readOnly?: boolean;              // Default: false
}
```

### useSpreadsheet Hook

Access the spreadsheet context from custom components:

```tsx
import { useSpreadsheet } from "@particle-academy/fancy-sheets";

function CustomToolbar() {
  const { selection, setCellValue, setCellFormat, undo, redo } = useSpreadsheet();
  // Build custom toolbar buttons
}
```

**Context value:**

| Property / Method | Description |
|-------------------|-------------|
| `workbook` | Current WorkbookData |
| `activeSheet` | The currently active SheetData |
| `selection` | Current SelectionState (activeCell, ranges) |
| `editingCell` | Address of cell being edited (null if not editing) |
| `editValue` | Current value in the cell editor |
| `setCellValue(addr, value)` | Set a cell's value (triggers formula recalc) |
| `setCellFormat(addrs, format)` | Apply formatting to cells |
| `setSelection(cell)` | Select a single cell |
| `extendSelection(cell)` | Extend selection range (shift+click) |
| `addSelection(cell)` | Add to selection (ctrl+click) |
| `navigate(direction, extend?)` | Move active cell (arrow keys) |
| `startEdit(value?)` | Enter edit mode |
| `confirmEdit()` | Confirm edit and move down |
| `cancelEdit()` | Cancel edit (Escape) |
| `resizeColumn(col, width)` | Set column width |
| `addSheet()` | Add a new sheet |
| `renameSheet(id, name)` | Rename a sheet |
| `deleteSheet(id)` | Delete a sheet |
| `setActiveSheet(id)` | Switch active sheet |
| `undo()` / `redo()` | Undo/redo (50-step history) |
| `canUndo` / `canRedo` | Whether undo/redo is available |
| `getColumnWidth(col)` | Get column width in px |
| `isCellSelected(addr)` | Check if cell is in selection |
| `isCellActive(addr)` | Check if cell is the active cell |

## Data Model

### WorkbookData

```ts
interface WorkbookData {
  sheets: SheetData[];
  activeSheetId: string;
}
```

### SheetData

```ts
interface SheetData {
  id: string;
  name: string;
  cells: CellMap;                              // Record<CellAddress, CellData>
  columnWidths: Record<number, number>;        // Column width overrides
  mergedRegions: MergedRegion[];
  columnFilters: Record<number, string>;
  sortColumn?: number;
  sortDirection?: "asc" | "desc";
  frozenRows: number;
  frozenCols: number;
}
```

### CellData

```ts
interface CellData {
  value: CellValue;             // string | number | boolean | null
  formula?: string;             // Without leading "=", e.g. "SUM(A1:A5)"
  computedValue?: CellValue;    // Result of formula evaluation
  format?: CellFormat;          // { bold?, italic?, textAlign? }
}
```

### Helpers

```tsx
import { createEmptyWorkbook, createEmptySheet } from "@particle-academy/fancy-sheets";

const workbook = createEmptyWorkbook();              // One empty sheet
const sheet = createEmptySheet("my-id", "My Sheet"); // Custom sheet
```

## Formula Engine

Type `=` in any cell to enter a formula. The engine supports cell references, ranges, operators, and functions.

### Cell References

| Syntax | Example | Description |
|--------|---------|-------------|
| Cell ref | `=A1` | Single cell reference |
| Range | `=A1:B5` | Rectangular range |
| Arithmetic | `=A1+B1*2` | Operators: `+`, `-`, `*`, `/`, `^` |
| Comparison | `=A1>10` | Operators: `=`, `<>`, `<`, `>`, `<=`, `>=` |
| Concatenation | `=A1&" "&B1` | String join with `&` |

### Built-in Functions

**Math:**

| Function | Example | Description |
|----------|---------|-------------|
| `SUM` | `=SUM(A1:A10)` | Sum of values |
| `AVERAGE` | `=AVERAGE(B1:B5)` | Mean of values |
| `MIN` | `=MIN(C1:C10)` | Minimum value |
| `MAX` | `=MAX(C1:C10)` | Maximum value |
| `COUNT` | `=COUNT(A1:A20)` | Count of numeric values |
| `ROUND` | `=ROUND(A1, 2)` | Round to N decimals |
| `ABS` | `=ABS(A1)` | Absolute value |

**Text:**

| Function | Example | Description |
|----------|---------|-------------|
| `UPPER` | `=UPPER(A1)` | Convert to uppercase |
| `LOWER` | `=LOWER(A1)` | Convert to lowercase |
| `LEN` | `=LEN(A1)` | String length |
| `TRIM` | `=TRIM(A1)` | Remove leading/trailing whitespace |
| `CONCAT` | `=CONCAT(A1,B1,C1)` | Join values |

**Logic:**

| Function | Example | Description |
|----------|---------|-------------|
| `IF` | `=IF(A1>10,"High","Low")` | Conditional value |
| `AND` | `=AND(A1>0,B1>0)` | All conditions true |
| `OR` | `=OR(A1>0,B1>0)` | Any condition true |
| `NOT` | `=NOT(A1)` | Negate boolean |

### Custom Functions

Register custom formula functions:

```tsx
import { registerFunction } from "@particle-academy/fancy-sheets";

registerFunction("DOUBLE", (args) => {
  const val = args.flat()[0];
  return typeof val === "number" ? val * 2 : "#VALUE!";
});
// Now use =DOUBLE(A1) in any cell
```

### Error Values

| Error | Cause |
|-------|-------|
| `#ERROR!` | Invalid formula syntax |
| `#VALUE!` | Wrong value type for operation |
| `#DIV/0!` | Division by zero |
| `#NAME?` | Unknown function name |
| `#CIRC!` | Circular reference detected |

### Dependency Tracking

The formula engine builds a dependency graph and recalculates in topological order. When cell A1 changes, all cells that reference A1 (directly or transitively) are automatically recalculated. Circular references are detected and marked with `#CIRC!`.

## Features

### Editing
- Click to select, double-click or type to start editing
- Enter confirms and moves down, Tab moves right
- Escape cancels edit
- Delete/Backspace clears cell
- Formula bar shows formula for selected cell

### Navigation
- Arrow keys move between cells
- Shift+Arrow extends selection range
- Tab/Shift+Tab moves right/left
- Ctrl+Z undo, Ctrl+Y redo

### Selection
- Click to select single cell
- Shift+Click to select range
- Ctrl+Click for multi-select
- Visual blue overlay on selected ranges

### Formatting
- Bold (B), Italic (I) toggle buttons
- Text align: left, center, right
- Applied via toolbar or programmatically

### Clipboard
- Ctrl+C copies selected range as TSV
- Ctrl+V pastes TSV data starting at active cell
- Works with external data from Excel/Google Sheets

### CSV Support

```tsx
import { parseCSV, csvToWorkbook, workbookToCSV } from "@particle-academy/fancy-sheets";

// Import
const workbook = csvToWorkbook(csvString, "Imported Data");

// Export
const csv = workbookToCSV(workbook);
```

### Multi-Sheet
- Tab bar at bottom shows all sheets
- Click to switch, double-click to rename
- "+" button adds new sheet
- Delete button removes active sheet (minimum 1)

### Column Resize
- Drag column header borders to resize
- Minimum width: 30px

### Undo/Redo
- 50-step history
- Every cell edit, format change pushes to undo stack
- Ctrl+Z / Ctrl+Y keyboard shortcuts

## Customization

All components render `data-fancy-sheets-*` attributes:

| Attribute | Element |
|-----------|---------|
| `data-fancy-sheets` | Root container |
| `data-fancy-sheets-toolbar` | Toolbar area |
| `data-fancy-sheets-formula-bar` | Formula bar |
| `data-fancy-sheets-grid` | Grid container |
| `data-fancy-sheets-column-headers` | Column header row |
| `data-fancy-sheets-row-header` | Row number cell |
| `data-fancy-sheets-cell` | Individual cell |
| `data-fancy-sheets-cell-editor` | Inline edit input |
| `data-fancy-sheets-selection` | Selection overlay |
| `data-fancy-sheets-resize-handle` | Column resize handle |
| `data-fancy-sheets-tabs` | Sheet tab bar |

## Architecture

```
src/
├── types/
│   ├── cell.ts                  # CellValue, CellData, CellFormat
│   ├── sheet.ts                 # SheetData, WorkbookData, helpers
│   ├── selection.ts             # CellRange, SelectionState
│   └── formula.ts               # FormulaToken, FormulaASTNode
├── engine/
│   ├── cell-utils.ts            # Address parsing (A1 <-> row/col)
│   ├── clipboard.ts             # TSV serialize/parse
│   ├── csv.ts                   # CSV import/export
│   ├── sorting.ts               # Column sort
│   ├── history.ts               # Undo/redo stack
│   └── formula/
│       ├── lexer.ts             # Tokenize formula strings
│       ├── parser.ts            # Recursive descent -> AST
│       ├── evaluator.ts         # Evaluate AST with cell lookups
│       ├── references.ts        # Extract cell refs from AST
│       ├── dependency-graph.ts  # Dep tracking, circular detection
│       └── functions/
│           ├── registry.ts      # Function registry
│           ├── math.ts          # SUM, AVERAGE, MIN, MAX, etc.
│           ├── text.ts          # UPPER, LOWER, LEN, TRIM, CONCAT
│           └── logic.ts         # IF, AND, OR, NOT
├── hooks/
│   └── use-spreadsheet-store.ts # Central reducer + actions
├── components/
│   ├── Spreadsheet/             # Root compound component
│   ├── Toolbar/                 # Format buttons + formula bar
│   ├── Grid/                    # Cell grid, editor, selection, resize
│   └── SheetTabs/               # Multi-sheet tab bar
├── index.ts                     # Public API
└── styles.css                   # Base styles
```

## Demo

Demo page at `/react-demos/spreadsheet` in the monorepo with pre-populated product catalog data and formulas.

---

## Agent Guidelines

### Component Pattern
- Same compound component pattern as react-fancy: `Object.assign(Root, { Toolbar, Grid, SheetTabs })`
- Context via `SpreadsheetContext` + `useSpreadsheet()` hook
- State managed by `useReducer` with action-based mutations

### Formula Engine
- Pure functions in `engine/formula/` — no React imports
- Lexer → Parser → Evaluator pipeline
- Dependency graph rebuilt on cell changes, topological sort for recalc order
- Functions registered via side-effect imports (listed in `sideEffects` in package.json)

### Data Model
- Sparse cell map (`Record<CellAddress, CellData>`) — only stores non-empty cells
- Formulas stored as strings, computed values cached in `computedValue`
- Undo/redo via workbook snapshot stack (max 50)

### Build
- tsup: ESM, CJS, DTS
- External: react, react-dom, @particle-academy/react-fancy
- Zero other dependencies
- Verify with `npm run build` from monorepo root
