import { registerFunction } from "./registry";
import type { CellValue } from "../../../types/cell";

/** Match a value against a criteria string like ">5", "<>abc", "=text", or plain value */
function matchesCriteria(value: CellValue, criteria: CellValue): boolean {
  if (criteria === null || criteria === undefined) return false;
  const critStr = String(criteria);

  // Comparison operators
  if (critStr.startsWith("<>")) {
    const target = critStr.slice(2);
    const num = Number(target);
    if (!isNaN(num) && typeof value === "number") return value !== num;
    return String(value) !== target;
  }
  if (critStr.startsWith(">=")) {
    const num = Number(critStr.slice(2));
    return typeof value === "number" && value >= num;
  }
  if (critStr.startsWith("<=")) {
    const num = Number(critStr.slice(2));
    return typeof value === "number" && value <= num;
  }
  if (critStr.startsWith(">")) {
    const num = Number(critStr.slice(1));
    return typeof value === "number" && value > num;
  }
  if (critStr.startsWith("<")) {
    const num = Number(critStr.slice(1));
    return typeof value === "number" && value < num;
  }
  if (critStr.startsWith("=")) {
    const target = critStr.slice(1);
    const num = Number(target);
    if (!isNaN(num) && typeof value === "number") return value === num;
    return String(value).toLowerCase() === target.toLowerCase();
  }

  // Wildcard matching
  if (critStr.includes("*") || critStr.includes("?")) {
    const pattern = critStr
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    return new RegExp("^" + pattern + "$", "i").test(String(value));
  }

  // Exact match
  if (typeof criteria === "number") return value === criteria;
  const num = Number(critStr);
  if (!isNaN(num) && typeof value === "number") return value === num;
  return String(value).toLowerCase() === critStr.toLowerCase();
}

registerFunction("SUMIF", (args) => {
  const range = args[0] ?? [];
  const criteria = (args[1] ?? [])[0];
  const sumRange = args[2] ?? range;
  let total = 0;
  for (let i = 0; i < range.length; i++) {
    if (matchesCriteria(range[i], criteria)) {
      const val = Number(sumRange[i] ?? 0);
      if (!isNaN(val)) total += val;
    }
  }
  return total;
});

registerFunction("SUMIFS", (args) => {
  const sumRange = args[0] ?? [];
  let total = 0;
  for (let i = 0; i < sumRange.length; i++) {
    let allMatch = true;
    for (let p = 1; p < args.length - 1; p += 2) {
      const criteriaRange = args[p] ?? [];
      const criteria = (args[p + 1] ?? [])[0];
      if (!matchesCriteria(criteriaRange[i], criteria)) { allMatch = false; break; }
    }
    if (allMatch) {
      const val = Number(sumRange[i] ?? 0);
      if (!isNaN(val)) total += val;
    }
  }
  return total;
});

registerFunction("COUNTIF", (args) => {
  const range = args[0] ?? [];
  const criteria = (args[1] ?? [])[0];
  let count = 0;
  for (const val of range) {
    if (matchesCriteria(val, criteria)) count++;
  }
  return count;
});

registerFunction("COUNTIFS", (args) => {
  if (args.length < 2) return 0;
  const len = (args[0] ?? []).length;
  let count = 0;
  for (let i = 0; i < len; i++) {
    let allMatch = true;
    for (let p = 0; p < args.length - 1; p += 2) {
      const range = args[p] ?? [];
      const criteria = (args[p + 1] ?? [])[0];
      if (!matchesCriteria(range[i], criteria)) { allMatch = false; break; }
    }
    if (allMatch) count++;
  }
  return count;
});

registerFunction("AVERAGEIF", (args) => {
  const range = args[0] ?? [];
  const criteria = (args[1] ?? [])[0];
  const avgRange = args[2] ?? range;
  let total = 0;
  let count = 0;
  for (let i = 0; i < range.length; i++) {
    if (matchesCriteria(range[i], criteria)) {
      const val = Number(avgRange[i] ?? 0);
      if (!isNaN(val)) { total += val; count++; }
    }
  }
  return count === 0 ? "#DIV/0!" : total / count;
});

registerFunction("AVERAGEIFS", (args) => {
  const avgRange = args[0] ?? [];
  let total = 0;
  let count = 0;
  for (let i = 0; i < avgRange.length; i++) {
    let allMatch = true;
    for (let p = 1; p < args.length - 1; p += 2) {
      const criteriaRange = args[p] ?? [];
      const criteria = (args[p + 1] ?? [])[0];
      if (!matchesCriteria(criteriaRange[i], criteria)) { allMatch = false; break; }
    }
    if (allMatch) {
      const val = Number(avgRange[i] ?? 0);
      if (!isNaN(val)) { total += val; count++; }
    }
  }
  return count === 0 ? "#DIV/0!" : total / count;
});

registerFunction("MINIFS", (args) => {
  const minRange = args[0] ?? [];
  let result = Infinity;
  for (let i = 0; i < minRange.length; i++) {
    let allMatch = true;
    for (let p = 1; p < args.length - 1; p += 2) {
      const criteriaRange = args[p] ?? [];
      const criteria = (args[p + 1] ?? [])[0];
      if (!matchesCriteria(criteriaRange[i], criteria)) { allMatch = false; break; }
    }
    if (allMatch) {
      const val = Number(minRange[i]);
      if (!isNaN(val) && val < result) result = val;
    }
  }
  return result === Infinity ? 0 : result;
});

registerFunction("MAXIFS", (args) => {
  const maxRange = args[0] ?? [];
  let result = -Infinity;
  for (let i = 0; i < maxRange.length; i++) {
    let allMatch = true;
    for (let p = 1; p < args.length - 1; p += 2) {
      const criteriaRange = args[p] ?? [];
      const criteria = (args[p + 1] ?? [])[0];
      if (!matchesCriteria(criteriaRange[i], criteria)) { allMatch = false; break; }
    }
    if (allMatch) {
      const val = Number(maxRange[i]);
      if (!isNaN(val) && val > result) result = val;
    }
  }
  return result === -Infinity ? 0 : result;
});
