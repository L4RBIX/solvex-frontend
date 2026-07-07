"use client";

import { useState } from "react";
import type React from "react";
import { RevealOnScroll } from "@/components/animations/motion";

const LINE_GRADIENT = "linear-gradient(to bottom, rgba(0,245,160,0) 0%, rgba(0,245,160,0.5) 50%, rgba(0,217,245,0.5) 50%, rgba(0,217,245,0) 100%)";
const RAY_GRADIENT  = "linear-gradient(to bottom, rgba(0,245,160,0) 0%, rgb(0,245,160) 50%, rgb(0,217,245) 50%, rgba(0,217,245,0) 100%)";
const TOP_GRADIENT  = "linear-gradient(to bottom, rgba(0,245,160,0) 0%, rgb(0,245,160) 50%, rgb(0,217,245) 50%, rgba(0,217,245,0) 100%)";

function maskStyle(filename: string, size: "cover" | "contain" = "contain") {
  const url = `url('/images/hero/${filename}')`;
  return { maskImage: url, WebkitMaskImage: url, maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskSize: size, WebkitMaskSize: size } as React.CSSProperties;
}

const LINES = [
  { file: "hero-background-bottom-line-1.png", delay: "0s" },
  { file: "hero-background-bottom-line-2.png", delay: "2s" },
  { file: "hero-background-bottom-line-3.png", delay: "3s" },
  { file: "hero-background-bottom-line-4.png", delay: "1s" },
];

function CTABackground() {
  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", top: "60px", left: "calc(50% - 624px)", width: "1248px", pointerEvents: "none", zIndex: 0 }}
    >
      <div
        style={{
          backgroundImage: "url('/images/hero/hero-background-top.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          position: "relative",
          width: "100%",
          height: "202px",
          marginBottom: "72px",
        }}
      >
        <div style={{ ...maskStyle("hero-background-top-mask.png", "cover"), position: "absolute", inset: 0, overflow: "hidden", zIndex: 9 }}>
          <div style={{ backgroundImage: TOP_GRADIENT, width: "100%", height: "100px", animation: "hero-top-anim 6s cubic-bezier(0.62,0.62,0.28,0.67) infinite" }} />
        </div>
      </div>
      <div
        style={{
          background: "radial-gradient(ellipse 900px 500px at 50% 50%, rgba(0,245,160,0.1) 0%, rgba(0,217,245,0.05) 42%, transparent 72%)",
          height: "725px",
          width: "1800px",
          position: "absolute",
          top: "200px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
      <div style={{ height: "530px", position: "relative" }}>
        {LINES.map((ln, i) => (
          <div key={i} style={{ ...maskStyle(ln.file), position: "absolute", inset: 0, overflow: "hidden", zIndex: 9 }}>
            <div style={{ backgroundImage: LINE_GRADIENT, width: "100%", height: "100px", animation: `hero-line-anim 4s cubic-bezier(0.62,0.62,0.14,1) ${ln.delay} infinite` }} />
          </div>
        ))}
        <div style={{ ...maskStyle("hero-background-bottom-ray.png"), position: "absolute", inset: 0, overflow: "hidden", zIndex: 9 }}>
          <div style={{ backgroundImage: RAY_GRADIENT, width: "100%", height: "100px", animation: "hero-ray-anim 8s cubic-bezier(0.62,0.62,0.28,0.67) 1s infinite" }} />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/hero/hero-background-bottom.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", mixBlendMode: "overlay", zIndex: 12 }} />
      </div>
    </div>
  );
}

export default function CTASection() {
  const [handle, setHandle] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = handle.trim();
    if (trimmed) {
      window.location.href = `/analyze?handle=${encodeURIComponent(trimmed)}`;
    }
  }

  return (
    <div style={{ padding: "0 40px", marginBottom: "80px" }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#020806",
          border: "1px solid rgba(0,245,160,0.16)",
          borderRadius: "24px",
          padding: "100px 40px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "520px",
          justifyContent: "center",
        }}
      >
        <CTABackground />

        <RevealOnScroll threshold={0.15}>
        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* TX icon */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(0,245,160,0.15), rgba(0,217,245,0.15))",
              border: "1px solid rgba(0,245,160,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "22px",
              color: "#00F5A0",
              marginBottom: "32px",
              fontFamily: "var(--font-rebond, system-ui)",
              letterSpacing: "-0.03em",
            }}
          >
            SX
          </div>

          <h2
            style={{
              fontFamily: "var(--font-rebond, system-ui)",
              fontWeight: 700,
              fontSize: "clamp(32px, 5vw, 56px)",
              lineHeight: 1.05,
              color: "#F4F7F6",
              letterSpacing: "-0.04em",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            Find your next training focus.
          </h2>

          <p
            style={{
              fontSize: "18px",
              color: "rgba(244,247,246,0.5)",
              lineHeight: "28px",
              textAlign: "center",
              marginBottom: "36px",
              maxWidth: "460px",
            }}
          >
            Enter your Codeforces handle. Get a full friction analysis in seconds.
          </p>

          <form onSubmit={handleSubmit} style={{ marginBottom: "16px" }}>
            <div className="hero-input-pill">
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="Enter Codeforces handle"
                className="hero-input-inner"
                autoComplete="off"
                spellCheck={false}
              />
              <div className="glow-wrap">
                <div className="glow-animations">
                  <div className="glow-glow" />
                  <div className="glow-stars-masker"><div className="glow-stars" /></div>
                </div>
                <div className="glow-content">
                  <button type="submit" className="hero-cta-btn">Analyze profile</button>
                </div>
              </div>
            </div>
          </form>

          <p
            style={{
              fontSize: "13px",
              color: "rgba(244,247,246,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <span>No login required</span>
            <span>✦</span>
            <span>Free during beta</span>
            <span>✦</span>
            <span>~10 seconds</span>
          </p>
        </div>
        </RevealOnScroll>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .cta-outer-wrapper { padding: 0 16px !important; }
        }
      `}</style>
    </div>
  );
}
