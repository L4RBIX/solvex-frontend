"use client";

import { useEffect, useRef } from "react";
import type React from "react";
import { RevealOnScroll } from "@/components/animations/motion";

const AREAS = [
  {
    topic: "Constructive Algorithms",
    solved: 141, attempted: 142, submissions: 383,
    issue: "High wrong-answer count",
    confidence: "High",
    action: "Edge-case testing practice",
    color: "#FF4D6D",
    bar: 88,
    tags: ["WA heavy", "Systematic gaps"],
  },
  {
    topic: "Games",
    solved: 21, attempted: 21, submissions: 80,
    issue: "High retry cost",
    confidence: "Medium",
    action: "Small-state reasoning practice",
    color: "#FACC15",
    bar: 62,
    tags: ["High retries", "Greedy patterns"],
  },
  {
    topic: "Shortest Paths",
    solved: 5, attempted: 5, submissions: 22,
    issue: "Many attempts before AC",
    confidence: "Medium",
    action: "Graph implementation discipline",
    color: "#00D9F5",
    bar: 51,
    tags: ["Avg 3.4 attempts", "Impl errors"],
  },
];

export function TrainingPrioritiesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.querySelectorAll<HTMLElement>(".friction-bar").forEach(el => el.classList.add("animated"));
          observer.unobserve(section);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="training-priorities" ref={sectionRef} className="tx-section">
      <div className="tx-container">
        <RevealOnScroll>
          <div className="tx-section-header">
            <div className="section-badge" style={{ marginBottom: "20px" }}>Friction areas</div>
            <h2 className="tx-h2" style={{ marginBottom: "16px" }}>
              See the patterns<br />behind your mistakes.
            </h2>
            <p className="tx-subtitle">
              A topic can be fully solved and still show friction — through many wrong answers, retries, time limits, or high attempts before AC.
            </p>
          </div>
        </RevealOnScroll>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
          {AREAS.map((area, i) => (
            <RevealOnScroll key={area.topic} delay={i + 1}>
            <div
              className="tx-card"
              style={{ padding: "28px", borderTop: `3px solid ${area.color}`, height: "100%" }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#F4F7F6", letterSpacing: "-0.02em", marginBottom: "6px" }}>
                    {area.topic}
                  </h3>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {area.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 600,
                          color: area.color,
                          background: `${area.color}12`,
                          borderRadius: "9999px",
                          padding: "2px 9px",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    fontSize: "11px",
                    fontWeight: 700,
                    color: area.color,
                    background: `${area.color}12`,
                    border: `1px solid ${area.color}28`,
                    borderRadius: "9999px",
                    padding: "3px 12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {area.confidence}
                </div>
              </div>

              {/* Stats */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                {[
                  { label: "Solved",      value: `${area.solved}/${area.attempted}` },
                  { label: "Submissions", value: area.submissions },
                  { label: "Issue",       value: area.issue },
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#F4F7F6", letterSpacing: "-0.01em" }}>{String(s.value)}</div>
                    <div style={{ fontSize: "11px", color: "#8A9A96", marginTop: "2px" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Friction bar */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", color: "#8A9A96" }}>Friction intensity</span>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: area.color }}>{area.bar}%</span>
                </div>
                <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                  <div
                    className="friction-bar"
                    style={{ "--bar-w": `${area.bar}%`, background: area.color } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* Action */}
              <div
                style={{
                  background: "rgba(0,245,160,0.04)",
                  border: "1px solid rgba(0,245,160,0.1)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#00F5A0",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ flexShrink: 0 }}>→</span>
                {area.action}
              </div>
            </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
