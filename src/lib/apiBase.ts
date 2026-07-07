/**
 * Centralized backend API base URL for all fetch calls.
 *
 * Configure via environment variable:
 *   - Local dev: set NEXT_PUBLIC_API_URL in wope/.env.local
 *   - Vercel:    Project Settings → Environment Variables → NEXT_PUBLIC_API_URL
 *
 * The NEXT_PUBLIC_ prefix is required so Next.js includes the value in
 * the browser bundle. Never put secrets (API keys, service keys) here.
 *
 * Example values:
 *   http://localhost:8000                         (local dev)
 *   https://your-backend.up.railway.app           (production)
 */

const _configured = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/$/, "");

function _resolveBase(): string {
  if (_configured) return _configured;

  if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
    console.error(
      "[SolveX] NEXT_PUBLIC_API_URL is not set. " +
        "Add it in Vercel → Project Settings → Environment Variables. " +
        "All backend API calls will fail until this is configured."
    );
  }

  return "http://localhost:8000";
}

export const API_BASE = _resolveBase();
