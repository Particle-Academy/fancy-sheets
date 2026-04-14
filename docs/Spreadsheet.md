# Spreadsheet

A full-featured spreadsheet component with formulas, formatting, selection, multi-sheet workbooks, clipboard, CSV import/export, and undo/redo. Compound API.

## Import

```tsx
import { Spreadsheet, useSpreadsheet } from "@particle-academy/fancy-sheets";
import "@particle-academy/fancy-sheets/styles.css";
```

## Basic Usage

```tsx
<div style={{ height: 600 }}>
  <Spreadsheet>
    <Spreadsheet.Toolbar />
    <Spreadsheet.Grid />
    <Spreadsheet.SheetTabs />
  </Spreadsheet>
</div>
```

The component fills its container — wrap it in a sized element (height is required).

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
| readOnly | `boolean` | `false` | Disable editing, formatting, and structural changes |
| className | `string` | - | Additional CSS classes |

### Spreadsheet.Toolbar

Default toolbar with format buttons (bold, italic, align), undo/redo, and freeze controls. Pass `children` to replace entirely.

| Prop | Type | Description |
|------|------|-------------|
| children | `ReactNode` | Replace defaults |
| className | `string` | Additional CSS classes |

### Spreadsheet.Grid

The main editable cell grid. Handles navigation, selection, editing, keyboard shortcuts, and clipboard.

| Prop | Type | Description |
|------|------|-------------|
| className | `string` | Additional CSS classes |

### Spreadsheet.SheetTabs

Bottom tab bar for multi-sheet workbooks. Supports add/rename/delete/switch.

| Prop | Type | Description |
|------|------|-------------|
| className | `string` | Additional CSS classes |

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
  cells: Record<CellAddress, CellData>;   // sparse — only non-empty cells
  columnWidths: Record<number, number>;   // sparse overrides
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
type CellAddress = string; // "A1", "AA99", ...
type CellValue = string | number | boolean | null;

interface CellData {
  value: CellValue;           // raw entered value
  formula?: string;           // original formula string (e.g. "=SUM(A1:A10)")
  computedValue?: CellValue;  // evaluated result
  format?: CellFormat;
}
```

### CellFormat

```ts
interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  textAlign?: "left" | "center" | "right";
  displayFormat?: "auto" | "date" | "datetime" | "number" | "percent";
  decimals?: number;
}
```

## Helpers

```ts
import { createEmptyWorkbook, createEmptySheet } from "@particle-academy/fancy-sheets";

const workbook = createEmptyWorkbook();
const newSheet = createEmptySheet("sheet-2", "Summary");
```

## useSpreadsheet Hook

Access full workbook state and actions from any child of `<Spreadsheet>`.

```tsx
import { useSpreadsheet } from "@particle-academy/fancy-sheets";

function ExportButton() {
  const { workbook } = useSpreadsheet();
  return (
    <button onClick={() => download(workbookToCSV(workbook))}>
      Export CSV
    </button>
  );
}
```

See `SpreadsheetContextValue` in source for the full shape — key properties:

| Property | Description |
|----------|-------------|
| `workbook` | Current WorkbookData |
| `activeSheet` | Currently displayed SheetData |
| `selection` | `{ activeCell, ranges }` |
| `setCellValue(addr, val)` | Update a single cell |
| `setCellFormat(addrs[], fmt)` | Apply formatting to a list of cells |
| `navigate(dir, extend?)` | Move active cell (arrow-key equivalent) |
| `startEdit(val?) / confirmEdit() / cancelEdit()` | Edit lifecycle |
| `addSheet() / renameSheet() / deleteSheet() / setActiveSheet()` | Sheet management |
| `setFrozenRows(n) / setFrozenCols(n)` | Freeze controls |
| `undo() / redo()` | History navigation (50-step stack) |
| `canUndo / canRedo` | Booleans |

## Controlled Usage

```tsx
const [data, setData] = useState<WorkbookData>(createEmptyWorkbook());

<Spreadsheet data={data} onChange={setData}>
  <Spreadsheet.Toolbar />
  <Spreadsheet.Grid />
  <Spreadsheet.SheetTabs />
</Spreadsheet>
```

## Read-Only Display

```tsx
<Spreadsheet defaultData={reportData} readOnly>
  <Spreadsheet.Grid />
</Spreadsheet>
```

## Keyboard Shortcuts

| Keys | Action |
|------|--------|
| Arrow keys | Move active cell |
| Shift + arrows | Extend selection |
| Ctrl/Cmd + arrows | Jump to edge |
| Enter / F2 | Start editing |
| Esc | Cancel edit |
| Tab / Shift+Tab | Move right/left |
| Ctrl/Cmd + C / X / V | Copy / Cut / Paste |
| Ctrl/Cmd + Z / Y | Undo / Redo |
| Ctrl/Cmd + B / I | Bold / Italic |

## Data Attributes

| Attribute | Element |
|-----------|---------|
| `data-fancy-sheets` | Root container |
| `data-fancy-sheets-toolbar` | Toolbar |
| `data-fancy-sheets-formula-bar` | Formula bar |
| `data-fancy-sheets-grid` | Grid container |
| `data-fancy-sheets-column-headers` | Column header row |
| `data-fancy-sheets-row-header` | Row header cell |
| `data-fancy-sheets-cell` | Individual cell |
| `data-fancy-sheets-cell-editor` | Active edit input |
| `data-fancy-sheets-selection` | Selection overlay |
| `data-fancy-sheets-resize-handle` | Column resize handle |
| `data-fancy-sheets-tabs` | Sheet tabs |

## See Also

- [Formulas](./formulas.md) — all 80+ built-in functions and how to register custom ones
- [CSV Import/Export](./csv.md) — `csvToWorkbook`, `workbookToCSV`, `parseCSV`, `stringifyCSV`
