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

function toNum(args: CellValue[][]): number {
  const val = args.flat()[0];
  const n = typeof val === "number" ? val : Number(val);
  return isNaN(n) ? NaN : n;
}

registerFunction("SQRT", (args) => {
  const n = toNum(args);
  return isNaN(n) ? "#VALUE!" : n < 0 ? "#NUM!" : Math.sqrt(n);
});

registerFunction("POWER", (args) => {
  const flat = args.flat();
  const base = typeof flat[0] === "number" ? flat[0] : Number(flat[0]);
  const exp = typeof flat[1] === "number" ? flat[1] : Number(flat[1]);
  if (isNaN(base) || isNaN(exp)) return "#VALUE!";
  return Math.pow(base, exp);
});

registerFunction("MOD", (args) => {
  const flat = args.flat();
  const num = typeof flat[0] === "number" ? flat[0] : Number(flat[0]);
  const div = typeof flat[1] === "number" ? flat[1] : Number(flat[1]);
  if (isNaN(num) || isNaN(div) || div === 0) return "#VALUE!";
  return num % div;
});

registerFunction("INT", (args) => {
  const n = toNum(args);
  return isNaN(n) ? "#VALUE!" : Math.floor(n);
});

registerFunction("TRUNC", (args) => {
  const flat = args.flat();
  const num = typeof flat[0] === "number" ? flat[0] : Number(flat[0]);
  const decimals = flat[1] != null ? (typeof flat[1] === "number" ? flat[1] : Number(flat[1])) : 0;
  if (isNaN(num)) return "#VALUE!";
  const factor = Math.pow(10, decimals);
  return Math.trunc(num * factor) / factor;
});

registerFunction("FLOOR", (args) => {
  const flat = args.flat();
  const num = typeof flat[0] === "number" ? flat[0] : Number(flat[0]);
  const sig = typeof flat[1] === "number" ? flat[1] : Number(flat[1]);
  if (isNaN(num) || isNaN(sig) || sig === 0) return "#VALUE!";
  return Math.floor(num / sig) * sig;
});

registerFunction("CEILING", (args) => {
  const flat = args.flat();
  const num = typeof flat[0] === "number" ? flat[0] : Number(flat[0]);
  const sig = typeof flat[1] === "number" ? flat[1] : Number(flat[1]);
  if (isNaN(num) || isNaN(sig) || sig === 0) return "#VALUE!";
  return Math.ceil(num / sig) * sig;
});

registerFunction("SIGN", (args) => {
  const n = toNum(args);
  return isNaN(n) ? "#VALUE!" : Math.sign(n);
});

registerFunction("PRODUCT", (args) => {
  const nums = toNumbers(args);
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a * b, 1);
});

registerFunction("PI", () => Math.PI);

registerFunction("EXP", (args) => {
  const n = toNum(args);
  return isNaN(n) ? "#VALUE!" : Math.exp(n);
});

registerFunction("LN", (args) => {
  const n = toNum(args);
  return isNaN(n) || n <= 0 ? "#NUM!" : Math.log(n);
});

registerFunction("LOG", (args) => {
  const flat = args.flat();
  const num = typeof flat[0] === "number" ? flat[0] : Number(flat[0]);
  const base = flat[1] != null ? (typeof flat[1] === "number" ? flat[1] : Number(flat[1])) : 10;
  if (isNaN(num) || num <= 0 || isNaN(base) || base <= 0 || base === 1) return "#NUM!";
  return Math.log(num) / Math.log(base);
});

registerFunction("LOG10", (args) => {
  const n = toNum(args);
  return isNaN(n) || n <= 0 ? "#NUM!" : Math.log10(n);
});

registerFunction("RAND", () => Math.random());

registerFunction("RANDBETWEEN", (args) => {
  const flat = args.flat();
  const low = typeof flat[0] === "number" ? flat[0] : Number(flat[0]);
  const high = typeof flat[1] === "number" ? flat[1] : Number(flat[1]);
  if (isNaN(low) || isNaN(high)) return "#VALUE!";
  return Math.floor(Math.random() * (high - low + 1)) + low;
});

registerFunction("MEDIAN", (args) => {
  const nums = toNumbers(args).sort((a, b) => a - b);
  if (nums.length === 0) return 0;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
});

registerFunction("FACT", (args) => {
  const n = toNum(args);
  if (isNaN(n) || n < 0 || n !== Math.floor(n)) return "#VALUE!";
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
});
