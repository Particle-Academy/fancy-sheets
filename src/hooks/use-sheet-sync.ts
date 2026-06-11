import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkbookData } from "../types";
import type { SheetOp } from "../types/op";
import { reduceWorkbook } from "./use-sheet-state";

/** Where the sync loop currently is. Render a save-status pill straight from this. */
export type SheetSyncStatus = "idle" | "saving" | "agent-active" | "error";

/**
 * Transport seam — supply your own persist + op channel for non-Laravel/Echo
 * stacks. When `persist` is omitted, {@link useSheetSync} uses a built-in `fetch`
 * PUT to `persistUrl` (no live channel).
 */
export interface SheetSyncTransport {
  /**
   * Persist the full workbook. Reject to surface the `"error"` status.
   * **Optional** — omit it (provide only `subscribe`) and the built-in
   * `persistUrl` PUT is used, so a Laravel/Echo consumer drops to a one-line
   * `subscribe`.
   */
  persist?: (workbook: WorkbookData) => Promise<void>;
  /**
   * Subscribe to a remote op channel. Invoke `onOp` for each incoming op; return
   * an unsubscribe function. Omit to skip live updates.
   */
  subscribe?: (onOp: (op: SheetOp) => void) => () => void;
}

export interface UseSheetSyncOptions {
  /** Initial workbook (e.g. the Inertia/loader-provided document). */
  initial: WorkbookData;
  /** Debounce window for the full-workbook persist after edits. Default 600ms. */
  debounceMs?: number;
  /**
   * A transport seam. Provide `persist` to override saving and/or `subscribe`
   * for live ops. Omit `persist` (subscribe-only) to keep the built-in
   * `persistUrl` save — so `transport.subscribe` and `persistUrl` coexist.
   */
  transport?: SheetSyncTransport;
  /** Laravel/Inertia convenience — PUT `{ workbook }` as JSON here. Used whenever `transport.persist` is omitted. */
  persistUrl?: string;
  /** Header carrying the CSRF token for `persistUrl`. Default `"X-XSRF-TOKEN"`. */
  csrfHeader?: string;
  /** CSRF token value. When omitted, read from the `XSRF-TOKEN` cookie. */
  csrfToken?: string;
  /** Notified whenever an op is applied — `source` distinguishes local edits from remote ops. */
  onOp?: (op: SheetOp, source: "local" | "remote") => void;
}

export interface SheetSyncApi {
  /** The live workbook — feed to `<SheetWorkbook data={workbook} onChange={setWorkbook} />`. */
  workbook: WorkbookData;
  /** Apply a single op locally and debounce a save. */
  applyOp: (op: SheetOp) => void;
  /** Replace the whole workbook and debounce a save. Wire to `SheetWorkbook`'s `onChange`. */
  setWorkbook: (workbook: WorkbookData) => void;
  /** `idle` | `saving` | `agent-active` | `error`. */
  status: SheetSyncStatus;
  /** Persist now, cancelling the pending debounce (e.g. on `Cmd+S` or before navigating away). */
  flush: () => void;
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.split("; ").find((c) => c.startsWith(name + "="));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

/**
 * The integration glue every live fancy-sheets consumer otherwise hand-writes:
 * controlled workbook state, debounced full-workbook persist after direct edits,
 * optional remote op-channel subscription with replay, and a save-status
 * indicator — behind one hook. The spreadsheet parallel of fancy-slides'
 * `useDeckSync`.
 *
 * ```tsx
 * const { workbook, applyOp, setWorkbook, status } = useSheetSync({
 *   initial: document.workbook,
 *   persistUrl: `/workbooks/${id}`,                  // built-in Laravel PUT { workbook }
 *   transport: { subscribe: (onOp) => echo.private(`workbook.${id}`).listen('.workbook.op', (e) => onOp(e.op)) },
 * });
 * <SheetWorkbook data={workbook} onChange={setWorkbook} />
 * ```
 */
export function useSheetSync(options: UseSheetSyncOptions): SheetSyncApi {
  const { initial, debounceMs = 600, transport, persistUrl, csrfHeader = "X-XSRF-TOKEN", csrfToken, onOp } = options;

  const [workbook, setWorkbookState] = useState<WorkbookData>(initial);
  const [status, setStatus] = useState<SheetSyncStatus>("idle");

  // Latest workbook, persist timer, and an "agent-active" decay timer — in refs
  // so callbacks stay stable and the persist always sees the freshest workbook.
  const workbookRef = useRef(workbook);
  workbookRef.current = workbook;
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const agentTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Stable refs to the option callbacks so the effect/handlers don't churn.
  const cfg = useRef({ transport, persistUrl, csrfHeader, csrfToken, onOp });
  cfg.current = { transport, persistUrl, csrfHeader, csrfToken, onOp };

  const doPersist = useCallback(async () => {
    const { transport: t, persistUrl: url, csrfHeader: header, csrfToken: token } = cfg.current;
    const current = workbookRef.current;
    setStatus("saving");
    try {
      if (t?.persist) {
        await t.persist(current);
      } else if (url) {
        const xsrf = token ?? readCookie("XSRF-TOKEN");
        const res = await fetch(url, {
          method: "PUT",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(xsrf ? { [header]: xsrf } : {}),
          },
          body: JSON.stringify({ workbook: current }),
        });
        if (!res.ok) throw new Error(`persist failed: ${res.status}`);
      }
      // Don't clobber an "agent-active" badge that arrived mid-save.
      setStatus((s) => (s === "agent-active" ? s : "idle"));
    } catch {
      setStatus("error");
    }
  }, []);

  const schedule = useCallback(() => {
    setStatus((s) => (s === "agent-active" ? s : "saving"));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void doPersist(), debounceMs);
  }, [debounceMs, doPersist]);

  const flush = useCallback(() => {
    clearTimeout(saveTimer.current);
    void doPersist();
  }, [doPersist]);

  const applyOp = useCallback(
    (op: SheetOp) => {
      setWorkbookState((w) => reduceWorkbook(w, op));
      cfg.current.onOp?.(op, "local");
      schedule();
    },
    [schedule],
  );

  const setWorkbook = useCallback(
    (next: WorkbookData) => {
      setWorkbookState(next);
      schedule();
    },
    [schedule],
  );

  // Subscribe to the remote op channel: apply incoming ops + flag agent activity.
  useEffect(() => {
    const t = cfg.current.transport;
    if (!t?.subscribe) return;
    const unsub = t.subscribe((op) => {
      setWorkbookState((w) => reduceWorkbook(w, op));
      cfg.current.onOp?.(op, "remote");
      setStatus("agent-active");
      clearTimeout(agentTimer.current);
      agentTimer.current = setTimeout(() => setStatus("idle"), 1500);
    });
    return () => {
      unsub?.();
    };
    // transport identity is captured via cfg.current; resubscribe only when the
    // transport reference itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transport]);

  // Flush any pending save on unmount.
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        void doPersist();
      }
      clearTimeout(agentTimer.current);
    };
  }, [doPersist]);

  return { workbook, applyOp, setWorkbook, status, flush };
}
