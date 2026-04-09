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
