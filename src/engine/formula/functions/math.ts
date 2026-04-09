import { registerFunction } from "./registry";
import type { CellValue } from "../../../types/cell";

function toNumbers(args: CellValue[][]): number[] {
  const nums: number[] = [];
  for (const group of args) {
    for (const v of group) {
      if (typeof v === "number") nums.push(v);
      else if (typeof v === "string" && v !== "" && !isNaN(Number(v))) nums.push(Number(v));
    }
  }
  return nums;
}

registerFunction("SUM", (args) => {
  return toNumbers(args).reduce((a, b) => a + b, 0);
});

registerFunction("AVERAGE", (args) => {
  const nums = toNumbers(args);
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
});

registerFunction("MIN", (args) => {
  const nums = toNumbers(args);
  if (nums.length === 0) return 0;
  return Math.min(...nums);
});

registerFunction("MAX", (args) => {
  const nums = toNumbers(args);
  if (nums.length === 0) return 0;
  return Math.max(...nums);
});

registerFunction("COUNT", (args) => {
  return toNumbers(args).length;
});

registerFunction("ROUND", (args) => {
  const flat = args.flat();
  const num = typeof flat[0] === "number" ? flat[0] : Number(flat[0]);
  const decimals = typeof flat[1] === "number" ? flat[1] : (flat[1] != null ? Number(flat[1]) : 0);
  if (isNaN(num)) return "#VALUE!";
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
});

registerFunction("ABS", (args) => {
  const val = args.flat()[0];
  const num = typeof val === "number" ? val : Number(val);
  if (isNaN(num)) return "#VALUE!";
  return Math.abs(num);
});
