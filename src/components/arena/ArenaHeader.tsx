"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Send, RotateCcw, Copy, Check } from "lucide-react";
import LanguageSelect from "./LanguageSelect";
import SnapshotIndicator from "./SnapshotIndicator";
import type { ExecutionLanguage } from "@/types/execution";

interface ArenaHeaderProps {
  problemKey: string;
  problemName: string;
  language: ExecutionLanguage;
  onLanguageChange: (lang: ExecutionLanguage) => void;
  onRun: () => void;
  onSubmit: () => void;
  onReset: () => void;
  onCopy: () => void;
  isRunning: boolean;
  isSubmitting: boolean;
  savedAt: number | null;
  snapshotCount: number;
}

export default function ArenaHeader({
  problemKey,
  problemName,
  language,
  onLanguageChange,
  onRun,
  onSubmit,
  onReset,
  onCopy,
  isRunning,
  isSubmitting,
  savedAt,
  snapshotCount,
}: ArenaHeaderProps) {
  const [copied, setCopied] = useState(false);
  const shortName = problemName.length > 28 ? problemName.slice(0, 26) + "…" : problemName;

  async function handleCopy() {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const busy = isRunning || isSubmitting;

  return (
    <header
      style={{
        height: "52px",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: "10px",
        borderBottom: "1px solid rgba(0,245,160,0.1)",
        background: "rgba(2,8,6,0.95)",
        backdropFilter: "blur(8px)",
        flexShrink: 0,
        // position + zIndex lift this stacking context above the panels layer,
        // so the language dropdown (position:absolute inside here) renders on top.
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Back */}
      <Link
        href="/analyze"
        style={{
          display: "flex",
          alignItems: "center",
          color: "rgba(138,154,150,0.6)",
          textDecoration: "none",
          transition: "color 0.15s",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#F4F7F6")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(138,154,150,0.6)")}
        title="Back to analyze"
      >
        <ArrowLeft size={14} />
      </Link>

      <div style={{ width: "1px", height: "18px", background: "rgba(0,245,160,0.1)", flexShrink: 0 }} />

      {/* Logo — real SolveX brand asset */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/SolveX-logo-cropped.png"
        alt="SolveX"
        style={{
          height: "30px",
          width: "auto",
          maxWidth: "140px",
          objectFit: "contain",
          flexShrink: 0,
          display: "block",
        }}
      />

      <span style={{ color: "rgba(0,245,160,0.2)", fontSize: "14px", display: "none" }} className="sm-show">/</span>
      <span
        style={{
          fontSize: "11px",
          fontFamily: "ui-monospace, monospace",
          fontWeight: 600,
          color: "#00F5A0",
          display: "none",
        }}
        className="sm-show"
      >
        Arena
      </span>

      <span style={{ color: "rgba(0,245,160,0.15)", fontSize: "14px", display: "none" }} className="md-show">/</span>
      <div
        style={{ display: "none", alignItems: "center", gap: "6px", minWidth: 0 }}
        className="md-show-flex"
      >
        <span style={{ fontSize: "11px", fontFamily: "ui-monospace, monospace", color: "#4A6A5A", flexShrink: 0 }}>
          {problemKey}
        </span>
        <span style={{ color: "rgba(0,245,160,0.15)", fontSize: "12px" }}>·</span>
        <span
          style={{
            fontSize: "11px",
            color: "#9EB5AF",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {shortName}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Right side controls */}
      <SnapshotIndicator savedAt={savedAt} count={snapshotCount} />

      <LanguageSelect value={language} onChange={onLanguageChange} disabled={busy} />

      <div style={{ width: "1px", height: "18px", background: "rgba(0,245,160,0.1)", flexShrink: 0 }} />

      {/* Icon buttons */}
      {[
        {
          icon: <RotateCcw size={13} />,
          onClick: onReset,
          title: "Reset to template",
          disabled: busy,
        },
        {
          icon: copied ? <Check size={13} style={{ color: "#00F5A0" }} /> : <Copy size={13} />,
          onClick: handleCopy,
          title: "Copy code",
          disabled: false,
        },
      ].map(({ icon, onClick, title, disabled }, i) => (
        <button
          key={i}
          type="button"
          onClick={onClick}
          disabled={disabled}
          title={title}
          aria-label={title}
          className="tx-press"
          style={{
            padding: "6px",
            background: "none",
            border: "none",
            color: "#3A5A4A",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.4 : 1,
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              (e.currentTarget as HTMLButtonElement).style.color = "#F4F7F6";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,245,160,0.06)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#3A5A4A";
            (e.currentTarget as HTMLButtonElement).style.background = "none";
          }}
        >
          {icon}
        </button>
      ))}

      <div style={{ width: "1px", height: "18px", background: "rgba(0,245,160,0.1)", flexShrink: 0 }} />

      {/* Run */}
      <button
        type="button"
        onClick={onRun}
        disabled={busy}
        className="tx-press"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 14px",
          borderRadius: "8px",
          border: "1px solid rgba(0,245,160,0.3)",
          background: "rgba(0,245,160,0.06)",
          color: "#00F5A0",
          fontSize: "12px",
          fontWeight: 600,
          cursor: busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.4 : 1,
          transition: "background 0.15s, border-color 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!busy) {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,245,160,0.12)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,245,160,0.5)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,245,160,0.06)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,245,160,0.3)";
        }}
      >
        {isRunning ? (
          <span
            style={{
              width: "12px",
              height: "12px",
              border: "2px solid #00F5A0",
              borderTopColor: "transparent",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.7s linear infinite",
            }}
          />
        ) : (
          <Play size={12} />
        )}
        Run
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </button>

      {/* Submit */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={busy}
        className="tx-press"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 14px",
          borderRadius: "8px",
          border: "none",
          background: "linear-gradient(135deg, #00F5A0, #00D9F5)",
          color: "#020806",
          fontSize: "12px",
          fontWeight: 700,
          cursor: busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.4 : 1,
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => { if (!busy) (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = busy ? "0.4" : "1"; }}
      >
        {isSubmitting ? (
          <span
            style={{
              width: "12px",
              height: "12px",
              border: "2px solid #020806",
              borderTopColor: "transparent",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.7s linear infinite",
            }}
          />
        ) : (
          <Send size={12} />
        )}
        Submit
      </button>
    </header>
  );
}
