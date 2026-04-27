import type { FormulaToken, FormulaASTNode } from "../../types/formula";

/**
 * Hard cap on parser recursion depth. Prevents stack overflow / tab freeze
 * from deeply nested formulas like `=((((((1))))))` x N. 64 is generous —
 * legitimate formulas rarely nest beyond ~20.
 */
const MAX_DEPTH = 64;

/**
 * Recursive descent parser for spreadsheet formulas.
 * Operator precedence (low to high):
 *   1. Comparison: =, <>, <, >, <=, >=
 *   2. String concatenation: &
 *   3. Addition/subtraction: +, -
 *   4. Multiplication/division: *, /
 *   5. Exponentiation: ^
 *   6. Unary: -, +
 *   7. Atoms: number, string, boolean, cellRef, rangeRef, function call, (expr)
 */
export function parseFormula(tokens: FormulaToken[]): FormulaASTNode {
  let pos = 0;

  function peek(): FormulaToken | undefined {
    return tokens[pos];
  }

  function advance(): FormulaToken {
    return tokens[pos++];
  }

  function expect(type: string, value?: string): FormulaToken {
    const t = advance();
    if (!t || t.type !== type || (value !== undefined && t.value !== value)) {
      throw new Error(`Expected ${type}${value ? ` '${value}'` : ""} at position ${t?.position ?? pos}`);
    }
    return t;
  }

  function checkDepth(depth: number): void {
    if (depth > MAX_DEPTH) {
      throw new Error(`Formula nested too deep (max ${MAX_DEPTH} levels)`);
    }
  }

  // Precedence levels — every level threads `depth` so we can cap recursion.
  function parseExpression(depth = 0): FormulaASTNode {
    checkDepth(depth);
    return parseComparison(depth + 1);
  }

  function parseComparison(depth: number): FormulaASTNode {
    let left = parseConcatenation(depth + 1);
    while (peek() && peek()!.type === "operator" && ["=", "<>", "<", ">", "<=", ">="].includes(peek()!.value)) {
      const op = advance().value;
      const right = parseConcatenation(depth + 1);
      left = { type: "binaryOp", operator: op, left, right };
    }
    return left;
  }

  function parseConcatenation(depth: number): FormulaASTNode {
    checkDepth(depth);
    let left = parseAddition(depth + 1);
    while (peek() && peek()!.type === "operator" && peek()!.value === "&") {
      advance();
      const right = parseAddition(depth + 1);
      left = { type: "binaryOp", operator: "&", left, right };
    }
    return left;
  }

  function parseAddition(depth: number): FormulaASTNode {
    checkDepth(depth);
    let left = parseMultiplication(depth + 1);
    while (peek() && peek()!.type === "operator" && (peek()!.value === "+" || peek()!.value === "-")) {
      const op = advance().value;
      const right = parseMultiplication(depth + 1);
      left = { type: "binaryOp", operator: op, left, right };
    }
    return left;
  }

  function parseMultiplication(depth: number): FormulaASTNode {
    checkDepth(depth);
    let left = parseExponentiation(depth + 1);
    while (peek() && peek()!.type === "operator" && (peek()!.value === "*" || peek()!.value === "/")) {
      const op = advance().value;
      const right = parseExponentiation(depth + 1);
      left = { type: "binaryOp", operator: op, left, right };
    }
    return left;
  }

  function parseExponentiation(depth: number): FormulaASTNode {
    checkDepth(depth);
    let left = parseUnary(depth + 1);
    while (peek() && peek()!.type === "operator" && peek()!.value === "^") {
      advance();
      const right = parseUnary(depth + 1);
      left = { type: "binaryOp", operator: "^", left, right };
    }
    return left;
  }

  function parseUnary(depth: number): FormulaASTNode {
    checkDepth(depth);
    if (peek() && peek()!.type === "operator" && (peek()!.value === "-" || peek()!.value === "+")) {
      const op = advance().value;
      const operand = parseUnary(depth + 1);
      return { type: "unaryOp", operator: op, operand };
    }
    return parseAtom(depth + 1);
  }

  function parseAtom(depth: number): FormulaASTNode {
    checkDepth(depth);
    const t = peek();
    if (!t) throw new Error("Unexpected end of formula");

    // Number
    if (t.type === "number") {
      advance();
      return { type: "number", value: parseFloat(t.value) };
    }

    // String
    if (t.type === "string") {
      advance();
      return { type: "string", value: t.value };
    }

    // Boolean
    if (t.type === "boolean") {
      advance();
      return { type: "boolean", value: t.value === "TRUE" };
    }

    // Range reference (A1:B5)
    if (t.type === "rangeRef") {
      advance();
      const parts = t.value.split(":");
      return { type: "rangeRef", start: parts[0], end: parts[1] };
    }

    // Cross-sheet cell reference (Sheet1!A1)
    if (t.type === "sheetCellRef") {
      advance();
      const bangIdx = t.value.indexOf("!");
      return { type: "sheetCellRef", sheet: t.value.slice(0, bangIdx), address: t.value.slice(bangIdx + 1).toUpperCase() };
    }

    // Cross-sheet range reference (Sheet1!A1:B5)
    if (t.type === "sheetRangeRef") {
      advance();
      const bangIdx = t.value.indexOf("!");
      const sheetName = t.value.slice(0, bangIdx);
      const rangePart = t.value.slice(bangIdx + 1);
      const parts = rangePart.split(":");
      return { type: "sheetRangeRef", sheet: sheetName, start: parts[0].toUpperCase(), end: parts[1].toUpperCase() };
    }

    // Function call
    if (t.type === "function") {
      const name = advance().value;
      expect("paren", "(");
      const args: FormulaASTNode[] = [];
      if (peek() && !(peek()!.type === "paren" && peek()!.value === ")")) {
        args.push(parseExpression(depth + 1));
        while (peek() && peek()!.type === "comma") {
          advance();
          args.push(parseExpression(depth + 1));
        }
      }
      expect("paren", ")");
      return { type: "functionCall", name, args };
    }

    // Cell reference
    if (t.type === "cellRef") {
      advance();
      return { type: "cellRef", address: t.value };
    }

    // Parenthesized expression
    if (t.type === "paren" && t.value === "(") {
      advance();
      const expr = parseExpression(depth + 1);
      expect("paren", ")");
      return expr;
    }

    throw new Error(`Unexpected token '${t.value}' at position ${t.position}`);
  }

  const ast = parseExpression(0);
  return ast;
}
