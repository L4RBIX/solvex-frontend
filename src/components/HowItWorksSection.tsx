"use client";

import { RevealOnScroll } from "@/components/animations/motion";

/* Mini UI helper components */
function InputMockup() {
  return (
    <div
      style={{
        background: "rgba(0,245,160,0.04)",
        border: "1px solid rgba(0,245,160,0.2)",
        borderRadius: "9999px",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginTop: "16px",
      }}
    >
      <span style={{ fontSize: "12px", color: "rgba(244,247,246,0.4)", flex: 1 }}>Dan1c</span>
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "#020806",
          background: "#00F5A0",
          borderRadius: "9999px",
          padding: "3px 12px",
        }}
      >
        Analyze
      </span>
    </div>
  );
}

function TagChips() {
  const tags = [
    { label: "Constructive", color: "#FF4D6D" },
    { label: "Games", color: "#FACC15" },
    { label: "Shortest Paths", color: "#00D9F5" },
  ];
  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "16px" }}>
      {tags.map((t) => (
        <span
          key={t.label}
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: t.color,
            background: `${t.color}14`,
            border: `1px solid ${t.color}30`,
            borderRadius: "9999px",
            padding: "3px 10px",
          }}
        >
          {t.label}
        </span>
      ))}
    </div>
  );
}

function ProblemRowsMockup() {
  const rows = [
    { day: "Day 1", focus: "Constructive", rating: 1000, color: "#FF4D6D" },
    { day: "Day 2", focus: "Games",        rating: 1200, color: "#FACC15" },
    { day: "Day 3", focus: "Shortest Path",rating: 1300, color: "#00D9F5" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "16px" }}>
      {rows.map((r) => (
        <div
          key={r.day}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "6px 10px",
            background: "rgba(255,255,255,0.025)",
            borderRadius: "7px",
          }}
        >
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: r.color, flexShrink: 0, display: "inline-block" }} />
          <span style={{ fontSize: "11px", color: "#8A9A96", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {r.day} · {r.focus}
          </span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "#00F5A0",
              fontFamily: "ui-monospace, monospace",
              background: "rgba(0,245,160,0.08)",
              borderRadius: "4px",
              padding: "2px 6px",
            }}
          >
            {r.rating}
          </span>
        </div>
      ))}
    </div>
  );
}

function TimelineMockup() {
  const steps = [
    { label: "WA on test 3",       color: "#FF4D6D", done: true },
    { label: "TLE on test 7",      color: "#FACC15", done: true },
    { label: "WA edge case",       color: "#FF4D6D", done: true },
    { label: "Accepted",           color: "#00F5A0", done: false },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "16px" }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: s.done ? s.color : "rgba(255,255,255,0.12)",
              border: s.done ? "none" : `1px solid ${s.color}`,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "12px", color: s.done ? "#8A9A96" : s.color, fontWeight: s.done ? 400 : 600 }}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

const steps = [
  {
    num: "01",
    title: "Connect Codeforces",
    body: "Enter your public Codeforces handle. No login, no token, no account required.",
    mini: <InputMockup />,
    comingSoon: false,
  },
  {
    num: "02",
    title: "Detect friction patterns",
    body: "SolveX analyzes verdicts, tags, attempts before AC, WA/TLE patterns, avoided topics, and rating buckets.",
    mini: <TagChips />,
    comingSoon: false,
  },
  {
    num: "03",
    title: "Follow a focused queue",
    body: "Get problems selected from your weak tags, comfort rating range, and retry patterns.",
    mini: <ProblemRowsMockup />,
    comingSoon: false,
  },
  {
    num: "04",
    title: "Verify improvement",
    body: "SkillTrace will record run attempts, errors, code evolution, and hidden test results during verification challenges.",
    mini: <TimelineMockup />,
    comingSoon: true,
  },
];

const capabilities = [
  { icon: "◈", title: "Submission analysis",       body: "Aggregates all public submissions by verdict and tag across your full history." },
  { icon: "◉", title: "Friction area detection",   body: "Finds topics with high retry cost, WA/TLE patterns, or systematic avoidance." },
  { icon: "◆", title: "Error pattern breakdown",   body: "WA, TLE, RE, and CE counts by topic — not just totals." },
  { icon: "◎", title: "Rating comfort zone",        body: "Your effective problem-rating range based on AC success vs. retry patterns." },
  { icon: "◇", title: "7-day training queue",       body: "Problems selected by tag priority and rating range, not random or popular." },
  { icon: "◈", title: "SkillTrace verification",    body: "Process-based improvement verification. Records solving attempts, not just results.", comingSoon: true },
];

export function HowItWorksSection() {
  return (
    <>
      {/* How it works */}
      <section id="how-it-works" className="tx-section">
        <div className="tx-container">
          <div className="tx-section-header">
            <div className="section-badge" style={{ marginBottom: "20px" }}>Process</div>
            <h2 className="tx-h2" style={{ marginBottom: "16px" }}>How SolveX works</h2>
            <p className="tx-subtitle">From public submissions to a focused training plan.</p>
          </div>

          <div
            className="how-grid-2col"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
          >
            {steps.map((step, i) => (
              <RevealOnScroll key={step.num} delay={i + 1}>
                <div
                  className="tx-card"
                  style={{
                    padding: "28px",
                    opacity: step.comingSoon ? 0.7 : 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 800,
                        color: "#00F5A0",
                        fontFamily: "var(--font-rebond, system-ui)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {step.num}
                    </span>
                    {step.comingSoon && <span className="badge-coming-soon">Coming soon</span>}
                  </div>
                  <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#F4F7F6", marginBottom: "8px", letterSpacing: "-0.02em" }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: "14px", lineHeight: "22px", color: "#8A9A96" }}>
                    {step.body}
                  </p>
                  {step.mini}
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section style={{ paddingBottom: "120px" }}>
        <div className="tx-container">
          <div className="tx-section-header">
            <h2 className="tx-h2">Everything you need to train with intent.</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
            {capabilities.map((cap, i) => (
              <RevealOnScroll key={cap.title} delay={i + 1}>
                <div
                  className="tx-card"
                  style={{
                    padding: "24px",
                    opacity: cap.comingSoon ? 0.65 : 1,
                    cursor: "default",
                  }}
                >
                  <div style={{ fontSize: "20px", color: "#00F5A0", marginBottom: "14px", lineHeight: 1 }}>
                    {cap.icon}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#F4F7F6", letterSpacing: "-0.01em" }}>
                      {cap.title}
                    </h3>
                    {cap.comingSoon && <span className="badge-coming-soon">Soon</span>}
                  </div>
                  <p style={{ fontSize: "13px", lineHeight: "20px", color: "#8A9A96" }}>{cap.body}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
