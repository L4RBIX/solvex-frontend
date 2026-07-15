"use client";

/**
 * Prominent PvP entry point for /analyze. Previously the only duel link was a
 * 12px outlined pill buried at the bottom of GamificationWidget, visible only
 * to signed-in users who scrolled past the entire dashboard. This banner is
 * always rendered — signed out, signed in, or verified — so every visitor
 * sees PvP exists, with copy that matches what will actually happen on click.
 */

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const COLORS = {
  border: "#1B3A2C",
  text: "#F4F7F6",
  muted: "#A9BDB7",
  mint: "#00F5A0",
  cyan: "#00D9F5",
};

export function PvPCallout() {
  const auth = useAuth();

  let sub = "Practice in real-time against another coder.";
  let ctaLabel = "Start PvP duel →";
  let href = "/duels";
  let onClick: (() => void) | undefined;

  if (auth.status !== "signed_in") {
    sub = "Sign in to challenge friends.";
    ctaLabel = "Sign in to duel →";
    href = undefined as unknown as string;
    onClick = () => void auth.signIn();
  } else if (!auth.user?.handle_verified) {
    sub = "Verify your Codeforces handle to compete.";
    ctaLabel = "Verify handle →";
  }

  const cta = href ? (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "14px 26px",
        borderRadius: "12px",
        fontSize: "15px",
        fontWeight: 800,
        color: "#020806",
        background: `linear-gradient(120deg, ${COLORS.mint}, ${COLORS.cyan})`,
        textDecoration: "none",
        whiteSpace: "nowrap",
        boxShadow: "0 8px 24px rgba(0,245,160,0.22)",
      }}
    >
      {ctaLabel}
    </Link>
  ) : (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "14px 26px",
        borderRadius: "12px",
        fontSize: "15px",
        fontWeight: 800,
        color: "#020806",
        background: `linear-gradient(120deg, ${COLORS.mint}, ${COLORS.cyan})`,
        border: "none",
        cursor: "pointer",
        whiteSpace: "nowrap",
        boxShadow: "0 8px 24px rgba(0,245,160,0.22)",
      }}
    >
      {ctaLabel}
    </button>
  );

  return (
    <section
      className="pvp-callout"
      style={{
        marginBottom: "48px",
        borderRadius: "18px",
        border: `1px solid ${COLORS.border}`,
        background:
          "radial-gradient(120% 160% at 0% 0%, rgba(0,245,160,0.10), transparent 60%)," +
          "radial-gradient(120% 160% at 100% 100%, rgba(0,217,245,0.10), transparent 60%)," +
          "#081712",
        padding: "28px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "24px",
        flexWrap: "wrap",
      }}
    >
      <div style={{ minWidth: "240px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: COLORS.mint,
            marginBottom: "8px",
          }}
        >
          ⚔️ Friend PvP
        </div>
        <h3
          style={{
            fontFamily: "var(--font-rebond, system-ui)",
            fontWeight: 700,
            fontSize: "clamp(20px, 2.6vw, 26px)",
            color: COLORS.text,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Challenge a friend to a coding duel
        </h3>
        <p style={{ fontSize: "13.5px", color: COLORS.muted, marginTop: "6px", lineHeight: 1.5 }}>
          {sub} Server-controlled tests decide the winner — this is a practice duel, not official
          Codeforces acceptance.
        </p>
      </div>
      {cta}
      <style>{`
        @media (max-width: 640px) {
          .pvp-callout { padding: 22px 20px; }
          .pvp-callout > div:first-child { min-width: 100%; }
          .pvp-callout a, .pvp-callout button { width: 100%; justify-content: center; }
        }
      `}</style>
    </section>
  );
}

export default PvPCallout;
