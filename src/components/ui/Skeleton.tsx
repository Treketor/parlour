import type { CSSProperties } from "react";
import { cx } from "@/lib/cx";
import styles from "./Skeleton.module.css";

type SkeletonProps = {
  /** Any CSS length. Defaults to filling the container. */
  width?: string;
  /** Text skeletons take their height from the surrounding font size. */
  variant?: "block" | "text";
  className?: string | undefined;
};

/**
 * A placeholder shape. Real components render these inside their own layout
 * (see GameCard and ListRow `loading`), so content lands without shifting.
 */
export function Skeleton({ width, variant = "block", className }: SkeletonProps) {
  return (
    <span
      className={cx(styles.skeleton, styles[variant], className)}
      style={width ? ({ width } as CSSProperties) : undefined}
      aria-hidden="true"
    />
  );
}
