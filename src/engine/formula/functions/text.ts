import { registerFunction } from "./registry";

registerFunction("UPPER", (args) => {
  const val = args.flat()[0];
  return val != null ? String(val).toUpperCase() : "";
});

registerFunction("LOWER", (args) => {
  const val = args.flat()[0];
  return val != null ? String(val).toLowerCase() : "";
});

registerFunction("LEN", (args) => {
  const val = args.flat()[0];
  return val != null ? String(val).length : 0;
});

registerFunction("TRIM", (args) => {
  const val = args.flat()[0];
  return val != null ? String(val).trim() : "";
});

registerFunction("CONCAT", (args) => {
  return args.flat().map((v) => (v != null ? String(v) : "")).join("");
});

registerFunction("LEFT", (args) => {
  const flat = args.flat();
  const text = flat[0] != null ? String(flat[0]) : "";
  const chars = flat[1] != null ? Number(flat[1]) : 1;
  return text.slice(0, chars);
});

registerFunction("RIGHT", (args) => {
  const flat = args.flat();
  const text = flat[0] != null ? String(flat[0]) : "";
  const chars = flat[1] != null ? Number(flat[1]) : 1;
  return text.slice(-chars);
});

registerFunction("MID", (args) => {
  const flat = args.flat();
  const text = flat[0] != null ? String(flat[0]) : "";
  const start = Number(flat[1]) - 1; // 1-based to 0-based
  const chars = Number(flat[2]);
  if (isNaN(start) || isNaN(chars)) return "#VALUE!";
  return text.slice(start, start + chars);
});

registerFunction("FIND", (args) => {
  const flat = args.flat();
  const search = flat[0] != null ? String(flat[0]) : "";
  const text = flat[1] != null ? String(flat[1]) : "";
  const startPos = flat[2] != null ? Number(flat[2]) - 1 : 0;
  const idx = text.indexOf(search, startPos);
  return idx === -1 ? "#VALUE!" : idx + 1; // 1-based
});

registerFunction("SEARCH", (args) => {
  const flat = args.flat();
  const search = flat[0] != null ? String(flat[0]).toLowerCase() : "";
  const text = flat[1] != null ? String(flat[1]).toLowerCase() : "";
  const startPos = flat[2] != null ? Number(flat[2]) - 1 : 0;
  const idx = text.indexOf(search, startPos);
  return idx === -1 ? "#VALUE!" : idx + 1;
});

registerFunction("SUBSTITUTE", (args) => {
  const flat = args.flat();
  const text = flat[0] != null ? String(flat[0]) : "";
  const oldText = flat[1] != null ? String(flat[1]) : "";
  const newText = flat[2] != null ? String(flat[2]) : "";
  const nth = flat[3] != null ? Number(flat[3]) : 0;
  if (nth === 0) return text.split(oldText).join(newText);
  let count = 0;
  return text.replace(new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), (match) => {
    count++;
    return count === nth ? newText : match;
  });
});

registerFunction("REPLACE", (args) => {
  const flat = args.flat();
  const text = flat[0] != null ? String(flat[0]) : "";
  const start = Number(flat[1]) - 1;
  const chars = Number(flat[2]);
  const newText = flat[3] != null ? String(flat[3]) : "";
  if (isNaN(start) || isNaN(chars)) return "#VALUE!";
  return text.slice(0, start) + newText + text.slice(start + chars);
});

registerFunction("REPT", (args) => {
  const flat = args.flat();
  const text = flat[0] != null ? String(flat[0]) : "";
  const times = Number(flat[1]);
  if (isNaN(times) || times < 0) return "#VALUE!";
  return text.repeat(times);
});

registerFunction("EXACT", (args) => {
  const flat = args.flat();
  return String(flat[0] ?? "") === String(flat[1] ?? "");
});

registerFunction("PROPER", (args) => {
  const val = args.flat()[0];
  const text = val != null ? String(val) : "";
  return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
});

registerFunction("VALUE", (args) => {
  const val = args.flat()[0];
  const num = Number(val);
  return isNaN(num) ? "#VALUE!" : num;
});

registerFunction("TEXT", (args) => {
  const flat = args.flat();
  const val = flat[0];
  const fmt = flat[1] != null ? String(flat[1]) : "";
  if (val == null) return "";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  // Basic format support: 0, 0.00, #,##0, %
  if (fmt.includes("%")) return (num * 100).toFixed(fmt.split(".")[1]?.length ?? 0) + "%";
  if (fmt.includes(".")) {
    const decimals = fmt.split(".")[1]?.replace(/[^0#]/g, "").length ?? 0;
    return num.toFixed(decimals);
  }
  return String(num);
});

registerFunction("CHAR", (args) => {
  const code = Number(args.flat()[0]);
  if (isNaN(code)) return "#VALUE!";
  return String.fromCharCode(code);
});

registerFunction("CODE", (args) => {
  const text = String(args.flat()[0] ?? "");
  return text.length > 0 ? text.charCodeAt(0) : "#VALUE!";
});
