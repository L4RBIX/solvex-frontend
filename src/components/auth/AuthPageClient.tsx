"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { safeNextPath } from "@/lib/supabaseClient";

type Mode = "sign_in" | "sign_up" | "forgot";

export function AuthPageClient() {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const [mode, setMode] = useState<Mode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setLocalError(null);
    try {
      if (mode === "forgot") {
        await auth.requestPasswordReset(email.trim());
        setMessage("If an account exists for that email, a password reset link has been sent.");
        return;
      }
      if (password.length < 8) {
        setLocalError("Use at least 8 characters for your password.");
        return;
      }
      if (mode === "sign_up") {
        const result = await auth.signUpWithPassword(email.trim(), password);
        setMessage(
          result.confirmationRequired
            ? "Check your email to confirm your account, then sign in."
            : "Your account is ready. Redirecting…"
        );
        if (!result.confirmationRequired) window.location.assign(nextPath);
        return;
      }
      const user = await auth.signInWithPassword(email.trim(), password);
      if (user) window.location.assign(nextPath);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : "Authentication failed.");
    }
  };

  if (auth.status === "signed_in") {
    return (
      <AuthShell title="You’re signed in" subtitle="Your SolveX account is ready. Codeforces is connected separately.">
        <div style={{ display: "grid", gap: "12px" }}>
          <Link href={nextPath} style={primaryButtonStyle}>Continue to SolveX</Link>
          <button type="button" onClick={() => void auth.signOut()} style={secondaryButtonStyle}>Sign out</button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={mode === "sign_up" ? "Create your SolveX account" : mode === "forgot" ? "Reset your password" : "Sign in to SolveX"}
      subtitle="Your email or Google account identifies you. A Codeforces handle is optional and verified separately."
    >
      {mode !== "forgot" && (
        <button
          type="button"
          onClick={() => void auth.signInWithGoogle(nextPath).catch(() => undefined)}
          style={{ ...secondaryButtonStyle, width: "100%", marginBottom: "14px" }}
        >
          Continue with Google
        </button>
      )}
      <form onSubmit={submit} style={{ display: "grid", gap: "12px" }}>
        <label style={labelStyle}>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={inputStyle}
          />
        </label>
        {mode !== "forgot" && (
          <label style={labelStyle}>
            Password
            <input
              type="password"
              autoComplete={mode === "sign_up" ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={inputStyle}
            />
          </label>
        )}
        <button type="submit" disabled={auth.busy} style={primaryButtonStyle}>
          {auth.busy ? "Please wait…" : mode === "sign_up" ? "Sign up" : mode === "forgot" ? "Send reset link" : "Sign in"}
        </button>
      </form>
      {(localError || auth.error) && <p style={{ color: "#FF6B82", fontSize: "12px" }}>{localError || auth.error}</p>}
      {message && <p style={{ color: "#00F5A0", fontSize: "12px", lineHeight: "18px" }}>{message}</p>}
      <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "16px" }}>
        {mode !== "sign_in" && <button type="button" onClick={() => setMode("sign_in")} style={linkButtonStyle}>Sign in</button>}
        {mode !== "sign_up" && <button type="button" onClick={() => setMode("sign_up")} style={linkButtonStyle}>Create account</button>}
        {mode !== "forgot" && <button type="button" onClick={() => setMode("forgot")} style={linkButtonStyle}>Forgot password?</button>}
      </div>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", background: "#020806" }}>
      <section style={{ width: "100%", maxWidth: "420px", padding: "28px", borderRadius: "16px", border: "1px solid #173026", background: "#06100D", color: "#F4F7F6" }}>
        <Link href="/" style={{ color: "#00F5A0", textDecoration: "none", fontSize: "13px" }}>SX · SolveX</Link>
        <h1 style={{ fontSize: "24px", margin: "18px 0 6px" }}>{title}</h1>
        <p style={{ color: "#8A9A96", fontSize: "13px", lineHeight: "19px", margin: "0 0 22px" }}>{subtitle}</p>
        {children}
      </section>
    </main>
  );
}

const labelStyle: React.CSSProperties = { display: "grid", gap: "6px", fontSize: "12px", color: "#B7C3BF" };
const inputStyle: React.CSSProperties = { padding: "10px 12px", borderRadius: "8px", border: "1px solid #173026", background: "#020806", color: "#F4F7F6", fontSize: "14px" };
const primaryButtonStyle: React.CSSProperties = { display: "block", padding: "10px 14px", borderRadius: "8px", border: "1px solid #00F5A0", background: "rgba(0,245,160,.12)", color: "#00F5A0", fontWeight: 700, textAlign: "center", textDecoration: "none", cursor: "pointer" };
const secondaryButtonStyle: React.CSSProperties = { padding: "10px 14px", borderRadius: "8px", border: "1px solid #27443A", background: "transparent", color: "#D8E2DE", fontWeight: 600, cursor: "pointer" };
const linkButtonStyle: React.CSSProperties = { border: 0, background: "transparent", padding: 0, color: "#00D9F5", fontSize: "12px", cursor: "pointer" };
