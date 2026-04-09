export interface HistoryStack<T> {
  past: T[];
  future: T[];
}

export function createHistory<T>(): HistoryStack<T> {
  return { past: [], future: [] };
}

export function pushState<T>(stack: HistoryStack<T>, state: T, maxSize: number = 50): HistoryStack<T> {
  const past = [...stack.past, state];
  if (past.length > maxSize) past.shift();
  return { past, future: [] };
}

export function undo<T>(stack: HistoryStack<T>, current: T): { stack: HistoryStack<T>; state: T } | null {
  if (stack.past.length === 0) return null;
  const prev = stack.past[stack.past.length - 1];
  return {
    stack: {
      past: stack.past.slice(0, -1),
      future: [current, ...stack.future],
    },
    state: prev,
  };
}

export function redo<T>(stack: HistoryStack<T>, current: T): { stack: HistoryStack<T>; state: T } | null {
  if (stack.future.length === 0) return null;
  const next = stack.future[0];
  return {
    stack: {
      past: [...stack.past, current],
      future: stack.future.slice(1),
    },
    state: next,
  };
}
