"use client";

import { ExternalLink, Clock, HardDrive, Tag } from "lucide-react";
import type { ArenaProblem } from "@/types/arena";

interface ProblemPanelProps {
  problem: ArenaProblem;
}

function ratingColor(rating: number): string {
  if (rating >= 2400) return "#FF3333";
  if (rating >= 2100) return "#FF6600";
  if (rating >= 1900) return "#FF6600";
  if (rating >= 1600) return "#AA00AA";
  if (rating >= 1400) return "#0000FF";
  if (rating >= 1200) return "#008000";
  return "#8A9A96";
}

export default function ProblemPanel({ problem }: ProblemPanelProps) {
  const cfUrl = problem.official_url ?? (problem.is_sample
    ? "https://codeforces.com/problemset"
    : (() => {
        const m = /^(\d+)([A-Za-z][A-Za-z0-9]*)$/.exec(problem.key);
        return m
          ? `https://codeforces.com/problemset/problem/${m[1]}/${m[2]}`
          : "https://codeforces.com/problemset";
      })());

  const rc = ratingColor(problem.rating);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Panel header */}
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid rgba(0,245,160,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: "10px",
            fontFamily: "ui-monospace, monospace",
            fontWeight: 700,
            color: "#4A6A5A",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Problem
        </span>
        <a
          href={cfUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "10px",
            fontFamily: "ui-monospace, monospace",
            color: "#4A6A5A",
            textDecoration: "none",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#00F5A0")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#4A6A5A")}
        >
          <ExternalLink size={10} />
          Codeforces
        </a>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Title + rating */}
        <div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
            <h1 style={{ fontSize: "15px", fontWeight: 700, color: "#F4F7F6", letterSpacing: "-0.02em", lineHeight: 1.3, margin: 0 }}>
              {problem.name}
            </h1>
            <span
              style={{
                flexShrink: 0,
                fontSize: "11px",
                fontFamily: "ui-monospace, monospace",
                fontWeight: 700,
                color: rc,
                background: `${rc}18`,
                border: `1px solid ${rc}35`,
                borderRadius: "6px",
                padding: "2px 7px",
              }}
            >
              {problem.rating}
            </span>
          </div>

          {problem.is_sample && (
            <span
              style={{
                display: "inline-block",
                fontSize: "10px",
                fontFamily: "ui-monospace, monospace",
                color: "#4A6A5A",
                border: "1px solid rgba(0,245,160,0.12)",
                borderRadius: "4px",
                padding: "2px 8px",
                marginBottom: "8px",
              }}
            >
              Sample training problem
            </span>
          )}

          {/* Tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "10px" }}>
            {problem.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "10px",
                  fontFamily: "ui-monospace, monospace",
                  color: "#6A8A7A",
                  background: "rgba(0,245,160,0.04)",
                  border: "1px solid rgba(0,245,160,0.1)",
                  borderRadius: "4px",
                  padding: "2px 7px",
                }}
              >
                <Tag size={8} />
                {tag}
              </span>
            ))}
          </div>

          {/* Limits */}
          <div style={{ display: "flex", gap: "16px" }}>
            {[
              { icon: <Clock size={10} />, text: problem.time_limit },
              { icon: <HardDrive size={10} />, text: problem.memory_limit },
            ].map((item, i) => (
              <span
                key={i}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  fontFamily: "ui-monospace, monospace",
                  color: "#4A6A5A",
                }}
              >
                {item.icon}
                {item.text}
              </span>
            ))}
          </div>
        </div>

        {/* Statement */}
        <p style={{ fontSize: "13px", color: "#C8D4D0", lineHeight: "21px", margin: 0 }}>
          {problem.statement}
        </p>

        {/* Input */}
        <div>
          <h3
            style={{
              fontSize: "10px",
              fontFamily: "ui-monospace, monospace",
              fontWeight: 700,
              color: "#4A6A5A",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "6px",
            }}
          >
            Input
          </h3>
          <p style={{ fontSize: "13px", color: "#B0C0BC", lineHeight: "21px", margin: 0 }}>
            {problem.input_format}
          </p>
        </div>

        {/* Output */}
        <div>
          <h3
            style={{
              fontSize: "10px",
              fontFamily: "ui-monospace, monospace",
              fontWeight: 700,
              color: "#4A6A5A",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "6px",
            }}
          >
            Output
          </h3>
          <p style={{ fontSize: "13px", color: "#B0C0BC", lineHeight: "21px", margin: 0 }}>
            {problem.output_format}
          </p>
        </div>

        {problem.constraints && (
          <div>
            <h3 style={{ fontSize: "10px", fontFamily: "ui-monospace, monospace", fontWeight: 700, color: "#4A6A5A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
              Constraints
            </h3>
            <p style={{ fontSize: "13px", color: "#9EB5AF", lineHeight: "20px", margin: 0 }}>{problem.constraints}</p>
          </div>
        )}

        {/* Examples */}
        <div>
          <h3
            style={{
              fontSize: "10px",
              fontFamily: "ui-monospace, monospace",
              fontWeight: 700,
              color: "#4A6A5A",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "8px",
            }}
          >
            Examples
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {problem.sample_tests.map((test, i) => (
              <div
                key={i}
                style={{
                  borderRadius: "8px",
                  border: "1px solid rgba(0,245,160,0.1)",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                  <div style={{ padding: "10px 12px", borderRight: "1px solid rgba(0,245,160,0.1)" }}>
                    <p style={{ fontSize: "9px", fontFamily: "ui-monospace, monospace", color: "#3A5A4A", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Input
                    </p>
                    <pre style={{ fontSize: "12px", fontFamily: "ui-monospace, monospace", color: "#9EB5AF", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: "18px", margin: 0 }}>
                      {test.input}
                    </pre>
                  </div>
                  <div style={{ padding: "10px 12px" }}>
                    <p style={{ fontSize: "9px", fontFamily: "ui-monospace, monospace", color: "#3A5A4A", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Output
                    </p>
                    <pre style={{ fontSize: "12px", fontFamily: "ui-monospace, monospace", color: "#9EB5AF", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: "18px", margin: 0 }}>
                      {test.output}
                    </pre>
                  </div>
                </div>
                {test.note && (
                  <div style={{ borderTop: "1px solid rgba(0,245,160,0.08)", padding: "8px 12px" }}>
                    <p style={{ fontSize: "11px", color: "#6A8A7A", lineHeight: "16px", margin: 0 }}>
                      <span style={{ fontFamily: "ui-monospace, monospace", color: "#3A5A4A" }}>Note: </span>
                      {test.note}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {problem.notes && (
          <div>
            <h3
              style={{
                fontSize: "10px",
                fontFamily: "ui-monospace, monospace",
                fontWeight: 700,
                color: "#4A6A5A",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "6px",
              }}
            >
              Notes
            </h3>
            <p style={{ fontSize: "13px", color: "#9EB5AF", lineHeight: "20px", margin: 0 }}>
              {problem.notes}
            </p>
          </div>
        )}

        <div style={{ paddingBottom: "16px" }} />
      </div>
    </div>
  );
}
