"use client";

import { MotionConfig, useReducedMotion, type Transition } from "motion/react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { transition } from "@/lib/motion";

/**
 * "system" follows the OS reduced-motion setting; the other two override it.
 * The CSS tokens read the same choice from `data-motion` on <html>.
 */
export type MotionPreference = "system" | "full" | "reduced";

const reducedMotionFor = {
  system: "user",
  full: "never",
  reduced: "always",
} as const satisfies Record<MotionPreference, "user" | "never" | "always">;

const MotionPreferenceContext = createContext<{
  preference: MotionPreference;
  setPreference: (preference: MotionPreference) => void;
} | null>(null);

export function useMotionPreference() {
  const context = useContext(MotionPreferenceContext);
  if (!context) throw new Error("useMotionPreference must be used inside <Providers>");
  return context;
}

/** True when motion should be reduced, from the in-app choice or the OS setting. */
export function useShouldReduceMotion(): boolean {
  const { preference } = useMotionPreference();
  const systemReduced = useReducedMotion() ?? false;
  return preference === "reduced" || (preference === "system" && systemReduced);
}

/**
 * Transition for layout animations (reorders, sliding indicators). Motion's
 * reducedMotion setting does not stop layout animations in practice (measured
 * in stage 1, motion 13.4), so they are made instant here; the accompanying
 * opacity changes still run, so the change stays visible.
 */
export function useLayoutTransition(kind: "move" | "slide"): Transition {
  return useShouldReduceMotion() ? { duration: 0 } : transition[kind];
}

export function Providers({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<MotionPreference>("system");

  useEffect(() => {
    const root = document.documentElement;
    if (preference === "system") delete root.dataset.motion;
    else root.dataset.motion = preference;
  }, [preference]);

  useEffect(() => {
    // iOS Safari only applies :active while a touchstart listener exists, and
    // pressed states must register on touch-down, not on release.
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    return () => document.removeEventListener("touchstart", noop);
  }, []);

  return (
    <MotionPreferenceContext.Provider value={{ preference, setPreference }}>
      <MotionConfig reducedMotion={reducedMotionFor[preference]}>{children}</MotionConfig>
    </MotionPreferenceContext.Provider>
  );
}
