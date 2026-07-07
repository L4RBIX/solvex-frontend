"use client";

import { useEffect, useRef } from "react";

const QUEUE = [
  { day: 1, focus: "Constructive",        problem: "Removals Game",                rating: 1000, reason: "High WA count on this tag",             tagColor: "#FF4D6D" },
  { day: 2, focus: "Games",              problem: "Sorting Game",                  rating: 1200, reason: "High retry cost on game theory",         tagColor: "#FACC15" },
  { day: 3, focus: "Shortest Paths",     problem: "Arrow Path",                    rating: 1300, reason: "Avg 3.4 attempts — needs discipline",     tagColor: "#00D9F5" },
  { day: 4, focus: "Trees & BST",        problem: "Sum in Binary Tree",            rating: 800,  reason: "Comfort zone solidification",             tagColor: "#00F5A0" },
  { day: 5, focus: "Implementation",     problem: "Replacement",                   rating: 1100, reason: "Pattern from WA frequency",              tagColor: "#00F5A0" },
  { day: 6, focus: "Mixed Practice",     problem: "Training Before the Olympiad", rating: 1200, reason: "Consolidate week's patterns",             tagColor: "#8A9A96" },
  { day: 7, focus: "Review & Reinforce", problem: "Red-Blue Shuffle",              rating: 800,  reason: "Light review, verify retention",         tagColor: "#8A9A96" },
];

export function QueueSection() {
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          table.querySelectorAll<HTMLElement>(".queue-row-reveal").forEach(el => el.classList.add("visible"));
          observer.unobserve(table);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(table);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="tx-section" style={{ paddingTop: "0" }}>
      <div className="tx-container">
        <div className="tx-section-header">
          <div className="section-badge" style={{ marginBottom: "20px" }}>7-Day Queue</div>
          <h2 className="tx-h2" style={{ marginBottom: "16px" }}>
            Problems chosen for your pattern,<br />not from a random list.
          </h2>
          <p className="tx-subtitle">Each recommendation has a reason.</p>
        </div>

        {/* Queue table card */}
        <div
          ref={tableRef}
          style={{
            background: "#06100D",
            border: "1px solid rgba(0,245,160,0.16)",
            borderRadius: "18px",
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "56px 140px 1fr 72px 1fr",
              gap: "0",
              padding: "12px 28px",
              background: "rgba(0,245,160,0.03)",
              borderBottom: "1px solid rgba(0,245,160,0.08)",
            }}
          >
            {["Day", "Focus", "Problem", "Rating", "Reason"].map((h) => (
              <div key={h} style={{ fontSize: "11px", fontWeight: 700, color: "#8A9A96", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {QUEUE.map((row, i) => (
            <div
              key={row.day}
              className={`queue-row-reveal queue-row-${i} queue-row-item`}
              style={{
                display: "grid",
                gridTemplateColumns: "56px 140px 1fr 72px 1fr",
                gap: "0",
                padding: "16px 28px",
                borderBottom: i < QUEUE.length - 1 ? "1px solid rgba(0,245,160,0.06)" : "none",
              }}
            >
              {/* Day */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#00F5A0",
                    fontFamily: "ui-monospace, monospace",
                  }}
                >
                  {row.day}
                </span>
              </div>

              {/* Focus */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: row.tagColor,
                    background: `${row.tagColor}12`,
                    borderRadius: "9999px",
                    padding: "3px 10px",
                  }}
                >
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: row.tagColor, display: "inline-block", flexShrink: 0 }} />
                  {row.focus}
                </span>
              </div>

              {/* Problem */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: "13.5px", fontWeight: 500, color: "#F4F7F6", letterSpacing: "-0.01em" }}>
                  {row.problem}
                </span>
              </div>

              {/* Rating */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#00F5A0",
                    fontFamily: "ui-monospace, monospace",
                    background: "rgba(0,245,160,0.08)",
                    borderRadius: "6px",
                    padding: "3px 8px",
                  }}
                >
                  {row.rating}
                </span>
              </div>

              {/* Reason */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: "12.5px", color: "#8A9A96", lineHeight: "18px" }}>
                  {row.reason}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile fallback — show simpler layout on small screens */}
        <style>{`
          @media (max-width: 640px) {
            .queue-table-row {
              grid-template-columns: 1fr !important;
              gap: 6px !important;
            }
            .queue-table-header { display: none !important; }
          }
        `}</style>
      </div>
    </section>
  );
}
