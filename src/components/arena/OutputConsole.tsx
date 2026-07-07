"use client";

import { useState } from "react";
import { Terminal, AlertTriangle, Gavel, Activity, Wifi, WifiOff } from "lucide-react";
import type { ExecutionResult, ExecutionStatus } from "@/types/execution";
import type { ArenaEvent } from "@/types/arena";

interface OutputConsoleProps {
  result: ExecutionResult | null;
  isRunning: boolean;
  events: ArenaEvent[];
}

type ConsoleTab = "output" | "errors" | "judge" | "events";

const STATUS_CONFIG: Record<ExecutionStatus, { label: string; color: string }> = {
  not_run:           { label: "Not Run",           color: "#3A5A4A" },
  running:           { label: "Running…",          color: "#00D9F5" },
  accepted:          { label: "Accepted",          color: "#00F5A0" },
  wrong_answer:      { label: "Wrong Answer",      color: "#FF4D6D" },
  runtime_error:     { label: "Runtime Error",     color: "#FF6B00" },
  time_limit:        { label: "Time Limit",        color: "#FACC15" },
  compilation_error: { label: "Compilation Error", color: "#C586C0" },
  error:             { label: "Error",             color: "#FF4D6D" },
};

const TABS: Array<{ id: ConsoleTab; label: string; Icon: React.ElementType }> = [
  { id: "output", label: "Output",  Icon: Terminal },
  { id: "errors", label: "Errors",  Icon: AlertTriangle },
  { id: "judge",  label: "Judge",   Icon: Gavel },
  { id: "events", label: "Events",  Icon: Activity },
];

export default function OutputConsole({ result, isRunning, events }: OutputConsoleProps) {
  const [tab, setTab] = useState<ConsoleTab>("output");

  const status = isRunning ? "running" : (result?.status ?? "not_run");
  const statusInfo = STATUS_CONFIG[status as ExecutionStatus] ?? STATUS_CONFIG.not_run;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        fontFamily: "ui-monospace, monospace",
        fontSize: "12px",
        background: "#030B07",
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid rgba(0,245,160,0.08)",
          flexShrink: 0,
        }}
      >
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "10px 14px",
              fontSize: "11px",
              fontFamily: "ui-monospace, monospace",
              border: "none",
              borderBottom: tab === id ? "2px solid #00F5A0" : "2px solid transparent",
              background: "transparent",
              color: tab === id ? "#00F5A0" : "#3A5A4A",
              cursor: "pointer",
              transition: "color 0.15s",
              marginBottom: "-1px",
            }}
            onMouseEnter={(e) => {
              if (id !== tab) (e.currentTarget as HTMLButtonElement).style.color = "#6A8A7A";
            }}
            onMouseLeave={(e) => {
              if (id !== tab) (e.currentTarget as HTMLButtonElement).style.color = "#3A5A4A";
            }}
          >
            <Icon size={11} />
            {label}
          </button>
        ))}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", padding: "0 12px" }}>
          {result?.is_mock === false ? (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#00F5A0" }}>
              <Wifi size={10} />Judge0
            </span>
          ) : result?.is_mock === true ? (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#3A5A4A" }}>
              <WifiOff size={10} />Local demo
            </span>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
        {tab === "output" && (
          <>
            {isRunning ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#00D9F5" }}>
                <span
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    border: "2px solid #00D9F5",
                    borderTopColor: "transparent",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Running selected test…
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : result ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <span style={{ color: statusInfo.color }}>{statusInfo.label}</span>
                  {result.time_ms != null && (
                    <span style={{ color: "#2A4A3A" }}>· {result.time_ms}ms</span>
                  )}
                  {result.memory_kb != null && (
                    <span style={{ color: "#2A4A3A" }}>· {Math.round(result.memory_kb / 1024)}MB</span>
                  )}
                </div>
                {result.stdout ? (
                  <pre style={{ color: "#8AB5A0", whiteSpace: "pre-wrap", lineHeight: "20px", margin: 0 }}>
                    {result.stdout}
                  </pre>
                ) : result.message ? (
                  <p style={{ color: "#3A5A4A", lineHeight: "20px", margin: 0 }}>
                    {result.message}
                  </p>
                ) : (
                  <p style={{ color: "#2A4A3A", margin: 0 }}>No output.</p>
                )}
              </>
            ) : (
              <p style={{ color: "#2A4A3A", margin: 0 }}>Run a test to see output here.</p>
            )}
          </>
        )}

        {tab === "errors" && (
          <>
            {isRunning ? (
              <p style={{ color: "#3A5A4A", margin: 0 }}>Running…</p>
            ) : result?.compile_error ? (
              <pre style={{ color: "#C586C0", whiteSpace: "pre-wrap", lineHeight: "20px", margin: 0 }}>
                {result.compile_error}
              </pre>
            ) : result?.stderr ? (
              <pre style={{ color: "#FF6B00", whiteSpace: "pre-wrap", lineHeight: "20px", margin: 0 }}>
                {result.stderr}
              </pre>
            ) : (
              <p style={{ color: "#2A4A3A", margin: 0 }}>No errors.</p>
            )}
          </>
        )}

        {tab === "judge" && (
          <div>
            {result?.is_mock ? (
              <div
                style={{
                  borderRadius: "8px",
                  border: "1px solid rgba(0,245,160,0.1)",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <p style={{ color: "#3A5A4A", margin: 0 }}>Execution backend not connected yet.</p>
                <p style={{ color: "#2A4A3A", margin: 0 }}>
                  Connect Judge0 through{" "}
                  <span style={{ color: "#3A5A4A" }}>POST /api/execute</span> to run real submissions.
                </p>
                <p style={{ color: "#2A4A3A", margin: 0 }}>
                  Judge0 integration ready — awaiting backend connection.
                </p>
              </div>
            ) : result ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {[
                  { label: "Status", value: statusInfo.label, color: statusInfo.color },
                  { label: "Time",   value: result.time_ms != null ? `${result.time_ms}ms` : "—", color: "#8A9A96" },
                  { label: "Memory", value: result.memory_kb != null ? `${Math.round(result.memory_kb / 1024)} MB` : "—", color: "#8A9A96" },
                ].map((row, i, arr) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: i < arr.length - 1 ? "1px solid rgba(0,245,160,0.06)" : "none",
                    }}
                  >
                    <span style={{ color: "#3A5A4A" }}>{row.label}</span>
                    <span style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#2A4A3A", margin: 0 }}>No judge result yet.</p>
            )}
          </div>
        )}

        {tab === "events" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {events.length === 0 ? (
              <p style={{ color: "#2A4A3A", margin: 0 }}>Session events will appear here.</p>
            ) : (
              [...events].reverse().slice(0, 40).map((ev, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", padding: "2px 0" }}>
                  <span style={{ color: "#1A3A2A", flexShrink: 0 }}>
                    {new Date(ev.timestamp).toLocaleTimeString("en", { hour12: false })}
                  </span>
                  <span
                    style={{
                      color:
                        ev.type === "run_clicked" || ev.type === "test_case_run" ? "#00D9F5"
                        : ev.type === "result_received" ? "#00F5A0"
                        : ev.type === "submit_clicked" ? "#C586C0"
                        : "#3A5A4A",
                    }}
                  >
                    {ev.type}
                  </span>
                  {ev.language && (
                    <span style={{ color: "#1A3A2A" }}>{ev.language}</span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
