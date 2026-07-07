"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import type { ExecutionLanguage } from "@/types/execution";
import { JUDGE0_LANGUAGE_MAP } from "@/types/execution";

interface LanguageSelectProps {
  value: ExecutionLanguage;
  onChange: (lang: ExecutionLanguage) => void;
  disabled?: boolean;
}

const LANGUAGES = Object.entries(JUDGE0_LANGUAGE_MAP).map(([key, cfg]) => ({
  value: key as ExecutionLanguage,
  label: cfg.display_name,
}));

export default function LanguageSelect({ value, onChange, disabled }: LanguageSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const current = JUDGE0_LANGUAGE_MAP[value];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "8px",
          border: open
            ? "1px solid rgba(0,245,160,0.4)"
            : "1px solid rgba(0,245,160,0.12)",
          background: "rgba(0,245,160,0.04)",
          color: open ? "#00F5A0" : "#9EB5AF",
          fontSize: "12px",
          fontFamily: "ui-monospace, monospace",
          fontWeight: 500,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.4 : 1,
          transition: "border-color 0.15s, color 0.15s",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#00F5A0",
            opacity: 0.7,
            flexShrink: 0,
          }}
        />
        {current.display_name}
        <ChevronDown
          size={12}
          style={{
            transition: "transform 0.15s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            // zIndex here is within the header's stacking context (header is z-index:10 on the page)
            zIndex: 9999,
            minWidth: "180px",
            maxWidth: "240px",
            maxHeight: "320px",
            overflowY: "auto",
            borderRadius: "10px",
            border: "1px solid rgba(0,245,160,0.18)",
            background: "rgba(3,14,8,0.97)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,245,160,0.06)",
          }}
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.value}
              type="button"
              onClick={() => {
                onChange(lang.value);
                setOpen(false);
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                fontSize: "12px",
                fontFamily: "ui-monospace, monospace",
                textAlign: "left",
                cursor: "pointer",
                background: lang.value === value ? "rgba(0,245,160,0.06)" : "transparent",
                color: lang.value === value ? "#00F5A0" : "#8A9A96",
                border: "none",
                transition: "background 0.1s, color 0.1s",
              }}
              onMouseEnter={(e) => {
                if (lang.value !== value) {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,245,160,0.04)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#F4F7F6";
                }
              }}
              onMouseLeave={(e) => {
                if (lang.value !== value) {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "#8A9A96";
                }
              }}
            >
              {lang.label}
              {lang.value === value && <Check size={11} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
