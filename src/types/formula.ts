export type FormulaTokenType =
  | "number"
  | "string"
  | "cellRef"
  | "rangeRef"
  | "function"
  | "operator"
  | "paren"
  | "comma"
  | "boolean";

export interface FormulaToken {
  type: FormulaTokenType;
  value: string;
  position: number;
}

export type FormulaASTNode =
  | { type: "number"; value: number }
  | { type: "string"; value: string }
  | { type: "boolean"; value: boolean }
  | { type: "cellRef"; address: string }
  | { type: "rangeRef"; start: string; end: string }
  | { type: "functionCall"; name: string; args: FormulaASTNode[] }
  | { type: "binaryOp"; operator: string; left: FormulaASTNode; right: FormulaASTNode }
  | { type: "unaryOp"; operator: string; operand: FormulaASTNode };
