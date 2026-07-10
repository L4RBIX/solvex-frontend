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
import { DuelState, V1ApiError, getApiToken, getDuelState } from "@/lib/v1Api";

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
  intervalMs = 1500,
  identityKey: string | null = null
): UseDuelStateResult {
  const [state, setState] = useState<DuelState | null>(null);
  const [stateKey, setStateKey] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [transientError, setTransientError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const stopped = useRef(false);
  const requestKey = duelId && identityKey ? `${identityKey}:${duelId}` : null;

  const refresh = useCallback(async (): Promise<DuelState | null> => {
    const requestedKey = requestKey;
    const requestedToken = getApiToken();
    if (!duelId || !requestedKey) return null;
    try {
      const next = await getDuelState(duelId);
      if (getApiToken() !== requestedToken) return null;
      setState(next);
      setStateKey(requestedKey);
      setTransientError(null);
      setFatalError(null);
      setErrorKey(requestedKey);
      if (TERMINAL.includes(next.status)) stopped.current = true;
      return next;
    } catch (e) {
      if (getApiToken() !== requestedToken) return null;
      if (e instanceof V1ApiError && (e.status === 403 || e.status === 404 || e.status === 401)) {
        setFatalError(e.message);
        setErrorKey(requestedKey);
        stopped.current = true;
      } else {
        setTransientError(e instanceof Error ? e.message : "Network error");
        setErrorKey(requestedKey);
      }
      return null;
    }
  }, [duelId, requestKey]);

  const applyState = useCallback((next: DuelState) => {
    const key = requestKey;
    if (!key) return;
    setState(next);
    setStateKey(key);
    if (TERMINAL.includes(next.status)) stopped.current = true;
  }, [requestKey]);

  useEffect(() => {
    stopped.current = false;
    if (!requestKey) return;
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
  }, [requestKey, refresh, intervalMs]);

  return {
    state: stateKey === requestKey ? state : null,
    fatalError: errorKey === requestKey ? fatalError : null,
    transientError: errorKey === requestKey ? transientError : null,
    refresh,
    applyState,
  };
}
