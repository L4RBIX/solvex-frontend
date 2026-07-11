"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSupabaseClient, safeNextPath } from "@/lib/supabaseClient";
import { AuthShell } from "@/components/auth/AuthPageClient";

export function AuthCallbackClient() {
  const searchParams = useSearchParams();
  const [exchangeFailed, setExchangeFailed] = useState(false);
  const code = searchParams.get("code");
  const nextPath = safeNextPath(searchParams.get("next"));
  const providerError = searchParams.get("error") || searchParams.get("error_description");
  const invalidRequest = Boolean(providerError || !code || !getSupabaseClient());
  const error = invalidRequest || exchangeFailed
    ? "The sign-in link is invalid or expired. Start again from the sign-in page."
    : null;

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (providerError || !code || !supabase) {
      return;
    }
    let cancelled = false;
    void supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
      if (cancelled) return;
      if (exchangeError) {
        setExchangeFailed(true);
        return;
      }
      window.location.replace(nextPath);
    });
    return () => { cancelled = true; };
  }, [code, nextPath, providerError]);

  return (
    <AuthShell title={error ? "Authentication failed" : "Completing sign in…"} subtitle={error ?? "Securely validating your Supabase session."}>
      {error && <Link href="/auth" style={{ color: "#00F5A0" }}>Return to sign in</Link>}
    </AuthShell>
  );
}
