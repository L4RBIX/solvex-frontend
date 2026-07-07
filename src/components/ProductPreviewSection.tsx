"use client";

import { useEffect, useRef } from "react";
import type React from "react";

const frictionAreas = [
  {
    topic: "Constructive Algorithms",
    solved: 141, attempted: 142, submissions: 383,
    issue: "High WA count",
    action: "Practice systematic edge-case testing",
    color: "#FF4D6D",
    confidence: "High",
  },
  {
    topic: "Games",
    solved: 21, attempted: 21, submissions: 80,
    issue: "High retry cost",
    action: "Practice small-state reasoning",
    color: "#FACC15",
    confidence: "Medium",
  },
  {
    topic: "Shortest Paths",
    solved: 5, attempted: 5, submissions: 22,
    issue: "Avg 3.4 attempts before AC",
    action: "Strengthen graph implementation",
    color: "#00D9F5",
    confidence: "Medium",
  },
];

const errorData = [
  { label: "Wrong Answer",  count: 708, color: "#FF4D6D", pct: 100 },
  { label: "Time Limit",    count: 65,  color: "#FACC15", pct: 9.2 },
  { label: "Runtime Error", count: 56,  color: "#f97316", pct: 7.9 },
  { label: "Compile Error", count: 14,  color: "#8A9A96", pct: 2.0 },
  { label: "Memory Limit",  count: 5,   color: "#8A9A96", pct: 0.7 },
];

const queueDays = [
  { day: 1, focus: "Constructive",   tag: "#FF4D6D" },
  { day: 2, focus: "Games",          tag: "#FACC15" },
  { day: 3, focus: "Shortest Paths", tag: "#00D9F5" },
  { day: 4, focus: "Trees & BST",    tag: "#00F5A0" },
  { day: 5, focus: "Implementation", tag: "#00F5A0" },
  { day: 6, focus: "Mixed Practice", tag: "#8A9A96" },
  { day: 7, focus: "Review",         tag: "#8A9A96" },
];

const problems = [
  { name: "Removals Game",   rating: 1000, tag: "Constructive" },
  { name: "Replacement",     rating: 1100, tag: "Implementation" },
  { name: "Sorting Game",    rating: 1200, tag: "Games" },
  { name: "Arrow Path",      rating: 1300, tag: "Shortest Paths" },
];

export function ProductPreviewSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Low threshold so the large card triggers as soon as it enters the viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Reveal the demo dashboard card
          section.querySelectorAll<HTMLElement>(".reveal").forEach(el => el.classList.add("visible"));
          // Animate error bars
          section.querySelectorAll<HTMLElement>(".err-bar").forEach(el => el.classList.add("animated"));
          observer.unobserve(section);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="product" ref={sectionRef} className="tx-section" style={{ paddingTop: "60px" }}>
      <div className="tx-container">
        <div className="tx-section-header">
          <div className="section-badge" style={{ marginBottom: "20px" }}>Demo analysis</div>
          <h2 className="tx-h2" style={{ marginBottom: "16px" }}>
            Real analysis. Real priorities.
          </h2>
          <p className="tx-subtitle">
            Here is what SolveX found for a real Codeforces profile.
          </p>
        </div>

        {/* Dashboard card */}
        <div
          className="reveal"
          style={{
            background: "#06100D",
            border: "1px solid rgba(0,245,160,0.2)",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 0 80px -20px rgba(0,245,160,0.08), 0 40px 80px -20px rgba(0,0,0,0.6)",
          }}
        >
          {/* Window chrome bar */}
          <div
            style={{
              height: "44px",
              background: "#040E0B",
              borderBottom: "1px solid rgba(0,245,160,0.1)",
              display: "flex",
              alignItems: "center",
              paddingLeft: "20px",
              paddingRight: "20px",
              gap: "8px",
            }}
          >
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#3A4040", display: "inline-block" }} />
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#3A4040", display: "inline-block" }} />
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#3A4040", display: "inline-block" }} />
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "6px",
                  padding: "3px 16px",
                  fontSize: "12px",
                  color: "rgba(244,247,246,0.35)",
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                solvex.app/analyze?handle=Dan1c
              </div>
            </div>
          </div>

          {/* Profile bar */}
          <div
            style={{
              padding: "20px 28px",
              borderBottom: "1px solid rgba(0,245,160,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
              background: "rgba(0,245,160,0.025)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #00F5A0, #00D9F5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "17px",
                  color: "#020806",
                  flexShrink: 0,
                  fontFamily: "var(--font-rebond, system-ui)",
                }}
              >
                D
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "16px", color: "#F4F7F6", letterSpacing: "-0.02em" }}>Dan1c</div>
                <div style={{ fontSize: "13px", color: "#8A9A96" }}>Kazakhstan · Codeforces</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "28px", flexWrap: "wrap" }}>
              {[
                { v: "1099",    l: "Current rating", c: "#00F5A0" },
                { v: "1377",    l: "Peak rating",    c: "#F4F7F6" },
                { v: "574",     l: "Solved",         c: "#F4F7F6" },
                { v: "Java 21", l: "Language",       c: "#F4F7F6" },
              ].map((m) => (
                <div key={m.l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "17px", fontWeight: 700, color: m.c, letterSpacing: "-0.03em" }}>{m.v}</div>
                  <div style={{ fontSize: "11px", color: "#8A9A96", marginTop: "1px" }}>{m.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div style={{ padding: "28px" }}>
            {/* Diagnosis */}
            <div
              style={{
                background: "rgba(0,245,160,0.04)",
                border: "1px solid rgba(0,245,160,0.1)",
                borderRadius: "12px",
                padding: "16px 20px",
                marginBottom: "28px",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#00F5A0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                SolveX Diagnosis
              </span>
              <p style={{ fontSize: "14px", lineHeight: "22px", color: "#c8d4d0", margin: "8px 0 0" }}>
                Dan1c has solved 574 unique problems across 1,434 submissions. Strongest in math and implementation. Training friction appears in constructive algorithms, games, and shortest paths due to high retry cost and wrong-answer patterns.
              </p>
            </div>

            {/* Two-column layout */}
            <div
              className="product-grid-2col"
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}
            >
              {/* LEFT: Friction areas */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A9A96", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                  Friction Areas
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {frictionAreas.map((area) => (
                    <div
                      key={area.topic}
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: "10px",
                        padding: "12px 14px",
                        borderLeft: `3px solid ${area.color}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "5px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#F4F7F6", letterSpacing: "-0.01em" }}>{area.topic}</div>
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            background: `${area.color}18`,
                            color: area.color,
                            whiteSpace: "nowrap",
                            fontWeight: 600,
                            letterSpacing: "0.04em",
                          }}
                        >
                          {area.confidence}
                        </span>
                      </div>
                      <div style={{ fontSize: "11.5px", color: "#8A9A96", lineHeight: "18px" }}>
                        {area.solved}/{area.attempted} solved · {area.submissions} submissions · {area.issue}
                      </div>
                      <div style={{ fontSize: "11px", color: "#00F5A0", marginTop: "5px", fontWeight: 500 }}>
                        → {area.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: Errors + queue */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Error breakdown */}
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A9A96", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                    Error Breakdown
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                    {errorData.map((err) => (
                      <div key={err.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px", color: "#8A9A96" }}>{err.label}</span>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#F4F7F6" }}>{err.count}</span>
                        </div>
                        <div style={{ height: "3px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                          <div
                            className="err-bar"
                            style={{ "--bar-w": `${err.pct}%`, background: err.color } as React.CSSProperties}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7-day queue */}
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A9A96", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                    7-Day Queue
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {queueDays.map((d) => (
                      <div
                        key={d.day}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "6px 10px",
                          borderRadius: "7px",
                          background: "rgba(255,255,255,0.02)",
                        }}
                      >
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#00F5A0", minWidth: "38px", letterSpacing: "0.01em" }}>
                          Day {d.day}
                        </span>
                        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: d.tag, flexShrink: 0, display: "inline-block" }} />
                        <span style={{ fontSize: "12px", color: "#c8d4d0" }}>{d.focus}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended problems */}
            <div style={{ marginTop: "28px", borderTop: "1px solid rgba(0,245,160,0.08)", paddingTop: "24px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A9A96", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>
                Recommended Problems
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                {problems.map((p) => (
                  <div
                    key={p.name}
                    style={{
                      background: "rgba(0,245,160,0.03)",
                      border: "1px solid rgba(0,245,160,0.1)",
                      borderRadius: "9px",
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "#F4F7F6" }}>{p.name}</div>
                      <div style={{ fontSize: "11px", color: "#8A9A96", marginTop: "2px" }}>{p.tag}</div>
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#00F5A0",
                        background: "rgba(0,245,160,0.08)",
                        borderRadius: "6px",
                        padding: "3px 8px",
                        fontFamily: "ui-monospace, monospace",
                      }}
                    >
                      {p.rating}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
