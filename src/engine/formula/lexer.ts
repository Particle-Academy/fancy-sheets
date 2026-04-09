import type { FormulaToken, FormulaTokenType } from "../../types/formula";

export function lexFormula(input: string): FormulaToken[] {
  const tokens: FormulaToken[] = [];
  const len = input.length;
  let i = 0;

  while (i < len) {
    const ch = input[i];

    // Whitespace
    if (ch === " " || ch === "\t") { i++; continue; }

    // Number
    if ((ch >= "0" && ch <= "9") || (ch === "." && i + 1 < len && input[i + 1] >= "0" && input[i + 1] <= "9")) {
      const pos = i;
      while (i < len && ((input[i] >= "0" && input[i] <= "9") || input[i] === ".")) i++;
      if (i < len && (input[i] === "e" || input[i] === "E")) {
        i++;
        if (i < len && (input[i] === "+" || input[i] === "-")) i++;
        while (i < len && input[i] >= "0" && input[i] <= "9") i++;
      }
      tokens.push({ type: "number", value: input.slice(pos, i), position: pos });
      continue;
    }

    // String
    if (ch === '"') {
      const pos = i;
      i++;
      while (i < len && input[i] !== '"') {
        if (input[i] === "\\") i++;
        i++;
      }
      i++; // closing quote
      tokens.push({ type: "string", value: input.slice(pos + 1, i - 1), position: pos });
      continue;
    }

    // Identifier (cell ref, range ref, function name, or boolean)
    if ((ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z") || ch === "_") {
      const pos = i;
      i++;
      while (i < len && ((input[i] >= "A" && input[i] <= "Z") || (input[i] >= "a" && input[i] <= "z") || (input[i] >= "0" && input[i] <= "9") || input[i] === "_")) i++;
      const word = input.slice(pos, i);

      // Boolean
      if (word.toUpperCase() === "TRUE" || word.toUpperCase() === "FALSE") {
        tokens.push({ type: "boolean", value: word.toUpperCase(), position: pos });
        continue;
      }

      // Check for range ref: CELLREF:CELLREF
      if (i < len && input[i] === ":") {
        const colonPos = i;
        i++;
        const rangeStart = i;
        while (i < len && ((input[i] >= "A" && input[i] <= "Z") || (input[i] >= "a" && input[i] <= "z") || (input[i] >= "0" && input[i] <= "9"))) i++;
        if (i > rangeStart) {
          tokens.push({ type: "rangeRef", value: word + ":" + input.slice(rangeStart, i), position: pos });
          continue;
        }
        // Not a range, backtrack
        i = colonPos;
      }

      // Check if it's a function call (followed by parenthesis)
      let j = i;
      while (j < len && input[j] === " ") j++;
      if (j < len && input[j] === "(") {
        tokens.push({ type: "function", value: word.toUpperCase(), position: pos });
        continue;
      }

      // Cell reference (letters + digits)
      if (/^[A-Z]+\d+$/i.test(word)) {
        tokens.push({ type: "cellRef", value: word.toUpperCase(), position: pos });
        continue;
      }

      // Unknown identifier — treat as cell ref
      tokens.push({ type: "cellRef", value: word.toUpperCase(), position: pos });
      continue;
    }

    // Operators
    if (ch === "+" || ch === "-" || ch === "*" || ch === "/" || ch === "^" || ch === "&") {
      tokens.push({ type: "operator", value: ch, position: i });
      i++;
      continue;
    }

    // Comparison operators
    if (ch === "=" || ch === "<" || ch === ">") {
      const pos = i;
      i++;
      if (i < len && (input[i] === "=" || input[i] === ">")) i++;
      tokens.push({ type: "operator", value: input.slice(pos, i), position: pos });
      continue;
    }

    // Parentheses
    if (ch === "(" || ch === ")") {
      tokens.push({ type: "paren", value: ch, position: i });
      i++;
      continue;
    }

    // Comma
    if (ch === ",") {
      tokens.push({ type: "comma", value: ",", position: i });
      i++;
      continue;
    }

    // Skip unknown
    i++;
  }

  return tokens;
}
