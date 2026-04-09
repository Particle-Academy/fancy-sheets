import { parseAddress, toAddress } from "../cell-utils";
import type { FormulaASTNode } from "../../types/formula";

/** Extract all cell references from an AST node */
export function extractReferences(node: FormulaASTNode): string[] {
  const refs: string[] = [];

  function walk(n: FormulaASTNode): void {
    switch (n.type) {
      case "cellRef":
        refs.push(n.address);
        break;
      case "rangeRef": {
        const s = parseAddress(n.start);
        const e = parseAddress(n.end);
        const minRow = Math.min(s.row, e.row);
        const maxRow = Math.max(s.row, e.row);
        const minCol = Math.min(s.col, e.col);
        const maxCol = Math.max(s.col, e.col);
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            refs.push(toAddress(r, c));
          }
        }
        break;
      }
      case "functionCall":
        n.args.forEach(walk);
        break;
      case "binaryOp":
        walk(n.left);
        walk(n.right);
        break;
      case "unaryOp":
        walk(n.operand);
        break;
    }
  }

  walk(node);
  return refs;
}
