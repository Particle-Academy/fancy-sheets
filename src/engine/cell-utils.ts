/** Convert 0-based column index to letter(s): 0="A", 25="Z", 26="AA" */
export function columnToLetter(col: number): string {
  let result = "";
  let c = col;
  while (c >= 0) {
    result = String.fromCharCode((c % 26) + 65) + result;
    c = Math.floor(c / 26) - 1;
  }
  return result;
}

/** Convert column letter(s) to 0-based index: "A"=0, "Z"=25, "AA"=26 */
export function letterToColumn(letters: string): number {
  let result = 0;
  for (let i = 0; i < letters.length; i++) {
    result = result * 26 + (letters.charCodeAt(i) - 64);
  }
  return result - 1;
}

/** Parse address string to 0-based row and col: "B3" -> { row: 2, col: 1 } */
export function parseAddress(addr: string): { row: number; col: number } {
  const match = addr.match(/^([A-Z]+)(\d+)$/);
  if (!match) return { row: 0, col: 0 };
  return {
    col: letterToColumn(match[1]),
    row: parseInt(match[2], 10) - 1,
  };
}

/** Convert 0-based row and col to address string: (2, 1) -> "B3" */
export function toAddress(row: number, col: number): string {
  return columnToLetter(col) + (row + 1);
}

/** Check if a string is a valid cell address */
export function isValidAddress(addr: string): boolean {
  return /^[A-Z]+\d+$/.test(addr);
}

/** Expand a range into an array of addresses */
export function expandRange(startAddr: string, endAddr: string): string[] {
  const s = parseAddress(startAddr);
  const e = parseAddress(endAddr);
  const minRow = Math.min(s.row, e.row);
  const maxRow = Math.max(s.row, e.row);
  const minCol = Math.min(s.col, e.col);
  const maxCol = Math.max(s.col, e.col);
  const addresses: string[] = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      addresses.push(toAddress(r, c));
    }
  }
  return addresses;
}

/** Normalize a range so start is top-left and end is bottom-right */
export function normalizeRange(startAddr: string, endAddr: string): { start: string; end: string } {
  const s = parseAddress(startAddr);
  const e = parseAddress(endAddr);
  return {
    start: toAddress(Math.min(s.row, e.row), Math.min(s.col, e.col)),
    end: toAddress(Math.max(s.row, e.row), Math.max(s.col, e.col)),
  };
}

/** Offset an address by row/col deltas */
export function offsetAddress(addr: string, rowDelta: number, colDelta: number): string {
  const { row, col } = parseAddress(addr);
  return toAddress(row + rowDelta, col + colDelta);
}
