# Spreadsheet

A full-featured spreadsheet component with formulas, formatting, selection, multi-sheet workbooks, clipboard, CSV import/export, comments, and undo/redo. Compound API.

## Import

```tsx
import { Spreadsheet, Sheet, SheetWorkbook, useSpreadsheet } from "@particle-academy/fancy-sheets";
import "@particle-academy/fancy-sheets/styles.css";
```

## Components

### Compound API (full control)

```tsx
<Spreadsheet data={workbook} onChange={setWorkbook}>
  <Spreadsheet.Toolbar />
  <Spreadsheet.Grid />
  <Spreadsheet.SheetTabs />
</Spreadsheet>
```

All sub-components are optional — omit `Toolbar` or `SheetTabs` to hide them.

### SheetWorkbook (batteries-included)

Convenience wrapper with props to toggle chrome:

```tsx
<SheetWorkbook
  data={workbook}
  onChange={setWorkbook}
  hideToolbar={false}
  hideTabs={false}
  toolbarExtra={<button>Custom</button>}
  contextMenuItems={[{ label: "Highlight", onClick: (addr) => ... }]}
/>
```

### Sheet (lean single-sheet)

Takes `SheetData` directly — no workbook wrapper, no tabs, no toolbar:

```tsx
<Sheet data={sheetData} onChange={setSheetData} columnCount={6} rowCount={10} />
```

## Props

### Spreadsheet (root)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| data | `WorkbookData` | - | Controlled workbook |
| defaultData | `WorkbookData` | empty workbook | Initial workbook (uncontrolled) |
| onChange | `(data: WorkbookData) => void` | - | Called on any data change |
| columnCount | `number` | `26` | Number of columns |
| rowCount | `number` | `100` | Number of rows |
| defaultColumnWidth | `number` | `100` | Default column width in px |
| rowHeight | `number` | `28` | Row height in px |
| readOnly | `boolean` | `false` | Disable editing |
| contextMenuItems | `ContextMenuItem[] \| (addr) => ContextMenuItem[]` | - | Custom right-click items |
| className | `string` | - | Additional CSS classes |

### Spreadsheet.Toolbar

| Prop | Type | Description |
|------|------|-------------|
| children | `ReactNode` | Replace default toolbar entirely |
| extra | `ReactNode` | Append content after default buttons (before formula bar) |
| buttons | `ToolbarButton[]` | Which built-in groups to show (default: all). Pass `[]` for only custom `extra`. |
| className | `string` | Additional CSS classes |

### SheetWorkbook

All `Spreadsheet` props plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| hideToolbar | `boolean` | `false` | Hide the toolbar |
| hideTabs | `boolean` | `false` | Hide the sheet tabs |
| toolbarExtra | `ReactNode` | - | Extra toolbar content |
| toolbarButtons | `ToolbarButton[]` | all | Which built-in toolbar groups to show |

### Sheet

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| data | `SheetData` | - | Single sheet data (controlled) |
| onChange | `(data: SheetData) => void` | - | Called on data change |
| contextMenuItems | see Spreadsheet | - | Custom right-click items |
| _(plus columnCount, rowCount, etc.)_ | | | |

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
  cells: Record<CellAddress, CellData>;
  columnWidths: Record<number, number>;
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
  value: CellValue;
  formula?: string;
  computedValue?: CellValue;
  format?: CellFormat;
  comment?: CellComment;
}
```

### CellFormat

```ts
interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  textAlign?: "left" | "center" | "right";
  displayFormat?: "auto" | "text" | "number" | "date" | "datetime" | "percentage" | "currency";
  decimals?: number;
  backgroundColor?: string;   // CSS color
  color?: string;              // font color
  fontSize?: number;           // px
  borderTop?: string;          // CSS color (renders 1px solid)
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
}
```

When `backgroundColor` is set without `color`, text auto-defaults to dark gray (`#1f2937`) so content stays readable in both light and dark modes.

### CellComment

```ts
interface CellComment {
  text: string;
  author?: string;
  color?: string;   // default: "#f59e0b" (amber)
}
```

Comments render as:
- A small colored triangle in the cell's top-right corner
- A 1px border around the cell in the comment color
- A hover tooltip showing author + text

### SpreadsheetContextMenuItem

```ts
interface SpreadsheetContextMenuItem {
  label: string;
  onClick?: (address: string) => void;
  disabled?: boolean | ((address: string) => boolean);
  danger?: boolean;
  items?: SpreadsheetContextMenuItem[];  // nested submenu
}
```

---

## Custom Toolbar Buttons

Use the `extra` prop on `Spreadsheet.Toolbar` (or `toolbarExtra` on `SheetWorkbook`) to inject your own buttons alongside the built-in ones. They appear after a divider at the end of the button bar.

```tsx
<Spreadsheet data={data} onChange={setData}>
  <Spreadsheet.Toolbar
    extra={
      <>
        <button
          className="rounded bg-green-600 px-2 py-0.5 text-xs text-white"
          onClick={() => addRow("income")}
        >
          + Income
        </button>
        <button
          className="rounded bg-red-500 px-2 py-0.5 text-xs text-white ml-1"
          onClick={() => addRow("expense")}
        >
          + Expense
        </button>
      </>
    }
  />
  <Spreadsheet.Grid />
</Spreadsheet>
```

Or via `SheetWorkbook`:

```tsx
<SheetWorkbook
  data={data}
  onChange={setData}
  toolbarExtra={<button onClick={exportCSV}>Export</button>}
/>
```

## Controlling the Toolbar

The `buttons` prop on `Spreadsheet.Toolbar` (or `toolbarButtons` on `SheetWorkbook`) controls which built-in button groups are visible.

```ts
type ToolbarButton = "undo" | "bold" | "align" | "freeze" | "format" | "decimals" | "formulaBar";
```

### Show all (default)

```tsx
<Spreadsheet.Toolbar />
```

### Show specific groups only

```tsx
<Spreadsheet.Toolbar buttons={["undo", "bold", "formulaBar"]} />
```

### Show only custom buttons (hide all built-in)

```tsx
<Spreadsheet.Toolbar buttons={[]} extra={<MyCustomToolbar />} />
```

### Via SheetWorkbook

```tsx
<SheetWorkbook
  toolbarButtons={["undo", "bold", "format", "formulaBar"]}
  toolbarExtra={<button>Custom</button>}
/>
```

### Replace the toolbar entirely

Pass `children` to `Spreadsheet.Toolbar` to replace the default UI completely. Use `useSpreadsheet()` inside your custom toolbar to access state and actions.

```tsx
function MyToolbar() {
  const { undo, redo, canUndo, canRedo, selection } = useSpreadsheet();
  return (
    <div className="flex gap-2 p-2 border-b">
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
      <span>Cell: {selection.activeCell}</span>
    </div>
  );
}

<Spreadsheet data={data} onChange={setData}>
  <Spreadsheet.Toolbar>
    <MyToolbar />
  </Spreadsheet.Toolbar>
  <Spreadsheet.Grid />
</Spreadsheet>
```

## Custom Context Menus

The `contextMenuItems` prop adds items to the right-click menu after the built-in items (Copy, Paste, Clear, Freeze), separated by a divider.

### Static items

```tsx
<Spreadsheet
  data={data}
  onChange={setData}
  contextMenuItems={[
    { label: "Highlight yellow", onClick: (addr) => highlight(addr, "#fef08a") },
    { label: "Clear formatting", onClick: (addr) => clearFormat(addr) },
  ]}
>
```

### Dynamic items (context-aware)

Pass a callback to return different items based on the active cell:

```tsx
<Spreadsheet
  data={data}
  onChange={setData}
  contextMenuItems={(addr) => {
    const cell = activeSheet.cells[addr];
    const row = parseInt(addr.replace(/[A-Z]+/, ""), 10);

    const items: SpreadsheetContextMenuItem[] = [];

    // Comment actions depend on whether cell has a comment
    if (cell?.comment) {
      items.push({ label: "Edit Comment", onClick: (a) => openEditor(a) });
      items.push({ label: "Delete Comment", danger: true, onClick: (a) => deleteComment(a) });
    } else {
      items.push({ label: "Add Comment", onClick: (a) => openEditor(a) });
    }

    // Row actions only for data rows
    if (row >= 2) {
      items.push({ label: "Delete Row", danger: true, onClick: (a) => deleteRow(a) });
    }

    return items;
  }}
>
```

### Nested submenus

Add an `items` array to group actions into submenus:

```tsx
contextMenuItems={(addr) => [
  {
    label: "Comments",
    items: [
      { label: "Add Comment", onClick: (a) => openEditor(a) },
    ],
  },
  {
    label: "Row Actions",
    items: [
      { label: "Mark as Paid", onClick: (a) => markPaid(a) },
      { label: "Duplicate Row", onClick: (a) => duplicateRow(a) },
      { label: "Delete Row", danger: true, onClick: (a) => deleteRow(a) },
    ],
  },
]}
```

Submenus nest arbitrarily deep — each item with `items` renders as a hover-to-open submenu with a chevron indicator.

## Custom Formulas

Register custom functions that users can call in cell formulas with `=FUNCTION_NAME(...)`.

```tsx
import { registerFunction } from "@particle-academy/fancy-sheets";
import type { FormulaRangeFunction } from "@particle-academy/fancy-sheets";
```

### Basic function

```tsx
registerFunction("PRIORITY", (args) => {
  const value = Number(args[0]?.[0] ?? 0);
  return value > 100 ? "High" : "Low";
});

// In a cell: =PRIORITY(A1)
```

### Function with multiple arguments

`args` is a 2D array — each argument may be a single value or a range of values:

```tsx
registerFunction("BUDGET_STATUS", (args) => {
  const spent = Number(args[0]?.[0] ?? 0);    // first arg: single cell
  const budget = Number(args[1]?.[0] ?? 0);   // second arg: single cell
  if (!budget) return "N/A";
  const ratio = spent / budget;
  if (ratio > 1) return "Over Budget";
  if (ratio > 0.9) return "Near Limit";
  return "On Track";
});

// In a cell: =BUDGET_STATUS(C4, B4)
```

### Function that operates on ranges

When a range like `A1:A10` is passed, `args[n]` contains all values in the range as a flat array:

```tsx
registerFunction("WEIGHTED_AVG", (args) => {
  const values = args[0] ?? [];   // =WEIGHTED_AVG(B2:B10, C2:C10)
  const weights = args[1] ?? [];
  let sumProduct = 0, sumWeights = 0;
  for (let i = 0; i < values.length; i++) {
    const v = Number(values[i] ?? 0);
    const w = Number(weights[i] ?? 0);
    sumProduct += v * w;
    sumWeights += w;
  }
  return sumWeights === 0 ? 0 : sumProduct / sumWeights;
});

// In a cell: =WEIGHTED_AVG(B2:B10, C2:C10)
```

### Type signature

```ts
type FormulaRangeFunction = (args: CellValue[][]) => CellValue;
// CellValue = string | number | boolean | null
```

- `args[0]` = first argument's values, `args[1]` = second, etc.
- Single-cell arguments are `[value]` (array of one). Ranges are flat arrays.
- Return a `CellValue`. Return a string starting with `#` for errors (e.g., `"#VALUE!"`).
- Call `registerFunction` at module scope (before render). It's a global side-effect.

### Built-in functions (80+)

See [Formulas](./formulas.md) for the complete list: SUM, AVERAGE, IF, VLOOKUP, SUMIF, TODAY, CONCAT, and more.

## Helpers

```ts
import { createEmptyWorkbook, createEmptySheet } from "@particle-academy/fancy-sheets";

const workbook = createEmptyWorkbook();
const sheet = createEmptySheet("sheet-2", "Summary");
```

## useSpreadsheet Hook

Access workbook state and actions from any child of `<Spreadsheet>`:

```tsx
function ExportButton() {
  const { workbook } = useSpreadsheet();
  return <button onClick={() => download(workbookToCSV(workbook))}>Export</button>;
}
```

Key properties:

| Property | Description |
|----------|-------------|
| `workbook` | Current WorkbookData |
| `activeSheet` | Currently displayed SheetData |
| `selection` | `{ activeCell, ranges }` |
| `setCellValue(addr, val)` | Update a single cell |
| `setCellFormat(addrs[], fmt)` | Apply formatting |
| `navigate(dir, extend?)` | Move active cell |
| `startEdit / confirmEdit / cancelEdit` | Edit lifecycle |
| `addSheet / renameSheet / deleteSheet / setActiveSheet` | Sheet management |
| `setFrozenRows(n) / setFrozenCols(n)` | Freeze controls |
| `undo / redo / canUndo / canRedo` | History (50-step) |

## Keyboard Shortcuts

| Keys | Action |
|------|--------|
| Arrow keys | Move active cell |
| Shift + arrows | Extend selection |
| Enter / F2 | Start editing |
| Esc | Cancel edit |
| Tab / Shift+Tab | Move right/left |
| Ctrl/Cmd + C / V | Copy / Paste |
| Ctrl/Cmd + Z / Y | Undo / Redo |
| Ctrl/Cmd + B / I | Bold / Italic |
| Delete / Backspace | Clear cell |

## Data Attributes

| Attribute | Element |
|-----------|---------|
| `data-fancy-sheets` | Root container |
| `data-fancy-sheets-toolbar` | Toolbar |
| `data-fancy-sheets-formula-bar` | Formula bar |
| `data-fancy-sheets-grid` | Grid container |
| `data-fancy-sheets-cell` | Individual cell |
| `data-fancy-sheets-cell-editor` | Active edit input |
| `data-fancy-sheets-selection` | Selection overlay |
| `data-fancy-sheets-tabs` | Sheet tabs |

## See Also

- [Formulas](./formulas.md) — all 80+ built-in functions and custom formula registration
- [CSV Import/Export](./csv.md) — `csvToWorkbook`, `workbookToCSV`, `parseCSV`, `stringifyCSV`
