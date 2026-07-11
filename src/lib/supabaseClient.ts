"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;
let currentAccessToken = "";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}

export function getSupabaseClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    client = null;
    return null;
  }
  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
  });
  return client;
}

export function setCurrentAccessToken(token: string | null | undefined): void {
  currentAccessToken = token?.trim() ?? "";
}

export function getCurrentAccessToken(): string {
  return currentAccessToken;
}

export async function getAccessToken(): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) return "";
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    setCurrentAccessToken("");
    return "";
  }
  setCurrentAccessToken(data.session.access_token);
  return data.session.access_token;
}

export async function refreshAccessToken(): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) return "";
  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session) {
    setCurrentAccessToken("");
    return "";
  }
  setCurrentAccessToken(data.session.access_token);
  return data.session.access_token;
}

export function safeNextPath(value: string | null | undefined, fallback = "/analyze"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}

export function authRedirectUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

const RECOVERY_MARKER = "solvex:password-recovery";

export function markPasswordRecovery(active: boolean): void {
  if (typeof window === "undefined") return;
  if (active) window.sessionStorage.setItem(RECOVERY_MARKER, "1");
  else window.sessionStorage.removeItem(RECOVERY_MARKER);
}

export function hasPasswordRecoveryMarker(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(RECOVERY_MARKER) === "1";
}
