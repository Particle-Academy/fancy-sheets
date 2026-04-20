/** Column-letter + row-number string, e.g. "A1", "BC42" */
export type CellAddress = string;

/** Primitive cell value */
export type CellValue = string | number | boolean | null;

/** Text alignment */
export type TextAlign = "left" | "center" | "right";

/** Display format for cell values */
export type CellDisplayFormat = "auto" | "text" | "number" | "date" | "datetime" | "percentage" | "currency";

/** Cell formatting */
export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  textAlign?: TextAlign;
  /** Display format — controls how the value is rendered */
  displayFormat?: CellDisplayFormat;
  /** Number of decimal places to display (for number/currency/percentage) */
  decimals?: number;
  /** Background color (any CSS color value) */
  backgroundColor?: string;
  /** Font color (any CSS color value) */
  color?: string;
  /** Font size in pixels */
  fontSize?: number;
  /** Top border color (renders 1px solid) */
  borderTop?: string;
  /** Right border color */
  borderRight?: string;
  /** Bottom border color */
  borderBottom?: string;
  /** Left border color (renders 1px solid) */
  borderLeft?: string;
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
