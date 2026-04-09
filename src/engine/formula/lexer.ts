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

    // Identifier (cell ref, range ref, sheet ref, function name, or boolean)
    if ((ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z") || ch === "_") {
      const pos = i;
      i++;
      // Allow spaces in sheet names when followed by !
      while (i < len && ((input[i] >= "A" && input[i] <= "Z") || (input[i] >= "a" && input[i] <= "z") || (input[i] >= "0" && input[i] <= "9") || input[i] === "_" || input[i] === " ")) {
        // Only allow spaces if they're part of a sheet name (followed eventually by !)
        if (input[i] === " ") {
          let lookAhead = i + 1;
          while (lookAhead < len && input[lookAhead] === " ") lookAhead++;
          // Check if after the spaces there's more identifier chars followed by !
          if (lookAhead < len && ((input[lookAhead] >= "A" && input[lookAhead] <= "Z") || (input[lookAhead] >= "a" && input[lookAhead] <= "z") || (input[lookAhead] >= "0" && input[lookAhead] <= "9") || input[lookAhead] === "!")) {
            i++;
            continue;
          }
          break;
        }
        i++;
      }
      let word = input.slice(pos, i).trimEnd();
      i = pos + word.length;

      // Boolean
      if (word.toUpperCase() === "TRUE" || word.toUpperCase() === "FALSE") {
        tokens.push({ type: "boolean", value: word.toUpperCase(), position: pos });
        continue;
      }

      // Cross-sheet reference: SheetName!CellRef or SheetName!Range
      if (i < len && input[i] === "!") {
        const sheetName = word;
        i++; // skip !
        const refStart = i;
        while (i < len && ((input[i] >= "A" && input[i] <= "Z") || (input[i] >= "a" && input[i] <= "z") || (input[i] >= "0" && input[i] <= "9"))) i++;
        const ref1 = input.slice(refStart, i);

        if (i < len && input[i] === ":") {
          // Sheet range ref: Sheet1!A1:B5
          i++;
          const ref2Start = i;
          while (i < len && ((input[i] >= "A" && input[i] <= "Z") || (input[i] >= "a" && input[i] <= "z") || (input[i] >= "0" && input[i] <= "9"))) i++;
          const ref2 = input.slice(ref2Start, i);
          tokens.push({ type: "sheetRangeRef", value: sheetName + "!" + ref1 + ":" + ref2, position: pos });
        } else {
          // Sheet cell ref: Sheet1!A1
          tokens.push({ type: "sheetCellRef", value: sheetName + "!" + ref1.toUpperCase(), position: pos });
        }
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
