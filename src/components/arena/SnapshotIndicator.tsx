"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";

interface SnapshotIndicatorProps {
  savedAt: number | null;
  count: number;
}

export default function SnapshotIndicator({ savedAt, count }: SnapshotIndicatorProps) {
  // Visibility is derived: a save is "visible" until its timestamp is dismissed.
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const visible = savedAt !== null && savedAt !== dismissedAt;

  useEffect(() => {
    if (savedAt !== null) {
      const t = setTimeout(() => setDismissedAt(savedAt), 3500);
      return () => clearTimeout(t);
    }
  }, [savedAt]);

  if (visible) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          fontSize: "10px",
          fontFamily: "ui-monospace, monospace",
          color: "#00F5A0",
          transition: "opacity 0.2s",
        }}
      >
        <Save size={10} />
        Saved
      </div>
    );
  }

  if (count > 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          fontSize: "10px",
          fontFamily: "ui-monospace, monospace",
          color: "rgba(138,154,150,0.5)",
        }}
      >
        <Save size={10} />
        Local draft snapshots ({count})
      </div>
    );
  }

  return null;
}
