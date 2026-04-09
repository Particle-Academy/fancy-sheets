import { registerFunction } from "./registry";
import type { CellValue } from "../../../types/cell";

function toBool(v: CellValue): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return v.toUpperCase() === "TRUE";
  return false;
}

registerFunction("IF", (args) => {
  const flat = args.flat();
  const condition = toBool(flat[0]);
  const trueVal = flat[1] ?? true;
  const falseVal = flat[2] ?? false;
  return condition ? trueVal : falseVal;
});

registerFunction("AND", (args) => {
  return args.flat().every(toBool);
});

registerFunction("OR", (args) => {
  return args.flat().some(toBool);
});

registerFunction("NOT", (args) => {
  return !toBool(args.flat()[0]);
});

registerFunction("IFERROR", (args) => {
  const flat = args.flat();
  const val = flat[0];
  if (typeof val === "string" && val.startsWith("#")) return flat[1] ?? "";
  return val;
});

registerFunction("IFBLANK", (args) => {
  const flat = args.flat();
  const val = flat[0];
  if (val === null || val === undefined || val === "") return flat[1] ?? "";
  return val;
});

registerFunction("SWITCH", (args) => {
  const flat = args.flat();
  const expr = flat[0];
  for (let i = 1; i < flat.length - 1; i += 2) {
    if (flat[i] === expr) return flat[i + 1];
  }
  // Last arg is default if odd number of remaining args
  return flat.length % 2 === 0 ? flat[flat.length - 1] : "#N/A";
});

registerFunction("CHOOSE", (args) => {
  const flat = args.flat();
  const index = Number(flat[0]);
  if (isNaN(index) || index < 1 || index >= flat.length) return "#VALUE!";
  return flat[index];
});
