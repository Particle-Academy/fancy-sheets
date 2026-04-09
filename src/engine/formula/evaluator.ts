import type { FormulaASTNode } from "../../types/formula";
import type { CellValue } from "../../types/cell";
import { getFunction } from "./functions/registry";
import { parseAddress, toAddress } from "../cell-utils";

// Import side-effect function registrations
import "./functions/math";
import "./functions/text";
import "./functions/logic";

export type CellValueGetter = (address: string) => CellValue;
export type RangeValueGetter = (start: string, end: string) => CellValue[];

export function evaluateAST(
  node: FormulaASTNode,
  getCellValue: CellValueGetter,
  getRangeValues: RangeValueGetter,
): CellValue {
  switch (node.type) {
    case "number":
      return node.value;
    case "string":
      return node.value;
    case "boolean":
      return node.value;

    case "cellRef":
      return getCellValue(node.address);

    case "rangeRef":
      // Ranges by themselves return the first value (used in non-function context)
      const vals = getRangeValues(node.start, node.end);
      return vals[0] ?? null;

    case "functionCall": {
      const entry = getFunction(node.name);
      if (!entry) return `#NAME?`;

      // Evaluate args — range refs pass as arrays, everything else as single-element arrays
      const argValues: CellValue[][] = node.args.map((arg) => {
        if (arg.type === "rangeRef") {
          return getRangeValues(arg.start, arg.end);
        }
        const val = evaluateAST(arg, getCellValue, getRangeValues);
        return [val];
      });

      try {
        return entry.fn(argValues);
      } catch {
        return "#ERROR!";
      }
    }

    case "binaryOp": {
      const left = evaluateAST(node.left, getCellValue, getRangeValues);
      const right = evaluateAST(node.right, getCellValue, getRangeValues);

      const lNum = typeof left === "number" ? left : Number(left);
      const rNum = typeof right === "number" ? right : Number(right);

      switch (node.operator) {
        case "+": return (isNaN(lNum) || isNaN(rNum)) ? "#VALUE!" : lNum + rNum;
        case "-": return (isNaN(lNum) || isNaN(rNum)) ? "#VALUE!" : lNum - rNum;
        case "*": return (isNaN(lNum) || isNaN(rNum)) ? "#VALUE!" : lNum * rNum;
        case "/": return rNum === 0 ? "#DIV/0!" : (isNaN(lNum) || isNaN(rNum)) ? "#VALUE!" : lNum / rNum;
        case "^": return (isNaN(lNum) || isNaN(rNum)) ? "#VALUE!" : Math.pow(lNum, rNum);
        case "&": return String(left ?? "") + String(right ?? "");
        case "=": return left === right;
        case "<>": return left !== right;
        case "<": return lNum < rNum;
        case ">": return lNum > rNum;
        case "<=": return lNum <= rNum;
        case ">=": return lNum >= rNum;
        default: return "#ERROR!";
      }
    }

    case "unaryOp": {
      const operand = evaluateAST(node.operand, getCellValue, getRangeValues);
      const num = typeof operand === "number" ? operand : Number(operand);
      if (isNaN(num)) return "#VALUE!";
      return node.operator === "-" ? -num : num;
    }

    default:
      return "#ERROR!";
  }
}
