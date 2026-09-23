"use client";

import { motion } from "motion/react";
import { useId, useRef, type KeyboardEvent } from "react";
import { cx } from "@/lib/cx";
import { transition } from "@/lib/motion";
import styles from "./SegmentedControl.module.css";

export type SegmentOption<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  label: string;
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string | undefined;
};

/**
 * A radio group drawn as joined segments. The selection indicator travels to
 * the chosen segment so the change is seen, not just noticed.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  size = "md",
  className,
}: SegmentedControlProps<T>) {
  const indicatorId = useId();
  const refs = useRef(new Map<T, HTMLButtonElement>());

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = options.findIndex((option) => option.value === value);
    const last = options.length - 1;
    let nextIndex: number | undefined;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = index === last ? 0 : index + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = index === 0 ? last : index - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = last;
    }

    const next = nextIndex === undefined ? undefined : options[nextIndex];
    if (next) {
      event.preventDefault();
      onChange(next.value);
      refs.current.get(next.value)?.focus();
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx(styles.group, styles[size], className)}
      onKeyDown={onKeyDown}
    >
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              if (node) refs.current.set(option.value, node);
              else refs.current.delete(option.value);
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            // Roving tab stop: Tab lands on the selected segment, arrows move within.
            tabIndex={checked ? 0 : -1}
            className={styles.segment}
            // Commit on pointer-down so the indicator starts moving under the finger.
            onPointerDown={(event) => {
              if (event.button === 0 && !checked) onChange(option.value);
            }}
            // Keeps keyboard activation (Space/Enter fire click without pointerdown).
            onClick={() => {
              if (!checked) onChange(option.value);
            }}
          >
            {checked && (
              <motion.span
                layoutId={indicatorId}
                className={styles.indicator}
                transition={transition.slide}
                aria-hidden="true"
              />
            )}
            <span className={styles.label}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
