"use client";

import { useState } from "react";
import { Plus, Play, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { TestCase } from "@/types/arena";
import type { ExecutionStatus } from "@/types/execution";

interface TestCasePanelProps {
  testCases: TestCase[];
  onRun: (id: string) => void;
  onRunAll: () => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: "input" | "expected_output", value: string) => void;
  isRunning: boolean;
  runningId: string | null;
  localOnly?: boolean;
}

const STATUS_DOT: Record<ExecutionStatus, string> = {
  not_run:           "#2A4A3A",
  running:           "#00D9F5",
  accepted:          "#00F5A0",
  wrong_answer:      "#FF4D6D",
  runtime_error:     "#FF6B00",
  time_limit:        "#FACC15",
  compilation_error: "#C586C0",
  no_tests:           "#FFAA33",
  error:             "#FF4D6D",
};

const STATUS_LABEL: Record<ExecutionStatus, string> = {
  not_run:           "Not run",
  running:           "Running…",
  accepted:          "Accepted",
  wrong_answer:      "Wrong Answer",
  runtime_error:     "Runtime Error",
  time_limit:        "Time Limit",
  compilation_error: "Compile Error",
  no_tests:           "Judging unavailable",
  error:             "Error",
};

function TestCaseItem({
  tc,
  onRun,
  onDelete,
  onUpdate,
  isRunning,
  localOnly,
}: {
  tc: TestCase;
  onRun: () => void;
  onDelete: () => void;
  onUpdate: (field: "input" | "expected_output", value: string) => void;
  isRunning: boolean;
  localOnly: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const dotColor = STATUS_DOT[tc.status];
  const label =
    localOnly && tc.status === "accepted"
      ? tc.expected_output.trim()
        ? "Output matched"
        : "Ran successfully"
      : localOnly && tc.status === "wrong_answer"
        ? "Output differs"
        : STATUS_LABEL[tc.status];

  const actualColor =
    tc.status === "accepted" ? "#00F5A0"
    : tc.status === "wrong_answer" ? "#FF6680"
    : "#8A9A96";
  const readOnly = tc.is_sample && !localOnly;

  return (
    <div
      style={{
        border: "1px solid rgba(0,245,160,0.1)",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      {/* Row header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 10px",
          cursor: "pointer",
          transition: "background 0.1s",
        }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "rgba(0,245,160,0.03)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
      >
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: "11px", fontFamily: "ui-monospace, monospace", color: "#8A9A96", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {tc.label}
        </span>
        <span style={{ fontSize: "10px", fontFamily: "ui-monospace, monospace", color: dotColor, flexShrink: 0 }}>
          {tc.status === "running" ? (
            <span
              style={{
                display: "inline-block",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                border: "1.5px solid #00D9F5",
                borderTopColor: "transparent",
                animation: "spin 0.7s linear infinite",
              }}
            />
          ) : label}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginLeft: "4px" }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRun(); }}
            disabled={isRunning}
            style={{
              padding: "3px",
              background: "none",
              border: "none",
              color: "#2A4A3A",
              cursor: isRunning ? "not-allowed" : "pointer",
              opacity: isRunning ? 0.4 : 1,
              display: "flex",
              alignItems: "center",
              transition: "color 0.1s",
            }}
            onMouseEnter={(e) => { if (!isRunning) (e.currentTarget as HTMLButtonElement).style.color = "#00F5A0"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#2A4A3A"; }}
            title="Run this test"
          >
            <Play size={11} />
          </button>
          {!tc.is_sample && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              style={{
                padding: "3px",
                background: "none",
                border: "none",
                color: "#2A4A3A",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                transition: "color 0.1s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#FF4D6D"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#2A4A3A"; }}
            >
              <Trash2 size={11} />
            </button>
          )}
          {expanded ? <ChevronUp size={11} style={{ color: "#2A4A3A" }} /> : <ChevronDown size={11} style={{ color: "#2A4A3A" }} />}
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid rgba(0,245,160,0.08)",
            padding: "10px",
            background: "#020B06",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {[
            { label: "Input", field: "input" as const, value: tc.input },
            { label: "Expected (optional)", field: "expected_output" as const, value: tc.expected_output },
          ].map(({ label, field, value }) => (
            <div key={field}>
              <label
                style={{
                  display: "block",
                  fontSize: "9px",
                  fontFamily: "ui-monospace, monospace",
                  color: "#2A4A3A",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "4px",
                }}
              >
                {label}
              </label>
              <textarea
                value={value}
                onChange={(e) => onUpdate(field, e.target.value)}
                readOnly={readOnly}
                rows={2}
                style={{
                  width: "100%",
                  background: "#030D08",
                  border: "1px solid rgba(0,245,160,0.1)",
                  borderRadius: "6px",
                  padding: "6px 8px",
                  fontSize: "11px",
                  fontFamily: "ui-monospace, monospace",
                  color: "#9EB5AF",
                  lineHeight: "18px",
                  resize: "none",
                  outline: "none",
                  opacity: readOnly ? 0.7 : 1,
                  cursor: readOnly ? "default" : "text",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,245,160,0.3)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,245,160,0.1)"; }}
              />
            </div>
          ))}

          {tc.actual_output != null && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "9px",
                  fontFamily: "ui-monospace, monospace",
                  color: "#2A4A3A",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "4px",
                }}
              >
                Actual
              </label>
              <pre
                style={{
                  width: "100%",
                  background: "#030D08",
                  border: `1px solid ${tc.status === "accepted" ? "rgba(0,245,160,0.2)" : tc.status === "wrong_answer" ? "rgba(255,77,109,0.2)" : "rgba(0,245,160,0.1)"}`,
                  borderRadius: "6px",
                  padding: "6px 8px",
                  fontSize: "11px",
                  fontFamily: "ui-monospace, monospace",
                  color: actualColor,
                  lineHeight: "18px",
                  whiteSpace: "pre-wrap",
                  margin: 0,
                  boxSizing: "border-box",
                }}
              >
                {tc.actual_output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TestCasePanel({
  testCases,
  onRun,
  onRunAll,
  onAdd,
  onDelete,
  onUpdate,
  isRunning,
  runningId,
  localOnly = false,
}: TestCasePanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "8px 10px",
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
            color: "#3A5A4A",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {localOnly ? "Local tests" : "Tests"} ({testCases.length})
        </span>
        <div style={{ display: "flex", gap: "4px" }}>
          {[
            { icon: <Play size={9} />, label: "All", onClick: onRunAll, title: "Run all" },
            { icon: <Plus size={9} />, label: "Add", onClick: onAdd, title: "Add custom test" },
          ].map(({ icon, label, onClick, title }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              disabled={isRunning && label === "All"}
              title={title}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                fontSize: "10px",
                fontFamily: "ui-monospace, monospace",
                color: "#3A5A4A",
                background: "none",
                border: "1px solid rgba(0,245,160,0.1)",
                borderRadius: "6px",
                cursor: "pointer",
                opacity: isRunning && label === "All" ? 0.4 : 1,
                transition: "color 0.1s, border-color 0.1s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#00F5A0";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,245,160,0.3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#3A5A4A";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,245,160,0.1)";
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {localOnly && (
        <div
          style={{
            padding: "8px 10px",
            borderBottom: "1px solid rgba(0,217,245,0.1)",
            background: "rgba(0,217,245,0.04)",
            color: "#6A8A7A",
            fontSize: "10px",
            lineHeight: "15px",
          }}
        >
          Use public samples or add your own input and optional expected output.
          Results are local practice runs, not official Codeforces judging.
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        {testCases.map((tc) => (
          <TestCaseItem
            key={tc.id}
            tc={{ ...tc, status: runningId === tc.id ? "running" : tc.status }}
            onRun={() => onRun(tc.id)}
            onDelete={() => onDelete(tc.id)}
            onUpdate={(field, value) => onUpdate(tc.id, field, value)}
            isRunning={isRunning}
            localOnly={localOnly}
          />
        ))}
      </div>
    </div>
  );
}
