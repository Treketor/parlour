"use client";

import { useMotionPreference, type MotionPreference } from "@/components/Providers";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import styles from "../system.module.css";

/**
 * Lets the review page show full and reduced motion regardless of the OS
 * setting. The same preference becomes a user setting in a later stage.
 */
export function ReviewControls() {
  const { preference, setPreference } = useMotionPreference();

  return (
    <div className={styles.reviewControls}>
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
