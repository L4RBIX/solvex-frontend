"use client";

import { Bot, FlaskConical, Terminal } from "lucide-react";

export type ArenaRightTab = "tests" | "console" | "copilot";

interface Props {
  active: ArenaRightTab;
  onSelect: (tab: ArenaRightTab) => void;
  busy: boolean;
  duelMode: boolean;
}

export default function ArenaRightTabs({ active, onSelect, busy, duelMode }: Props) {
  const tabs = [
    { id: "tests", Icon: FlaskConical, label: "Tests" },
    { id: "console", Icon: Terminal, label: "Console" },
    ...(!duelMode ? [{ id: "copilot", Icon: Bot, label: "Copilot" }] : []),
  ] as Array<{ id: ArenaRightTab; Icon: typeof Terminal; label: string }>;

  return (
    <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid rgba(0,245,160,0.08)", background: "#020806", flexShrink: 0 }}>
      {tabs.map(({ id, Icon, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          style={{
            display: "flex", alignItems: "center", gap: "5px", padding: "10px 14px",
            fontSize: "11px", fontFamily: "ui-monospace, monospace", background: "none", border: "none",
            borderBottom: active === id ? "2px solid #00F5A0" : "2px solid transparent",
            color: active === id ? "#00F5A0" : "#3A5A4A", cursor: "pointer", marginBottom: "-1px",
          }}
        >
          <Icon size={11} />
          {label}
          {id === "console" && busy && <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#00D9F5" }} />}
        </button>
      ))}
      {duelMode && (
        <span style={{ marginLeft: "auto", padding: "0 10px", fontSize: "10px", color: "#FFAA33" }}>
          Copilot is disabled during PvP to keep the duel fair.
        </span>
      )}
    </div>
  );
}
