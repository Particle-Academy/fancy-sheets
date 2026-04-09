/** A rectangular range of cells */
export interface CellRange {
  start: string;
  end: string;
}

/** Full selection state */
export interface SelectionState {
  /** The anchor cell (where selection started) */
  activeCell: string;
  /** Ranges currently selected (supports multi-select via Ctrl+Click) */
  ranges: CellRange[];
}
