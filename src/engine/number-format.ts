/**
 * Spreadsheet number format codes (`#,##0.00`, `0.0%`, `"$"#,##0.00;-"$"#,##0.00`,
 * `yyyy-mm-dd`, ...) rendered the way a spreadsheet application displays them.
 *
 * Pure and React-free: `TEXT()` and the grid's cell display both go through it,
 * so a formatted cell and `=TEXT(A1, code)` can never disagree.
 *
 * The behaviour is MEASURED, not recalled. Every expectation in
 * `number-format.test.ts` is what LibreOffice 26.2 displayed for the same value
 * and code, and the rules below are the ones that table forced:
 *
 * - Rounding is half away from zero on the value's 15-significant-digit decimal
 *   form, so 1.005 shows as 1.01 although the double is 1.00499999...
 * - A single-section code signs a negative only when the rounded digits are not
 *   all zero (-0.4 under `0` is `0`); a negative section (`...;-"$"#,##0.00`)
 *   is chosen by the value's sign, so -0.004 is `-$0.00`.
 * - The sign leads everything, literals included (`-$1,234.57`, `-Total: 1,235`).
 * - Optional fraction digits (`#`, `?`) drop trailing zeros, and the decimal
 *   point goes with them when nothing is left (`#.##` shows 5 as `5`).
 * - Times truncate to the second (a serial of 23:59:59.99 is `23:59:59`).
 *
 * Not supported: fractions (`# ?/?`), elapsed time (`[h]`), fractional seconds
 * and conditions or colours in brackets (brackets are skipped).
 */

import { DAY_MS, dateOfSerial } from "./serial-date";

/** 9999-12-31, the last date a spreadsheet can display. */
const MAX_SERIAL = 2_958_465;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * ISO 4217 code → the symbol holy-sheet writes into the file's format code.
 * Mirrors holy-sheet's `NumFmtBuilder::currencySymbol()` so a workbook shows the
 * same symbol in the grid and in Excel; an unlisted code is written as itself
 * followed by a space.
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF",
  KRW: "₩",
};

export function currencySymbol(currency: string | undefined): string {
  const iso = (currency ?? "USD").toUpperCase();
  return CURRENCY_SYMBOLS[iso] ?? `${iso} `;
}

type Token =
  | { kind: "literal"; text: string }
  | { kind: "digit"; ch: "0" | "#" | "?" }
  | { kind: "point" }
  | { kind: "comma" }
  | { kind: "percent" }
  | { kind: "exponent"; text: string; sign: "+" | "-" }
  | { kind: "general" }
  | { kind: "date"; text: string }
  | { kind: "ampm"; text: string };

/** Splits a code on `;` outside quotes, escapes and brackets. */
function splitSections(code: string): string[] {
  const sections: string[] = [];
  let current = "";
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (ch === '"') {
      const end = code.indexOf('"', i + 1);
      const stop = end === -1 ? code.length : end + 1;
      current += code.slice(i, stop);
      i = stop - 1;
    } else if (ch === "\\" || ch === "_" || ch === "*") {
      current += code.slice(i, i + 2);
      i++;
    } else if (ch === "[") {
      const end = code.indexOf("]", i + 1);
      const stop = end === -1 ? code.length : end + 1;
      current += code.slice(i, stop);
      i = stop - 1;
    } else if (ch === ";") {
      sections.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  sections.push(current);
  return sections;
}

function tokenize(section: string): Token[] {
  const tokens: Token[] = [];
  const literal = (text: string) => {
    const last = tokens[tokens.length - 1];
    if (last?.kind === "literal") last.text += text;
    else tokens.push({ kind: "literal", text });
  };

  for (let i = 0; i < section.length; i++) {
    const ch = section[i];
    const rest = section.slice(i);

    if (ch === '"') {
      const end = section.indexOf('"', i + 1);
      const stop = end === -1 ? section.length : end;
      literal(section.slice(i + 1, stop));
      i = stop;
    } else if (ch === "\\") {
      if (i + 1 < section.length) literal(section[i + 1]);
      i++;
    } else if (ch === "_") {
      literal(" ");
      i++;
    } else if (ch === "*") {
      i++;
    } else if (ch === "[") {
      const end = section.indexOf("]", i + 1);
      i = end === -1 ? section.length : end;
    } else if (ch === "0" || ch === "#" || ch === "?") {
      tokens.push({ kind: "digit", ch });
    } else if (ch === ".") {
      tokens.push({ kind: "point" });
    } else if (ch === ",") {
      tokens.push({ kind: "comma" });
    } else if (ch === "%") {
      tokens.push({ kind: "percent" });
    } else if ((ch === "E" || ch === "e") && (section[i + 1] === "+" || section[i + 1] === "-")) {
      tokens.push({ kind: "exponent", text: ch, sign: section[i + 1] as "+" | "-" });
      i++;
    } else if (/^general/i.test(rest)) {
      tokens.push({ kind: "general" });
      i += 6;
    } else if (ch === "@") {
      tokens.push({ kind: "general" });
    } else if (/^am\/pm/i.test(rest)) {
      tokens.push({ kind: "ampm", text: section.slice(i, i + 5) });
      i += 4;
    } else if (/^a\/p/i.test(rest)) {
      tokens.push({ kind: "ampm", text: section.slice(i, i + 3) });
      i += 2;
    } else if (/[ymdhs]/i.test(ch)) {
      let end = i + 1;
      while (end < section.length && section[end].toLowerCase() === ch.toLowerCase()) end++;
      tokens.push({ kind: "date", text: section.slice(i, end).toLowerCase() });
      i = end - 1;
    } else {
      literal(ch);
    }
  }

  return tokens;
}

/**
 * `abs * 10^shift` rounded half away from zero to `decimals` places, working on
 * the 15-significant-digit decimal form rather than on the binary double.
 */
function roundDecimal(abs: number, decimals: number, shift = 0): { int: string; frac: string } {
  let scaled = "0";

  if (abs !== 0) {
    const [mantissa, exponent] = abs.toExponential(14).split("e");
    const digits = mantissa.replace(".", "");
    const keep = Number(exponent) + shift + 1 + decimals;

    if (keep >= digits.length) {
      scaled = digits + "0".repeat(keep - digits.length);
    } else if (keep >= 0) {
      scaled = digits.slice(0, keep) || "0";
      if (digits[keep] >= "5") scaled = incrementDigits(keep === 0 ? "0" : scaled);
    }
  }

  const padded = scaled.padStart(decimals + 1, "0");
  const int = padded.slice(0, padded.length - decimals).replace(/^0+(?=\d)/, "");
  return { int, frac: padded.slice(padded.length - decimals) };
}

function incrementDigits(digits: string): string {
  const chars = digits.split("");
  for (let i = chars.length - 1; i >= 0; i--) {
    if (chars[i] === "9") {
      chars[i] = "0";
    } else {
      chars[i] = String(Number(chars[i]) + 1);
      return chars.join("");
    }
  }
  return "1" + chars.join("");
}

/** The General format: the value at 15 significant digits, nothing more. */
function formatGeneral(value: number): string {
  return String(Number(value.toPrecision(15))).toUpperCase();
}

function renderNumber(tokens: Token[], value: number, autoSign: boolean): string {
  const exponentAt = tokens.findIndex((t) => t.kind === "exponent");
  const numberEnd = exponentAt === -1 ? tokens.length : exponentAt;
  const pointAt = tokens.findIndex((t, i) => t.kind === "point" && i < numberEnd);
  const intEnd = pointAt === -1 ? numberEnd : pointAt;

  const intDigits: number[] = [];
  const fracDigits: number[] = [];
  const expDigits: number[] = [];
  tokens.forEach((t, i) => {
    if (t.kind !== "digit") return;
    if (i < intEnd) intDigits.push(i);
    else if (i < numberEnd) fracDigits.push(i);
    else expDigits.push(i);
  });

  if (intDigits.length + fracDigits.length === 0) {
    // No placeholders: a literal-only section, or General / @ with literals.
    const general = tokens.some((t) => t.kind === "general") ? formatGeneral(Math.abs(value)) : "";
    const sign = autoSign && general !== "" && /[1-9]/.test(general) ? "-" : "";
    return sign + tokens.map((t) => (t.kind === "literal" ? t.text : t.kind === "general" ? general : "")).join("");
  }

  const lastNumberDigit = fracDigits.length > 0 ? fracDigits[fracDigits.length - 1] : intDigits[intDigits.length - 1];
  let shift = 0;
  let grouping = false;
  const hiddenCommas = new Set<number>();
  tokens.forEach((t, i) => {
    if (t.kind === "percent") shift += 2;
    if (t.kind !== "comma" || i >= numberEnd) return;
    hiddenCommas.add(i);
    if (i > lastNumberDigit) shift -= 3;
    else if (i < intEnd && intDigits.some((d) => d < i)) grouping = true;
  });

  const abs = Math.abs(value);
  const decimals = fracDigits.length;
  let exponent = 0;
  let rounded: { int: string; frac: string };

  if (exponentAt !== -1) {
    exponent = abs === 0 ? 0 : Number(abs.toExponential(14).split("e")[1]);
    rounded = roundDecimal(abs, decimals, shift - exponent);
    if (rounded.int.length > 1) {
      exponent += 1;
      rounded = roundDecimal(abs, decimals, shift - exponent);
    }
  } else {
    rounded = roundDecimal(abs, decimals, shift);
  }

  // Fraction: optional placeholders drop trailing zeros.
  let cut = decimals;
  while (cut > 0 && rounded.frac[cut - 1] === "0" && (tokens[fracDigits[cut - 1]] as { ch: string }).ch !== "0") cut--;
  const fracOut = new Map<number, string>();
  fracDigits.forEach((tokenIndex, n) => {
    const ch = (tokens[tokenIndex] as { ch: string }).ch;
    fracOut.set(tokenIndex, n < cut ? rounded.frac[n] : ch === "?" ? " " : "");
  });

  // Integer: filled right to left, the leftmost placeholder taking any overflow.
  const intOut = new Map<number, string>();
  const hasRequiredInt = intDigits.some((i) => (tokens[i] as { ch: string }).ch === "0");
  const intValue = rounded.int === "0" && !hasRequiredInt ? "" : rounded.int;
  if (grouping) {
    const zeros = intDigits.filter((i) => (tokens[i] as { ch: string }).ch === "0").length;
    const filled = intValue.padStart(zeros, "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    intDigits.forEach((tokenIndex, n) => intOut.set(tokenIndex, n === 0 ? filled : ""));
  } else {
    let remaining = intValue;
    for (let n = intDigits.length - 1; n >= 0; n--) {
      const tokenIndex = intDigits[n];
      const ch = (tokens[tokenIndex] as { ch: string }).ch;
      if (n === 0) {
        intOut.set(tokenIndex, remaining !== "" ? remaining : ch === "0" ? "0" : ch === "?" ? " " : "");
      } else if (remaining !== "") {
        intOut.set(tokenIndex, remaining[remaining.length - 1]);
        remaining = remaining.slice(0, -1);
      } else {
        intOut.set(tokenIndex, ch === "0" ? "0" : ch === "?" ? " " : "");
      }
    }
  }

  const expText = String(Math.abs(exponent)).padStart(expDigits.length, "0");
  const nonZero = /[1-9]/.test(intValue + rounded.frac.slice(0, cut));
  let out = autoSign && nonZero ? "-" : "";

  tokens.forEach((t, i) => {
    switch (t.kind) {
      case "literal":
        out += t.text;
        break;
      case "digit":
        if (i < intEnd) out += intOut.get(i) ?? "";
        else if (i < numberEnd) out += fracOut.get(i) ?? "";
        else if (i === expDigits[0]) out += expText;
        break;
      case "point":
        if (i === pointAt && (cut > 0 || decimals === 0)) out += ".";
        break;
      case "comma":
        if (!hiddenCommas.has(i)) out += ",";
        break;
      case "percent":
        out += "%";
        break;
      case "exponent":
        out += t.text + (exponent < 0 ? "-" : t.sign === "+" ? "+" : "");
        break;
      case "general":
        out += formatGeneral(abs);
        break;
      default:
        break;
    }
  });

  return out;
}

function renderDate(tokens: Token[], value: number): string | null {
  let day = Math.floor(value);
  let ms = Math.round((value - day) * DAY_MS);
  if (ms >= DAY_MS) {
    day += 1;
    ms -= DAY_MS;
  }
  // UTC fields throughout; see serial-date.ts.
  const date = dateOfSerial(day);
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const twelveHour = tokens.some((t) => t.kind === "ampm");
  const pad = (n: number, width: number) => String(n).padStart(width, "0");

  // m / mm are minutes after an hour token or before a seconds token.
  const neighbour = (index: number, step: 1 | -1): string | undefined => {
    for (let i = index + step; i >= 0 && i < tokens.length; i += step) {
      const t = tokens[i];
      if (t.kind === "date") return t.text[0];
      if (t.kind !== "literal") return undefined;
    }
    return undefined;
  };
  const isMinute = (index: number): boolean => neighbour(index, -1) === "h" || neighbour(index, 1) === "s";

  // Only a code that shows a calendar date is limited to 9999-12-31; a time-only
  // code shows the time of any serial.
  const showsDate = tokens.some(
    (t, i) => t.kind === "date" && (t.text[0] === "y" || t.text[0] === "d" || (t.text[0] === "m" && !(t.text.length <= 2 && isMinute(i)))),
  );
  if (showsDate && day > MAX_SERIAL) return null;

  return tokens
    .map((t, i) => {
      if (t.kind === "literal") return t.text;
      // Number-code characters mean nothing in a date code; they are text there.
      if (t.kind === "comma") return ",";
      if (t.kind === "point") return ".";
      if (t.kind === "percent") return "%";
      if (t.kind === "digit") return t.ch;
      if (t.kind === "exponent") return t.text + t.sign;
      if (t.kind === "ampm") {
        const pm = hours >= 12;
        const [am, pmText] = t.text.split("/");
        return pm ? pmText : am;
      }
      if (t.kind !== "date") return "";

      const { text } = t;
      switch (text[0]) {
        case "y":
          return text.length <= 2 ? pad(date.getUTCFullYear() % 100, 2) : pad(date.getUTCFullYear(), 4);
        case "d":
          if (text.length === 1) return String(date.getUTCDate());
          if (text.length === 2) return pad(date.getUTCDate(), 2);
          if (text.length === 3) return WEEKDAYS[date.getUTCDay()].slice(0, 3);
          return WEEKDAYS[date.getUTCDay()];
        case "h": {
          const h = twelveHour ? hours % 12 || 12 : hours;
          return text.length === 1 ? String(h) : pad(h, 2);
        }
        case "s": {
          const s = seconds % 60;
          return text.length === 1 ? String(s) : pad(s, 2);
        }
        case "m": {
          if (text.length <= 2 && isMinute(i)) {
            const m = Math.floor(seconds / 60) % 60;
            return text.length === 1 ? String(m) : pad(m, 2);
          }
          const month = date.getUTCMonth();
          if (text.length === 1) return String(month + 1);
          if (text.length === 2) return pad(month + 1, 2);
          if (text.length === 3) return MONTHS[month].slice(0, 3);
          if (text.length === 4) return MONTHS[month];
          return MONTHS[month][0];
        }
        default:
          return "";
      }
    })
    .join("");
}

/**
 * Renders a number through a spreadsheet format code. Returns `null` when the
 * value cannot be shown in that code (a date past 9999-12-31, or a non-finite
 * number); `TEXT()` turns that into `#VALUE!`, the grid shows the raw value.
 */
export function formatWithCode(value: number, code: string): string | null {
  if (!Number.isFinite(value)) return null;

  const sections = splitSections(code);
  let section = sections[0];
  let autoSign = value < 0;

  if (value < 0 && sections.length >= 2) {
    section = sections[1];
    autoSign = false;
  } else if (value === 0 && sections.length >= 3) {
    section = sections[2];
  }

  if (code.trim() === "") return formatGeneral(value);

  const tokens = tokenize(section);

  if (tokens.some((t) => t.kind === "date" || t.kind === "ampm")) {
    return renderDate(tokens, value);
  }

  return renderNumber(tokens, value, autoSign);
}
