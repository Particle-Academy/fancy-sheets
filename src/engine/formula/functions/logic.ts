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
