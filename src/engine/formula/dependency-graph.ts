import type { CellMap } from "../../types/sheet";
import { lexFormula } from "./lexer";
import { parseFormula } from "./parser";
import { extractReferences } from "./references";

/** Build a dependency graph: cell -> cells it depends on */
export function buildDependencyGraph(cells: CellMap): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  for (const [addr, cell] of Object.entries(cells)) {
    if (!cell.formula) continue;
    try {
      const tokens = lexFormula(cell.formula);
      const ast = parseFormula(tokens);
      const refs = extractReferences(ast);
      graph.set(addr, new Set(refs));
    } catch {
      graph.set(addr, new Set());
    }
  }

  return graph;
}

/** Detect circular references using DFS */
export function detectCircularRefs(graph: Map<string, Set<string>>): Set<string> {
  const circular = new Set<string>();
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(node: string): boolean {
    if (inStack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    inStack.add(node);

    const deps = graph.get(node);
    if (deps) {
      for (const dep of deps) {
        if (dfs(dep)) {
          circular.add(node);
          return true;
        }
      }
    }

    inStack.delete(node);
    return false;
  }

  for (const node of graph.keys()) {
    dfs(node);
  }

  return circular;
}

/** Get cells that need recalculation in topological order */
export function getRecalculationOrder(graph: Map<string, Set<string>>): string[] {
  const visited = new Set<string>();
  const order: string[] = [];

  function visit(node: string): void {
    if (visited.has(node)) return;
    visited.add(node);

    const deps = graph.get(node);
    if (deps) {
      for (const dep of deps) {
        visit(dep);
      }
    }

    order.push(node);
  }

  for (const node of graph.keys()) {
    visit(node);
  }

  return order;
}
