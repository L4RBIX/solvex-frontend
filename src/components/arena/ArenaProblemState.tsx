"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, House, RefreshCw } from "lucide-react";

import { codeforcesProblemHref } from "@/lib/problemRoutes";

export type ArenaProblemStateKind =
  | "loading"
  | "malformed"
  | "not_found"
  | "network"
  | "invalid_response";

interface ArenaProblemStateProps {
  kind: ArenaProblemStateKind;
  problemId?: string;
  handle?: string;
  onRetry?: () => void;
}

const COPY: Record<
  ArenaProblemStateKind,
  { title: string; message: string }
> = {
  loading: {
    title: "Loading problem",
    message: "Loading public SolveX catalog metadata for this problem.",
  },
  malformed: {
    title: "Invalid problem link",
    message:
      "Use a positive Codeforces contest ID followed by its problem index, for example 71A.",
  },
  not_found: {
    title: "Problem not found",
    message:
      "This is a valid problem identifier, but it is not currently available in the SolveX catalog.",
  },
  network: {
    title: "Problem catalog unavailable",
    message:
      "SolveX could not reach the problem catalog. Your editor has not loaded the wrong or demo problem.",
  },
  invalid_response: {
    title: "Problem metadata unavailable",
    message:
      "SolveX received invalid problem metadata and stopped before showing an incorrect problem.",
  },
};

export default function ArenaProblemState({
  kind,
  problemId,
  handle,
  onRetry,
}: ArenaProblemStateProps) {
  const copy = COPY[kind];
  const officialUrl = problemId
    ? codeforcesProblemHref(problemId)
    : null;
  const analyzeHref = handle?.trim()
    ? `/analyze?handle=${encodeURIComponent(handle.trim())}`
    : "/analyze";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020806",
        color: "#F4F7F6",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <section
        role={kind === "loading" ? "status" : "alert"}
        style={{
          width: "min(100%, 620px)",
          border: "1px solid rgba(0,245,160,0.16)",
          borderRadius: "8px",
          background: "#06100D",
          padding: "28px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#00F5A0",
            fontFamily: "ui-monospace, monospace",
            fontSize: "12px",
            marginBottom: "16px",
          }}
        >
          {kind === "loading" && (
            <span
              aria-hidden
              style={{
                width: "12px",
                height: "12px",
                border: "2px solid #00F5A0",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "arena-problem-spin 0.8s linear infinite",
              }}
            />
          )}
          {problemId ? `SolveX Arena · ${problemId}` : "SolveX Arena"}
        </div>
        <h1
          style={{
            margin: "0 0 10px",
            fontSize: "24px",
            lineHeight: 1.2,
            overflowWrap: "anywhere",
          }}
        >
          {copy.title}
        </h1>
        <p
          style={{
            color: "#9EB5AF",
            fontSize: "14px",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {copy.message}
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginTop: "24px",
          }}
        >
          {onRetry && kind !== "loading" && (
            <button
              type="button"
              onClick={onRetry}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                minHeight: "36px",
                padding: "8px 14px",
                border: "none",
                borderRadius: "7px",
                background: "#00F5A0",
                color: "#020806",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={14} />
              Retry
            </button>
          )}
          {officialUrl && (
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                minHeight: "36px",
                padding: "8px 14px",
                border: "1px solid rgba(0,217,245,0.32)",
                borderRadius: "7px",
                color: "#00D9F5",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "13px",
              }}
            >
              Open official statement
              <ExternalLink size={13} />
            </a>
          )}
          <Link
            href={analyzeHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              minHeight: "36px",
              padding: "8px 10px",
              color: "#9EB5AF",
              textDecoration: "none",
              fontSize: "13px",
            }}
          >
            <ArrowLeft size={13} />
            Back to analysis
          </Link>
          <Link
            href="/"
            aria-label="Home"
            title="Home"
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: "36px",
              padding: "8px",
              color: "#9EB5AF",
            }}
          >
            <House size={14} />
          </Link>
        </div>
      </section>
      <style>{`
        @keyframes arena-problem-spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
