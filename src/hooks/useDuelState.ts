"use client";

/**
 * Polls GET /api/v1/duels/{id}/state (Phase G4.1 live duel room).
 *
 * - Polls every `intervalMs` (min 1000ms — never spam the backend).
 * - Stops automatically once the duel is completed/expired/cancelled.
 * - Keeps the last good state on transient network errors; only a fatal
 *   authorization/not-found error surfaces as `fatalError`.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { DuelState, V1ApiError, getDuelState } from "@/lib/v1Api";

const TERMINAL: ReadonlyArray<string> = ["completed", "expired", "cancelled"];

export interface UseDuelStateResult {
  state: DuelState | null;
  fatalError: string | null;
  transientError: string | null;
  refresh: () => Promise<DuelState | null>;
  /** Replace local state immediately (e.g. from a ready/submit response). */
  applyState: (next: DuelState) => void;
}

export function useDuelState(
  duelId: string | null,
  handle: string | undefined,
  intervalMs = 1500
): UseDuelStateResult {
  const [state, setState] = useState<DuelState | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [transientError, setTransientError] = useState<string | null>(null);
  const stopped = useRef(false);

  const refresh = useCallback(async (): Promise<DuelState | null> => {
    if (!duelId) return null;
    try {
      const next = await getDuelState(duelId, handle);
      setState(next);
      setTransientError(null);
      setFatalError(null);
      if (TERMINAL.includes(next.status)) stopped.current = true;
      return next;
    } catch (e) {
      if (e instanceof V1ApiError && (e.status === 403 || e.status === 404 || e.status === 401)) {
        setFatalError(e.message);
        stopped.current = true;
      } else {
        setTransientError(e instanceof Error ? e.message : "Network error");
      }
      return null;
    }
  }, [duelId, handle]);

  const applyState = useCallback((next: DuelState) => {
    setState(next);
    if (TERMINAL.includes(next.status)) stopped.current = true;
  }, []);

  useEffect(() => {
    stopped.current = false;
    if (!duelId) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled || stopped.current) return;
      void refresh();
    };
    tick();
    const timer = setInterval(tick, Math.max(1000, intervalMs));
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [duelId, refresh, intervalMs]);

  return { state, fatalError, transientError, refresh, applyState };
}
