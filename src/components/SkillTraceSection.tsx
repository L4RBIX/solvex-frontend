"use client";

import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { RevealOnScroll } from "@/components/animations/motion";

const timelineSteps = [
  { label: "Wrong Answer on test 3",  color: "#FF4D6D", status: "err" },
  { label: "Time Limit Exceeded",     color: "#FACC15", status: "err" },
  { label: "Wrong Answer — edge case",color: "#FF4D6D", status: "err" },
  { label: "Accepted",                color: "#00F5A0", status: "ok"  },
];

const features = [
  "Process-based challenge — not just final answer",
  "Shareable process report",
  "Evidence trail of attempts and decisions",
  "Not yet released — join the waitlist",
];

export function SkillTraceSection() {
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = timelineRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          container.querySelectorAll<HTMLElement>(".st-step").forEach(el => el.classList.add("visible"));
          observer.unobserve(container);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="tx-section">
      <div className="tx-container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "56px",
            alignItems: "center",
          }}
        >
          {/* Left: content */}
          <RevealOnScroll>
          <div>
            <div className="section-badge" style={{ marginBottom: "24px", color: "#00D9F5", borderColor: "rgba(0,217,245,0.28)", background: "rgba(0,217,245,0.07)" }}>
              Coming next
            </div>
            <h2 className="tx-h2" style={{ marginBottom: "16px" }}>
              SkillTrace verification<br />
              <span style={{ color: "#00D9F5" }}>is coming next.</span>
            </h2>
            <p style={{ fontSize: "17px", lineHeight: "28px", color: "#8A9A96", marginBottom: "32px" }}>
              SolveX first finds what to train. SkillTrace will verify improvement by recording the full process of solving: run attempts, errors, code evolution, and the final accepted result.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
              {features.map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <Check
                    size={15}
                    strokeWidth={2.25}
                    color="#00D9F5"
                    aria-hidden="true"
                    style={{ flexShrink: 0, marginTop: "3.5px" }}
                  />
                  <span style={{ fontSize: "14.5px", color: "#c8d4d0", lineHeight: "22px" }}>{f}</span>
                </div>
              ))}
            </div>
            <a
              href="mailto:kydyrbekbekarys44@gmail.com?subject=SkillTrace%20waitlist"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(0,217,245,0.08)",
                border: "1px solid rgba(0,217,245,0.28)",
                color: "#00D9F5",
                fontSize: "13.5px",
                fontWeight: 600,
                padding: "10px 22px",
                borderRadius: "9999px",
                textDecoration: "none",
                transition: "background 0.2s",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,217,245,0.15)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,217,245,0.08)"; }}
            >
              Join waitlist
            </a>
          </div>
          </RevealOnScroll>

          {/* Right: timeline card */}
          <RevealOnScroll delay={2}>
          <div>
            <div
              className="tx-card"
              style={{
                padding: "32px",
                borderColor: "rgba(0,217,245,0.2)",
                background: "rgba(0, 15, 12, 0.8)",
              }}
            >
              {/* Card header */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#00D9F5", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                  SkillTrace · Verification record
                </div>
                <div style={{ fontSize: "14px", color: "#8A9A96" }}>
                  Arrow Path · Rating 1300 · Shortest Paths
                </div>
              </div>

              {/* Timeline */}
              <div style={{ position: "relative", paddingLeft: "24px" }}>
                {/* Vertical line */}
                <div
                  style={{
                    position: "absolute",
                    left: "7px",
                    top: "8px",
                    bottom: "8px",
                    width: "1px",
                    background: "rgba(0,217,245,0.15)",
                  }}
                />

                <div ref={timelineRef} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {timelineSteps.map((step, i) => (
                    <div
                      key={i}
                      className={`st-step st-step-${i}${step.status === "ok" ? " st-step-ac" : ""}`}
                      style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}
                    >
                      {/* Dot */}
                      <div
                        className={step.status === "ok" ? "st-dot-ac" : undefined}
                        style={{
                          position: "absolute",
                          left: "3px",
                          width: "9px",
                          height: "9px",
                          borderRadius: "50%",
                          background: step.color,
                          marginTop: "5px",
                          boxShadow: step.status === "ok" ? `0 0 8px ${step.color}` : "none",
                        }}
                      />
                      <div style={{ paddingTop: "1px" }}>
                        <div
                          style={{
                            fontSize: "13.5px",
                            fontWeight: step.status === "ok" ? 600 : 400,
                            color: step.status === "ok" ? step.color : "#c8d4d0",
                          }}
                        >
                          {step.label}
                        </div>
                        {step.status === "err" && (
                          <div style={{ fontSize: "11px", color: "#8A9A96", marginTop: "2px" }}>
                            Attempt {i + 1} · recorded
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div
                style={{
                  marginTop: "24px",
                  background: "rgba(0,217,245,0.04)",
                  border: "1px solid rgba(0,217,245,0.1)",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  fontSize: "12px",
                  color: "#8A9A96",
                  lineHeight: "19px",
                }}
              >
                SkillTrace records the process — it does not certify results or claim anti-cheating guarantees.
              </div>
            </div>
          </div>
          </RevealOnScroll>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #skilltrace-section-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
