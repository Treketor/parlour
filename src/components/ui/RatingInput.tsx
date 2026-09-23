"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { cx } from "@/lib/cx";
import {
  RATING_MAX,
  RATING_MIN,
  describeRating,
  ratingAtPosition,
  ratingForKey,
  type Rating,
} from "@/lib/rating";
import { CloseIcon } from "./icons";
import styles from "./RatingInput.module.css";

type RatingInputProps = {
  label: string;
  value: Rating | null;
  onChange: (value: Rating | null) => void;
  disabled?: boolean;
  error?: string | undefined;
  className?: string | undefined;
};

const CELLS = Array.from({ length: RATING_MAX }, (_, index) => index + 1);

/**
 * A ten-step scale with a numeric readout. The number is the rating; the cells
 * are only a way to set it. Commits on pointer-down and scrubs while dragging.
 */
export function RatingInput({
  label,
  value,
  onChange,
  disabled,
  error,
  className,
}: RatingInputProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<Rating | null>(null);
  // Which way the readout rolls when the value changes: up for higher, down for lower.
  const [direction, setDirection] = useState<"up" | "down">("up");

  function commit(next: Rating | null) {
    if (next === value) return;
    setDirection(next !== null && (value === null || next > value) ? "up" : "down");
    onChange(next);
  }

  function ratingFromPointer(event: PointerEvent<HTMLDivElement>): Rating {
    const rect = event.currentTarget.getBoundingClientRect();
    return ratingAtPosition(event.clientX - rect.left, rect.width);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    trackRef.current?.focus({ preventScroll: true });
    setPreview(null);
    commit(ratingFromPointer(event));
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (disabled) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      commit(ratingFromPointer(event));
    } else if (event.pointerType === "mouse") {
      setPreview(ratingFromPointer(event));
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    const next = ratingForKey(value, event.key);
    if (next === undefined) return;
    event.preventDefault();
    commit(next);
  }

  const shown = preview ?? value;

  return (
    <div className={cx(styles.rating, className)} data-disabled={disabled || undefined}>
      <div className={styles.readout} aria-hidden="true">
        {value === null ? (
          <span className={styles.unrated}>Unrated</span>
        ) : (
          <span key={value} className={styles.number} data-direction={direction}>
            {value}
          </span>
        )}
        {value !== null && <span className={styles.outOf}>/{RATING_MAX}</span>}
      </div>

      <div
        ref={trackRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={RATING_MIN}
        aria-valuemax={RATING_MAX}
        aria-valuenow={value ?? undefined}
        aria-valuetext={describeRating(value)}
        aria-disabled={disabled || undefined}
        aria-invalid={error ? true : undefined}
        className={styles.track}
        data-previewing={preview !== null || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setPreview(null)}
        onKeyDown={onKeyDown}
      >
        {CELLS.map((cell) => (
          <span
            key={cell}
            className={styles.cell}
            data-filled={(shown !== null && cell <= shown) || undefined}
            style={{ "--index": cell } as CSSProperties}
          />
        ))}
      </div>

      <button
        type="button"
        className={styles.clear}
        aria-label={`Clear ${label.toLowerCase()}`}
        // Hidden rather than removed so the row never changes width.
        data-hidden={value === null || disabled || undefined}
        tabIndex={value === null || disabled ? -1 : 0}
        onClick={() => {
          commit(null);
          trackRef.current?.focus();
        }}
      >
        <CloseIcon width={14} height={14} />
      </button>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
