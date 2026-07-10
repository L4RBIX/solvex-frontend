"use client";

/**
 * SolveX account session (security hotfix).
 *
 * A Codeforces handle is public data and is never trusted as identity by
 * itself — this hook is the single source of truth for "am I signed in",
 * and it always confirms via a real backend call (getAuthMe) rather than
 * just checking whether localStorage has a token. An invalid/expired token
 * is cleared, not trusted.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AUTH_TOKEN_CHANGED_EVENT,
  AuthUser,
  V1ApiError,
  ensureAuthToken,
  getApiToken,
  getAuthMe,
  setApiToken,
} from "@/lib/v1Api";

export type AuthStatus = "loading" | "signed_out" | "signed_in";

export interface UseAuthResult {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
  busy: boolean;
  /** Explicit user action (e.g. a "Sign in" button) — mints a fresh account
   * token if none exists yet. Never called silently on page load. */
  signIn: () => Promise<AuthUser | null>;
  refresh: () => Promise<AuthUser | null>;
  signOut: () => void;
}

export function useAuth(): UseAuthResult {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const requestSequence = useRef(0);

  const refresh = useCallback(async (): Promise<AuthUser | null> => {
    const requestId = ++requestSequence.current;
    const token = getApiToken();
    // Hide any cached private account state before validating the current
    // token. This prevents account A's data lingering while a sibling
    // component replaces the token with account B's.
    setUser(null);
    if (!token) {
      setStatus("signed_out");
      return null;
    }
    setStatus("loading");
    try {
      const me = await getAuthMe();
      if (requestSequence.current !== requestId || getApiToken() !== token) return null;
      setUser(me);
      setStatus("signed_in");
      return me;
    } catch (e) {
      if (requestSequence.current !== requestId || getApiToken() !== token) return null;
      // Never trust a stale/invalid token as identity — drop it.
      if (e instanceof V1ApiError && (e.status === 401 || e.status === 403)) {
        setApiToken("");
      }
      setUser(null);
      setStatus("signed_out");
      return null;
    }
  }, []);

  useEffect(() => {
    const syncCurrentToken = () => {
      void refresh();
    };
    const syncOtherTab = (event: StorageEvent) => {
      if (event.key === "solvex_api_token") syncCurrentToken();
    };

    window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, syncCurrentToken);
    window.addEventListener("storage", syncOtherTab);
    void refresh();
    return () => {
      requestSequence.current += 1;
      window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, syncCurrentToken);
      window.removeEventListener("storage", syncOtherTab);
    };
  }, [refresh]);

  const signIn = useCallback(async (): Promise<AuthUser | null> => {
    setError(null);
    setBusy(true);
    try {
      await ensureAuthToken();
      let me = await refresh();
      // A stale local token is cleared by refresh(). Complete the explicit
      // sign-in action in one click by creating a replacement account.
      if (!me && !getApiToken()) {
        await ensureAuthToken();
        me = await refresh();
      }
      if (!me) setError("Could not validate this account token — check your connection.");
      return me;
    } catch (e) {
      setError(e instanceof V1ApiError ? e.message : "Could not sign in — check your connection.");
      return null;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const signOut = useCallback(() => {
    setApiToken("");
    setUser(null);
    setStatus("signed_out");
  }, []);

  return { status, user, error, busy, signIn, refresh, signOut };
}
