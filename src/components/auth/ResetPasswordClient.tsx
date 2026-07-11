"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { AuthShell } from "@/components/auth/AuthPageClient";

export function ResetPasswordClient() {
  const auth = useAuth();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (auth.status !== "loading" && (!auth.recoverySession || auth.status !== "signed_in")) {
    return (
      <AuthShell title="Invalid recovery session" subtitle="Open the most recent password reset link from your email.">
        <Link href="/auth" style={{ color: "#00F5A0" }}>Request another reset link</Link>
      </AuthShell>
    );
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    try {
      await auth.updatePassword(password);
      setMessage("Password updated. You can continue to SolveX.");
      setPassword("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update the password.");
    }
  };

  return (
    <AuthShell title="Choose a new password" subtitle="This page works only with a valid Supabase recovery session.">
      {message ? (
        <Link href="/analyze" style={{ color: "#00F5A0" }}>{message}</Link>
      ) : (
        <form onSubmit={submit} style={{ display: "grid", gap: "12px" }}>
          <input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #173026", background: "#020806", color: "white" }} />
          <button type="submit" style={{ padding: "10px", borderRadius: "8px", border: "1px solid #00F5A0", background: "rgba(0,245,160,.1)", color: "#00F5A0" }}>Update password</button>
          {error && <p style={{ color: "#FF6B82", fontSize: "12px" }}>{error}</p>}
        </form>
      )}
    </AuthShell>
  );
}
