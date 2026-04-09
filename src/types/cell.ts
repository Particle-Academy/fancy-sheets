/** Column-letter + row-number string, e.g. "A1", "BC42" */
export type CellAddress = string;

/** Primitive cell value */
export type CellValue = string | number | boolean | null;

/** Text alignment */
export type TextAlign = "left" | "center" | "right";

/** Cell formatting */
export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  textAlign?: TextAlign;
}

/** A single cell's complete data */
export interface CellData {
  /** The raw value (what the user typed) */
  value: CellValue;
  /** Formula string without leading "=", e.g. "SUM(A1:A5)" */
  formula?: string;
  /** Computed value after formula evaluation */
  computedValue?: CellValue;
  /** Display formatting */
  format?: CellFormat;
}
