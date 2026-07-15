"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import type React from "react";

/* ─── Star positions (static — avoids SSR/client mismatch) ─── */
const STARS: Array<{ top: string; left: string; size: number; dur: string; del: string }> = [
  { top: "4%",  left: "6%",  size: 1, dur: "3.2s", del: "0.1s"  },
  { top: "9%",  left: "22%", size: 2, dur: "4.5s", del: "0.7s"  },
  { top: "6%",  left: "40%", size: 1, dur: "2.8s", del: "1.2s"  },
  { top: "12%", left: "57%", size: 2, dur: "3.9s", del: "0.4s"  },
  { top: "3%",  left: "75%", size: 1, dur: "4.1s", del: "1.8s"  },
  { top: "14%", left: "88%", size: 2, dur: "2.6s", del: "0.9s"  },
  { top: "21%", left: "3%",  size: 1, dur: "3.7s", del: "0.3s"  },
  { top: "19%", left: "16%", size: 2, dur: "4.8s", del: "1.5s"  },
  { top: "26%", left: "33%", size: 1, dur: "3.1s", del: "0.6s"  },
  { top: "23%", left: "50%", size: 2, dur: "4.3s", del: "2.1s"  },
  { top: "31%", left: "66%", size: 1, dur: "2.9s", del: "0.2s"  },
  { top: "28%", left: "82%", size: 2, dur: "3.5s", del: "1.1s"  },
  { top: "36%", left: "11%", size: 1, dur: "4.7s", del: "0.8s"  },
  { top: "40%", left: "28%", size: 2, dur: "3.3s", del: "1.7s"  },
  { top: "44%", left: "45%", size: 1, dur: "2.7s", del: "0.5s"  },
  { top: "41%", left: "63%", size: 2, dur: "4.0s", del: "2.3s"  },
  { top: "47%", left: "79%", size: 1, dur: "3.6s", del: "1.0s"  },
  { top: "52%", left: "1%",  size: 2, dur: "4.4s", del: "0.15s" },
  { top: "55%", left: "18%", size: 1, dur: "3.0s", del: "1.4s"  },
  { top: "49%", left: "36%", size: 2, dur: "4.9s", del: "0.65s" },
  { top: "58%", left: "54%", size: 1, dur: "2.5s", del: "1.9s"  },
  { top: "62%", left: "70%", size: 2, dur: "3.8s", del: "0.35s" },
  { top: "59%", left: "86%", size: 1, dur: "4.2s", del: "1.3s"  },
  { top: "66%", left: "9%",  size: 2, dur: "3.4s", del: "2.0s"  },
  { top: "70%", left: "26%", size: 1, dur: "4.6s", del: "0.55s" },
  { top: "74%", left: "43%", size: 2, dur: "2.4s", del: "1.6s"  },
  { top: "77%", left: "60%", size: 1, dur: "3.9s", del: "0.25s" },
  { top: "71%", left: "77%", size: 2, dur: "4.1s", del: "2.2s"  },
  { top: "82%", left: "14%", size: 1, dur: "3.2s", del: "1.05s" },
  { top: "86%", left: "91%", size: 2, dur: "4.3s", del: "0.45s" },
];

/* ─── Perspective line scan colors ─── */
const LINE_GRADIENT = "linear-gradient(to bottom, rgba(0,245,160,0) 0%, rgba(0,245,160,0.4) 50%, rgba(0,217,245,0.4) 50%, rgba(0,217,245,0) 100%)";
const RAY_GRADIENT  = "linear-gradient(to bottom, rgba(0,245,160,0) 0%, rgba(0,245,160,0.45) 50%, rgba(0,217,245,0.45) 50%, rgba(0,217,245,0) 100%)";

/* mask() — position defaults to "0% 0%" (correct for the 1248px platform container) */
function mask(
  file: string,
  size: "cover" | "contain" = "contain",
  position = "0% 0%",
): React.CSSProperties {
  const u = `url('/images/hero/${file}')`;
  return {
    maskImage: u,           WebkitMaskImage: u,
    maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat",
    maskSize: size,          WebkitMaskSize: size,
    maskPosition: position,  WebkitMaskPosition: position,
  };
}

const LINES = [
  { file: "hero-background-bottom-line-1.png", delay: "0s"  },
  { file: "hero-background-bottom-line-2.png", delay: "2s"  },
  { file: "hero-background-bottom-line-3.png", delay: "3s"  },
  { file: "hero-background-bottom-line-4.png", delay: "1s"  },
];

/* ─── HeroTopGrid: curved arc vector lines behind the headline ─────────────
   Container is full-width (left:0, right:0). Both the background image and
   the scan-beam mask are centred via backgroundPosition / maskPosition.    */
function HeroTopGrid() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* Static arc curves — explicit 1248px wide, centred, hue-shifted to green */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/images/hero/hero-background-top.png')",
          backgroundSize: "1248px auto",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center top",
          opacity: 0.55,
          filter: "hue-rotate(210deg) saturate(1.2)",
        }}
      />
      {/* Animated scan beam — mask centred to match the background */}
      <div
        style={{
          ...mask("hero-background-top-mask.png", "contain", "center top"),
          position: "absolute",
          inset: 0,
          zIndex: 9,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            backgroundImage: LINE_GRADIENT,
            width: "100%",
            height: "60px",
            animation: "hero-top-anim 6s cubic-bezier(0.62, 0.62, 0.14, 1) 0.5s infinite",
          }}
        />
      </div>
    </div>
  );
}

/* ─── HeroPlatform: perspective grid in the lower stage ─── */
function HeroPlatform() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {/* Dome glow — subtle, centred, positioned at the top of the platform */}
      <div
        style={{
          position: "absolute",
          top: "-20px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "1400px",
          height: "240px",
          background:
            "radial-gradient(ellipse 800px 200px at 50% 100%, rgba(0,245,160,0.18) 0%, rgba(0,217,245,0.10) 55%, transparent 78%)",
          pointerEvents: "none",
        }}
      />

      {/* 1248px perspective grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "1248px",
        }}
      >
        {/* Static perspective grid background image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/images/hero/hero-background-bottom.png')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            filter: "hue-rotate(210deg) saturate(1.1)",
          }}
        />

        {LINES.map((ln, i) => (
          <div
            key={i}
            style={{ ...mask(ln.file), position: "absolute", inset: 0, overflow: "hidden" }}
          >
            <div
              style={{
                backgroundImage: LINE_GRADIENT,
                width: "100%",
                height: "60px",
                animation: `hero-line-anim 4s cubic-bezier(0.62,0.62,0.14,1) ${ln.delay} infinite`,
              }}
            />
          </div>
        ))}

        {/* Central ray */}
        <div
          style={{ ...mask("hero-background-bottom-ray.png"), position: "absolute", inset: 0, overflow: "hidden" }}
        >
          <div
            style={{
              backgroundImage: RAY_GRADIENT,
              width: "100%",
              height: "60px",
              animation: "hero-ray-anim 8s cubic-bezier(0.62,0.62,0.28,0.67) 1s infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── HeroProductPreview: static SolveX diagnosis mockup ─── */
const FRICTION_AREAS = [
  { tag: "Constructive Algorithms", pct: 73, color: "#FF4D6D" },
  { tag: "Games",                   pct: 55, color: "#FACC15" },
  { tag: "Shortest Paths",          pct: 46, color: "#FF4D6D" },
];

const QUEUE_ITEMS = [
  { day: "Day 1", task: "Constructive — Greedy constructions · CF 1200–1400" },
  { day: "Day 2", task: "Games — Sprague-Grundy theory · CF 1300–1500"       },
  { day: "Day 3", task: "Shortest Paths — Dijkstra edge cases · CF 1400–1600"},
];

function HeroProductPreview() {
  return (
    <div
      style={{
        borderRadius: 16,
        overflow: "hidden",
        background: "rgba(4, 18, 14, 0.88)",
        border: "1px solid rgba(0, 245, 160, 0.18)",
        boxShadow:
          "0 0 0 1px rgba(0,245,160,0.06), 0 40px 100px rgba(0,0,0,0.75), 0 8px 40px rgba(0,245,160,0.07)",
        height: "420px",
        display: "flex",
        flexDirection: "column",
        userSelect: "none",
      }}
    >
      {/* Browser chrome */}
      <div
        style={{
          height: "36px",
          background: "rgba(2, 10, 6, 0.95)",
          borderBottom: "1px solid rgba(0,245,160,0.08)",
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          gap: "6px",
          flexShrink: 0,
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57", display: "block", flexShrink: 0 }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E", display: "block", flexShrink: 0 }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840", display: "block", flexShrink: 0 }} />
        <div
          style={{
            flex: 1,
            marginLeft: 14,
            marginRight: 50,
            height: "22px",
            borderRadius: "6px",
            background: "rgba(0,245,160,0.04)",
            border: "1px solid rgba(0,245,160,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            color: "rgba(244,247,246,0.3)",
            fontFamily: "ui-monospace, monospace",
            letterSpacing: "0.01em",
          }}
        >
          solvex.app/analyze?handle=Dan1c
        </div>
      </div>

      {/* App body */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

        {/* Left column: user stats */}
        <div
          style={{
            width: "220px",
            flexShrink: 0,
            padding: "14px 16px",
            borderRight: "1px solid rgba(0,245,160,0.07)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#00F5A0",
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                marginBottom: "5px",
              }}
            >
              SolveX Diagnosis
            </div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "#F4F7F6", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
              Dan1c
            </div>
            <div style={{ fontSize: "11px", color: "#8A9A96", marginTop: "2px" }}>Div. 2 · Specialist</div>
          </div>

          <div
            style={{
              background: "rgba(250,204,21,0.07)",
              border: "1px solid rgba(250,204,21,0.16)",
              borderRadius: "8px",
              padding: "8px 10px",
            }}
          >
            <div style={{ fontSize: "10px", color: "rgba(250,204,21,0.55)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "2px" }}>
              Current Rating
            </div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#FACC15", letterSpacing: "-0.04em", fontFamily: "ui-monospace, monospace", lineHeight: 1 }}>
              1099
            </div>
          </div>

          {[
            { label: "Problems solved",   value: "574"   },
            { label: "Total submissions", value: "1,434" },
            { label: "Friction areas",    value: "3"     },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "5px 0",
                borderBottom: "1px solid rgba(0,245,160,0.05)",
              }}
            >
              <span style={{ fontSize: "11px", color: "#8A9A96" }}>{s.label}</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#F4F7F6", fontFamily: "ui-monospace, monospace" }}>
                {s.value}
              </span>
            </div>
          ))}

          <div
            style={{
              marginTop: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 10px",
              borderRadius: "9999px",
              background: "rgba(255,77,109,0.08)",
              border: "1px solid rgba(255,77,109,0.18)",
              width: "fit-content",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF4D6D", display: "block" }} />
            <span style={{ fontSize: "11px", color: "#FF4D6D", fontWeight: 500 }}>3 gaps detected</span>
          </div>
        </div>

        {/* Middle column: friction areas */}
        <div
          style={{
            flex: "0 0 300px",
            padding: "14px 16px",
            borderRight: "1px solid rgba(0,245,160,0.07)",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "rgba(244,247,246,0.35)",
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              marginBottom: "14px",
            }}
          >
            Friction Areas
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
            {FRICTION_AREAS.map((fa) => (
              <div key={fa.tag}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                  <span style={{ fontSize: "12px", color: "#F4F7F6", fontWeight: 500 }}>{fa.tag}</span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: fa.color,
                      fontFamily: "ui-monospace, monospace",
                      background: `${fa.color}14`,
                      padding: "1px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {fa.pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: "5px",
                    background: "rgba(244,247,246,0.06)",
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${fa.pct}%`,
                      background: `linear-gradient(90deg, ${fa.color}99, ${fa.color})`,
                      borderRadius: "3px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "16px",
              padding: "10px",
              background: "rgba(0,245,160,0.03)",
              border: "1px solid rgba(0,245,160,0.07)",
              borderRadius: "8px",
            }}
          >
            <div style={{ fontSize: "10px", color: "rgba(244,247,246,0.35)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "6px" }}>
              Error Breakdown
            </div>
            {[
              { label: "Wrong Answer",  pct: 61, color: "#FF4D6D" },
              { label: "Time Limit",    pct: 24, color: "#FACC15" },
              { label: "Runtime Error", pct: 15, color: "#8A9A96" },
            ].map((e) => (
              <div key={e.label} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "10px", color: "#8A9A96", minWidth: "88px" }}>{e.label}</span>
                <div style={{ flex: 1, height: "3px", background: "rgba(244,247,246,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${e.pct}%`, background: e.color, borderRadius: "2px" }} />
                </div>
                <span style={{ fontSize: "10px", color: e.color, fontFamily: "ui-monospace, monospace", minWidth: "28px", textAlign: "right" }}>{e.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: 7-day queue */}
        <div style={{ flex: 1, padding: "14px 16px", minWidth: 0 }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "rgba(244,247,246,0.35)",
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              marginBottom: "14px",
            }}
          >
            7-Day Training Queue
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {QUEUE_ITEMS.map((q, i) => (
              <div
                key={q.day}
                style={{
                  background: i === 0 ? "rgba(0,245,160,0.06)" : "rgba(244,247,246,0.02)",
                  border: `1px solid ${i === 0 ? "rgba(0,245,160,0.16)" : "rgba(244,247,246,0.04)"}`,
                  borderLeft: `3px solid ${i === 0 ? "#00F5A0" : "rgba(244,247,246,0.06)"}`,
                  borderRadius: "8px",
                  padding: "8px 10px",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: i === 0 ? "#00F5A0" : "rgba(244,247,246,0.35)",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    marginBottom: "3px",
                  }}
                >
                  {q.day}
                  {i === 0 && (
                    <span style={{ marginLeft: 6, fontSize: "9px", background: "rgba(0,245,160,0.15)", padding: "1px 5px", borderRadius: "4px" }}>
                      TODAY
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "11px", color: "#8A9A96", lineHeight: 1.35 }}>{q.task}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "8px",
              padding: "7px 10px",
              background: "rgba(244,247,246,0.015)",
              border: "1px solid rgba(244,247,246,0.04)",
              borderRadius: "8px",
            }}
          >
            <span style={{ fontSize: "11px", color: "rgba(244,247,246,0.25)" }}>Days 4–7 · DP on Intervals, Number Theory, Ad-hoc...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── HeroSection ─── */
export function HeroSection() {
  const router = useRouter();
  const [handle, setHandle]         = useState("");
  const [error, setError]           = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const trimmed = handle.trim();
    if (!trimmed) { setError("Enter a Codeforces handle to analyze."); return; }
    setError("");
    setSubmitting(true);
    router.push(`/analyze?handle=${encodeURIComponent(trimmed)}`);
  }

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#020806",
        minHeight: "max(920px, 100svh)",
      }}
    >
      {/* ── Stars z:0 ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          animation: "hero-stars-drift 30s ease-in-out infinite",
        }}
      >
        {STARS.map((s, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              top: s.top,
              left: s.left,
              width: `${s.size}px`,
              height: `${s.size}px`,
              background: "#00F5A0",
              borderRadius: "50%",
              opacity: 0.3,
              animation: `twinkle ${s.dur} infinite alternate`,
              animationDelay: s.del,
            }}
          />
        ))}
      </div>

      {/* ── Top arc vector grid: z:1
           Container spans full section width (left:0, right:0).
           Inside, background + mask both use "center top" so the 1248px
           arc image is always horizontally centred, never shifted right. ── */}
      <div
        className="hero-top-grid-layer"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "72px",
          left: 0,
          right: 0,
          height: "202px",
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <HeroTopGrid />
      </div>

      {/* ── Atmospheric lights texture: very subtle depth, z:1 ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "-40px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "1680px",
          height: "725px",
          backgroundImage: "url('/images/hero/hero-background-lights.png')",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          opacity: 0.08,
          filter: "hue-rotate(210deg) saturate(1.3)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* ── Platform/grid: 420px at z:1 — starts below the CTA area ── */}
      <div
        className="hero-platform-layer"
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "420px",
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <HeroPlatform />
      </div>

      {/* ── Glow: z:2, centred low so it illuminates behind the preview,
           NOT behind the subheadline/input area ── */}
      <div
        aria-hidden="true"
        className="hero-glow-layer"
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "1500px",
          height: "640px",
          background:
            "radial-gradient(ellipse 860px 440px at 50% 88%, rgba(0,245,160,0.20) 0%, rgba(0,217,245,0.10) 50%, transparent 70%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* ── Product preview: z:3
           Outer div: static left:50% + translateX(-50%) for centering.
           Inner .hero-preview-layer: entrance rise + continuous float.
           bottom:-160px pushes the card down so its top edge clears the
           microcopy. Only the top ~120px of the card is visible on load. ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "-160px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(1280px, 90vw)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      >
        <div className="hero-preview-layer">
          <HeroProductPreview />
        </div>
      </div>

      {/* ── Text content: z:20 — always above every background layer ── */}
      <div
        style={{
          position: "relative",
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          paddingTop: "148px",
          paddingBottom: "0",
          paddingLeft: "24px",
          paddingRight: "24px",
        }}
      >
        {/* Badge */}
        <div className="section-badge hero-enter hero-enter-0" style={{ marginBottom: "28px" }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M6 0L7.35 4.65L12 6L7.35 7.35L6 12L4.65 7.35L0 6L4.65 4.65L6 0Z" fill="#00F5A0" />
          </svg>
          Codeforces Performance Intelligence
        </div>

        {/* Headline */}
        <h1
          className="hero-h1-gradient hero-enter hero-enter-1"
          style={{
            fontFamily: "var(--font-rebond, system-ui)",
            fontWeight: 700,
            fontSize: "clamp(48px, 7vw, 84px)",
            lineHeight: 1.0,
            letterSpacing: "-0.04em",
            marginBottom: "22px",
          }}
        >
          Find your Codeforces<br />blind spots.
        </h1>

        {/* Subheadline */}
        <p
          className="hero-enter hero-enter-2"
          style={{
            fontSize: "clamp(16px, 2vw, 19px)",
            lineHeight: 1.65,
            color: "#8A9A96",
            maxWidth: "600px",
            margin: "0 auto 36px",
          }}
        >
          SolveX analyzes your public Codeforces submissions, verdicts, tags,
          rating range, and error patterns to generate a focused 7-day training plan.
        </p>

        {/* Handle input + CTA */}
        <form
          onSubmit={handleSubmit}
          id="hero-input"
          className="hero-enter hero-enter-3"
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            marginBottom: "14px",
          }}
        >
          <div className={`hero-input-pill${error ? " hero-input-pill-error" : ""}`}>
            <input
              type="text"
              value={handle}
              onChange={(e) => { setHandle(e.target.value); setError(""); }}
              placeholder="Enter Codeforces handle"
              className="hero-input-inner"
              autoComplete="off"
              spellCheck={false}
              disabled={submitting}
              aria-label="Codeforces handle"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "hero-handle-error" : undefined}
            />
            <div className="glow-wrap">
              <div className="glow-animations">
                <div className="glow-glow" />
                <div className="glow-stars-masker"><div className="glow-stars" /></div>
              </div>
              <div className="glow-content">
                <button type="submit" className="hero-cta-btn" disabled={submitting}>
                  {submitting ? (
                    <>
                      <LoaderCircle size={15} strokeWidth={2.5} className="hero-cta-spinner" aria-hidden="true" />
                      Analyzing…
                    </>
                  ) : (
                    "Analyze profile"
                  )}
                </button>
              </div>
            </div>
          </div>
          {error && (
            <span id="hero-handle-error" role="alert" className="hero-input-error-msg">
              {error}
            </span>
          )}
        </form>

        {/* Microcopy — last content element; no bottom margin needed after this */}
        <p
          className="hero-enter hero-enter-4"
          style={{
            fontSize: "13px",
            color: "rgba(138,154,150,0.7)",
            letterSpacing: "0.01em",
            marginBottom: "0",
          }}
        >
          No login required · Uses Codeforces public API · Analysis takes around 10 seconds
        </p>
      </div>
    </section>
  );
}
