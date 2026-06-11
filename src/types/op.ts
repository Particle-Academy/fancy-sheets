import type { CellAddress, CellValue } from "./cell";
import type { WorkbookData } from "./sheet";

/**
 * A single agent/host-emitted mutation to a workbook — the spreadsheet parallel
 * of fancy-slides' `DeckOp`. A small, JSON-serializable frame an external agent
 * (or a server-side store) broadcasts over a channel, applied through the same
 * reducer that drives `<SheetWorkbook>`. Standardizing the shape keeps
 * independent agent implementations from drifting on what a "set cell" looks
 * like over the wire.
 *
 * `sheet` is matched against a sheet's `id` first, then its `name`.
 */
export type SheetOp =
  /** Set one cell's value (and optionally its formula, sans leading "="). */
  | { type: "set_cell"; sheet: string; address: CellAddress; value: CellValue; formula?: string }
  /** Set a rectangular block of values, row-major, anchored at `start`. */
  | { type: "set_range"; sheet: string; start: CellAddress; end?: CellAddress; values: CellValue[][] }
  /** Replace the whole workbook (full-document sync / initial hydration). */
  | { type: "set_workbook"; data: WorkbookData };
