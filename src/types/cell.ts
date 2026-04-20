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
  /** Custom CSS class(es) applied to the cell element */
  className?: string;
}

/** Cell comment */
export interface CellComment {
  /** Comment text */
  text: string;
  /** Author name (optional) */
  author?: string;
  /** Comment color — used for the corner triangle indicator and cell border (default: #f59e0b / amber-500) */
  color?: string;
}

/** Consumer-driven cell highlight — rendered as a visual overlay, independent of selection and format */
export interface CellHighlight {
  /** Border/outline color (any CSS color value) */
  color: string;
  /** Background tint — if omitted and color is hex, auto-derived at 10% opacity */
  backgroundColor?: string;
  /** Small label badge in the cell's top-left corner (e.g., "var", "lbl") */
  label?: string;
}

/** Map of cell addresses to their highlights */
export type CellHighlightMap = Record<string, CellHighlight>;

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
  /** Cell comment — shows a triangle indicator in the corner */
  comment?: CellComment;
  /** Consumer-defined metadata — the package stores but never reads this */
  meta?: Record<string, unknown>;
}
