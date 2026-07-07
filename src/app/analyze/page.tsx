import { Suspense } from "react";
import { AnalyzeContent } from "./AnalyzeContent";

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#050A08",
            color: "#8A9A96",
            fontSize: "16px",
          }}
        >
          Loading…
        </div>
      }
    >
      <AnalyzeContent />
    </Suspense>
  );
}
