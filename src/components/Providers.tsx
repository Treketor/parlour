"use client";

import { MotionConfig } from "motion/react";
import { useEffect, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // iOS Safari only applies :active while a touchstart listener exists, and
    // pressed states must register on touch-down, not on release.
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    return () => document.removeEventListener("touchstart", noop);
  }, []);

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
