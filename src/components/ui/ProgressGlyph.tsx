import { cx } from "@/lib/cx";
import { progressLabel, type Progress } from "@/lib/progress";
import styles from "./ProgressGlyph.module.css";

/*
 * One family of marks built on a ring, so the states read as degrees of the
 * same thing rather than unrelated symbols: empty, half-filled, held, full,
 * full and sealed, struck through.
 */
function Mark({ progress }: { progress: Progress }) {
  switch (progress) {
    case "want_to_play":
      return <circle cx="6" cy="6" r="4.25" />;
    case "playing":
      return (
        <>
          <circle cx="6" cy="6" r="4.25" />
          <path d="M6 1.75a4.25 4.25 0 0 1 0 8.5z" fill="currentColor" stroke="none" />
        </>
      );
    case "paused":
      return (
        <>
          <circle cx="6" cy="6" r="4.25" />
          <path d="M4.75 4.25v3.5M7.25 4.25v3.5" />
        </>
      );
    case "finished":
      return <circle cx="6" cy="6" r="4.25" fill="currentColor" />;
    case "completed":
      return (
        <>
          <circle cx="6" cy="6" r="5.25" />
          <circle cx="6" cy="6" r="3" fill="currentColor" stroke="none" />
        </>
      );
    case "abandoned":
      return (
        <>
          <circle cx="6" cy="6" r="4.25" />
          <path d="M3 9 9 3" />
        </>
      );
  }
}

export function ProgressGlyph({
  progress,
  className,
}: {
  progress: Progress;
  className?: string | undefined;
}) {
  return (
    <svg
      className={cx(styles.glyph, progress === "playing" && styles.active, className)}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden="true"
      focusable="false"
    >
      <Mark progress={progress} />
    </svg>
  );
}

export function ProgressLabel({
  progress,
  className,
}: {
  progress: Progress;
  className?: string | undefined;
}) {
  return (
    <span className={cx(styles.label, progress === "playing" && styles.active, className)}>
      <ProgressGlyph progress={progress} />
      {progressLabel[progress]}
    </span>
  );
}
