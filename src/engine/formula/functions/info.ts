import { registerFunction } from "./registry";

registerFunction("ISBLANK", (args) => {
  const val = args.flat()[0];
  return val === null || val === undefined || val === "";
});

registerFunction("ISNUMBER", (args) => {
  return typeof args.flat()[0] === "number";
});

registerFunction("ISTEXT", (args) => {
  const val = args.flat()[0];
  return typeof val === "string" && !val.startsWith("#");
});

registerFunction("ISERROR", (args) => {
  const val = args.flat()[0];
  return typeof val === "string" && val.startsWith("#");
});

registerFunction("ISLOGICAL", (args) => {
  return typeof args.flat()[0] === "boolean";
});

registerFunction("TYPE", (args) => {
  const val = args.flat()[0];
  if (typeof val === "number") return 1;
  if (typeof val === "string") return val.startsWith("#") ? 16 : 2;
  if (typeof val === "boolean") return 4;
  return 1; // null defaults to number
});
