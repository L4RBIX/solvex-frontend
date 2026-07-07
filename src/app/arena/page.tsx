import { Suspense } from "react";
import type { Metadata } from "next";
import ArenaLayout from "@/components/arena/ArenaLayout";

export const metadata: Metadata = {
  title: "Arena — SolveX Compiler Workspace",
  description: "SolveX Arena: in-browser compiler workspace for competitive programming practice.",
};

function LoadingArena() {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "#020806",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #00F5A0, #00D9F5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-rebond, system-ui)",
          fontWeight: 900,
          fontSize: "16px",
          color: "#020806",
        }}
      >
        SX
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            width: "14px",
            height: "14px",
            border: "2px solid #00F5A0",
            borderTopColor: "transparent",
            borderRadius: "50%",
            display: "inline-block",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <span style={{ fontSize: "13px", fontFamily: "ui-monospace, monospace", color: "#3A5A4A" }}>
          Loading Arena…
        </span>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function ArenaPage() {
  return (
    <Suspense fallback={<LoadingArena />}>
      <ArenaLayout />
    </Suspense>
  );
}
