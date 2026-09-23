"use client";

import { useEffect, useState } from "react";
import { useMotionPreference, type MotionPreference } from "@/components/Providers";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import styles from "../system.module.css";

type Direction = "editorial" | "swiss";

const STORAGE_KEY = "shelfmark:review-direction";

function readStoredDirection(): Direction | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "editorial" || stored === "swiss" ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Review-only switches: which visual direction is applied, and whether motion
 * runs full or reduced regardless of the OS setting. Removed once a direction
 * is chosen (DECISIONS.md 009); the motion switch becomes a user setting.
 */
export function ReviewControls() {
  const [direction, setDirection] = useState<Direction>("editorial");
  const { preference, setPreference } = useMotionPreference();

  useEffect(() => {
    const stored = readStoredDirection();
    // Syncing from storage after mount avoids a server/client markup mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setDirection(stored);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.direction = direction;
    try {
      window.localStorage.setItem(STORAGE_KEY, direction);
    } catch {
      // Storage can be unavailable (private mode); the switch still works for this visit.
    }
  }, [direction]);

  return (
    <div className={styles.reviewControls}>
      <SegmentedControl<Direction>
        label="Visual direction"
        size="sm"
        value={direction}
        onChange={setDirection}
        options={[
          { value: "editorial", label: "Editorial" },
          { value: "swiss", label: "Swiss" },
        ]}
      />
      <SegmentedControl<MotionPreference>
        label="Motion"
        size="sm"
        value={preference}
        onChange={setPreference}
        options={[
          { value: "system", label: "System motion" },
          { value: "full", label: "Full" },
          { value: "reduced", label: "Reduced" },
        ]}
      />
    </div>
  );
}
