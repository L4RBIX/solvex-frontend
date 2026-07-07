"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** 1-7 maps to reveal-d1…reveal-d7 (stagger delay) */
  delay?: number;
  threshold?: number;
}

/**
 * Wraps children in a div with CSS reveal classes.
 * Adds .visible when the element enters the viewport (once only).
 * No animation plays when prefers-reduced-motion is set — CSS handles that.
 */
export function RevealOnScroll({
  children,
  className = "",
  delay = 0,
  threshold = 0.1,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const delayClass = delay >= 1 && delay <= 7 ? `reveal-d${delay}` : "";
  return (
    <div
      ref={ref}
      className={["reveal", delayClass, className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}
