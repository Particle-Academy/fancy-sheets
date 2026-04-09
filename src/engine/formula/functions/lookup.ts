import { registerFunction } from "./registry";
import type { CellValue } from "../../../types/cell";

registerFunction("VLOOKUP", (args) => {
  const flat = args.flat();
  const key = flat[0];
  const range = args[1] ?? []; // The lookup range as flat array
  const colIdx = Number(flat[2] ?? flat[args[1]?.length ?? 0]); // Column index (1-based)
  // Approximate match not implemented — always exact
  if (key === null || isNaN(colIdx)) return "#VALUE!";

  // We receive the range as a flat array. We need to figure out dimensions.
  // For now, VLOOKUP works with the range as a single column lookup.
  // Look for the key in the range, return offset value.
  for (let i = 0; i < range.length; i++) {
    if (range[i] === key || (typeof range[i] === "string" && typeof key === "string" && range[i].toLowerCase() === key.toLowerCase())) {
      return range[i] ?? "#N/A";
    }
  }
  return "#N/A";
});

registerFunction("HLOOKUP", (args) => {
  const flat = args.flat();
  const key = flat[0];
  const range = args[1] ?? [];
  for (let i = 0; i < range.length; i++) {
    if (range[i] === key || (typeof range[i] === "string" && typeof key === "string" && range[i].toLowerCase() === key.toLowerCase())) {
      return range[i] ?? "#N/A";
    }
  }
  return "#N/A";
});

registerFunction("INDEX", (args) => {
  const range = args[0] ?? [];
  const flat = args.flat();
  const row = Number(flat[range.length] ?? flat[1]);
  if (isNaN(row) || row < 1 || row > range.length) return "#REF!";
  return range[row - 1] ?? null;
});

registerFunction("MATCH", (args) => {
  const flat = args.flat();
  const key = flat[0];
  const range = args[1] ?? [];
  for (let i = 0; i < range.length; i++) {
    if (range[i] === key || (typeof range[i] === "number" && typeof key === "number" && range[i] === key)) {
      return i + 1; // 1-based
    }
    if (typeof range[i] === "string" && typeof key === "string" && range[i].toLowerCase() === key.toLowerCase()) {
      return i + 1;
    }
  }
  return "#N/A";
});

registerFunction("ROWS", (args) => {
  // Range length represents total cells; without dimension info, return count
  return (args[0] ?? []).length;
});

registerFunction("COLUMNS", (args) => {
  // Without 2D dimension metadata, return 1
  return 1;
});

registerFunction("ROW", (args) => {
  // Without cell address metadata, return the numeric value if it looks like a row
  const val = args.flat()[0];
  if (typeof val === "number") return val;
  return "#VALUE!";
});

registerFunction("COLUMN", (args) => {
  const val = args.flat()[0];
  if (typeof val === "number") return val;
  return "#VALUE!";
});
