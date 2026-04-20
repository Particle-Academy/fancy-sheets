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
| className | `string` | Additional CSS classes |

### SheetWorkbook

All `Spreadsheet` props plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| hideToolbar | `boolean` | `false` | Hide the toolbar |
| hideTabs | `boolean` | `false` | Hide the sheet tabs |
| toolbarExtra | `ReactNode` | - | Extra toolbar content |

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

### Context Menu Items

```ts
interface SpreadsheetContextMenuItem {
  label: string;
  onClick: (address: string) => void;
  disabled?: boolean | ((address: string) => boolean);
  danger?: boolean;
}
```

Pass as array (static) or callback (dynamic per cell):

```tsx
// Static
<Spreadsheet contextMenuItems={[
  { label: "Highlight", onClick: (addr) => highlight(addr) },
]}>

// Dynamic (context-aware)
<Spreadsheet contextMenuItems={(addr) => {
  const cell = sheet.cells[addr];
  return cell?.comment
    ? [{ label: "Edit Comment", onClick: ... }, { label: "Delete Comment", danger: true, onClick: ... }]
    : [{ label: "Add Comment", onClick: ... }];
}}>
```

Items appear after a separator below the built-in items (Copy, Paste, Clear, Freeze).

## Custom Formulas

```tsx
import { registerFunction } from "@particle-academy/fancy-sheets";
import type { FormulaRangeFunction } from "@particle-academy/fancy-sheets";

const myFormula: FormulaRangeFunction = (args) => {
  const value = Number(args[0]?.[0] ?? 0);
  return value > 100 ? "High" : "Low";
};

registerFunction("PRIORITY", myFormula);
// Usage in cells: =PRIORITY(A1)
```

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
