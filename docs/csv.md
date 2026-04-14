# CSV Import / Export

Four utility functions for moving data between CSV strings and workbook/sheet structures. Handles quoted fields, escaped quotes, and newlines inside quoted values.

## Import

```tsx
import {
  parseCSV,
  stringifyCSV,
  csvToWorkbook,
  workbookToCSV,
} from "@particle-academy/fancy-sheets";
```

## Low-Level: parseCSV / stringifyCSV

```ts
function parseCSV(csv: string): string[][];
function stringifyCSV(rows: string[][]): string;
```

```tsx
const rows = parseCSV(`name,age\nAlice,30\nBob,25`);
// [["name", "age"], ["Alice", "30"], ["Bob", "25"]]

const csv = stringifyCSV(rows);
// "name,age\nAlice,30\nBob,25"
```

Quoted strings are preserved, embedded commas/newlines survive the round-trip, and `""` is decoded as a literal `"`.

## High-Level: csvToWorkbook / workbookToCSV

```ts
function csvToWorkbook(csv: string, sheetName?: string): WorkbookData;
function workbookToCSV(workbook: WorkbookData): string;
```

Use these for full workbook ↔ file conversions:

```tsx
// Load a CSV file into the editor
const text = await file.text();
const workbook = csvToWorkbook(text, file.name.replace(/\.csv$/i, ""));
setData(workbook);

// Export current workbook to CSV
const csv = workbookToCSV(workbook);
downloadFile(csv, "export.csv", "text/csv");
```

`workbookToCSV` concatenates all sheets separated by a blank line and `# <sheet name>` header lines. For single-sheet export, slice the returned string or pre-filter the workbook to one sheet.

## Example: File Upload

```tsx
function Importer() {
  const { workbook } = useSpreadsheet();

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const imported = csvToWorkbook(text, file.name);
    // merge into existing workbook or replace...
  };

  return <input type="file" accept=".csv" onChange={handleFile} />;
}
```

## Clipboard

Clipboard paste into the grid already uses TSV (tab-separated) internally — paste a CSV from Excel / Sheets and it lands in the cells correctly. Use the CSV helpers for file-based import/export, not clipboard.
