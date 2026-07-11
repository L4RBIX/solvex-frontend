"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { getAuthMe, type AuthUser, V1ApiError } from "@/lib/v1Api";
import {
  authRedirectUrl,
  getSupabaseClient,
  hasPasswordRecoveryMarker,
  markPasswordRecovery,
  safeNextPath,
  setCurrentAccessToken,
} from "@/lib/supabaseClient";

export type AuthStatus = "loading" | "signed_out" | "signed_in";

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
  busy: boolean;
  signIn: () => Promise<AuthUser | null>;
  signInWithPassword: (email: string, password: string) => Promise<AuthUser | null>;
  signUpWithPassword: (email: string, password: string) => Promise<{ confirmationRequired: boolean }>;
  signInWithGoogle: (nextPath?: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  recoverySession: boolean;
  refresh: () => Promise<AuthUser | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function messageFor(error: unknown, fallback: string): string {
  if (error instanceof V1ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [recoverySession, setRecoverySession] = useState(false);
  const requestSequence = useRef(0);

  const syncBackend = useCallback(async (session: Session | null): Promise<AuthUser | null> => {
    const requestId = ++requestSequence.current;
    setUser(null);
    if (!session) {
      setCurrentAccessToken("");
      setStatus("signed_out");
      return null;
    }
    setCurrentAccessToken(session.access_token);
    setStatus("loading");
    try {
      const me = await getAuthMe();
      if (requestSequence.current !== requestId) return null;
      setUser(me);
      setStatus("signed_in");
      setError(null);
      return me;
    } catch (caught) {
      if (requestSequence.current !== requestId) return null;
      setUser(null);
      setStatus("signed_out");
      setError(messageFor(caught, "Could not validate this SolveX account."));
      return null;
    }
  }, []);

  const refresh = useCallback(async (): Promise<AuthUser | null> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatus("signed_out");
      setError("Authentication is not configured for this deployment.");
      return null;
    }
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      setError("Could not restore your session. Please sign in again.");
      return syncBackend(null);
    }
    return syncBackend(data.session);
  }, [syncBackend]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatus("signed_out");
      setError("Authentication is not configured for this deployment.");
      return;
    }
    setRecoverySession(hasPasswordRecoveryMarker());
    void refresh();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentAccessToken(session?.access_token);
      if (event === "PASSWORD_RECOVERY") {
        markPasswordRecovery(true);
        setRecoverySession(true);
      }
      // Keep the Supabase callback short; backend synchronization runs after
      // the auth client has released its internal state-change lock.
      queueMicrotask(() => void syncBackend(session));
    });
    return () => {
      requestSequence.current += 1;
      data.subscription.unsubscribe();
    };
  }, [refresh, syncBackend]);

  const signIn = useCallback(async (): Promise<AuthUser | null> => {
    if (typeof window !== "undefined") {
      const next = safeNextPath(`${window.location.pathname}${window.location.search}`);
      window.location.assign(`/auth?next=${encodeURIComponent(next)}`);
    }
    return null;
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Authentication is not configured for this deployment.");
    setBusy(true);
    setError(null);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      return await syncBackend(data.session);
    } catch (caught) {
      setError(messageFor(caught, "Sign in failed."));
      throw caught;
    } finally {
      setBusy(false);
    }
  }, [syncBackend]);

  const signUpWithPassword = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Authentication is not configured for this deployment.");
    setBusy(true);
    setError(null);
    try {
      const callback = authRedirectUrl("/auth/callback?next=/analyze");
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callback },
      });
      if (signUpError) throw signUpError;
      if (data.session) await syncBackend(data.session);
      return { confirmationRequired: !data.session };
    } catch (caught) {
      setError(messageFor(caught, "Sign up failed."));
      throw caught;
    } finally {
      setBusy(false);
    }
  }, [syncBackend]);

  const signInWithGoogle = useCallback(async (nextPath = "/analyze") => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Authentication is not configured for this deployment.");
    const next = safeNextPath(nextPath);
    const redirectTo = authRedirectUrl(`/auth/callback?next=${encodeURIComponent(next)}`);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (oauthError) {
      setError("Could not start Google sign in.");
      throw oauthError;
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Authentication is not configured for this deployment.");
    // Always use the same UI confirmation, regardless of whether the address exists.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectUrl("/auth/callback?next=/auth/reset-password"),
    });
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase || !hasPasswordRecoveryMarker()) {
      throw new Error("Open a valid password recovery link before setting a new password.");
    }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) throw updateError;
    markPasswordRecovery(false);
    setRecoverySession(false);
  }, []);

  const signOut = useCallback(async () => {
    requestSequence.current += 1;
    setCurrentAccessToken("");
    setUser(null);
    setStatus("signed_out");
    setError(null);
    markPasswordRecovery(false);
    setRecoverySession(false);
    const supabase = getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user,
    error,
    busy,
    signIn,
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
    requestPasswordReset,
    updatePassword,
    recoverySession,
    refresh,
    signOut,
  }), [
    status, user, error, busy, signIn, signInWithPassword, signUpWithPassword,
    signInWithGoogle, requestPasswordReset, updatePassword, recoverySession, refresh, signOut,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
