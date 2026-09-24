import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { CloseIcon, PlusIcon } from "./icons";
import styles from "./Tag.module.css";

type TagProps = {
  children: ReactNode;
  /** Makes the tag a toggle, e.g. a filter. */
  selected?: boolean;
  onToggle?: () => void;
  /** Adds a remove control, e.g. a tag on a library entry. */
  onRemove?: () => void;
  /** Accessible name for the remove control when children is not plain text. */
  removeLabel?: string;
  disabled?: boolean;
  /**
   * "applied": on this game, in the accent. "suggestion": one you could add,
   * dashed with a plus, so the two never read as the same thing.
   */
  tone?: "applied" | "suggestion";
  className?: string | undefined;
};

export function Tag({
  children,
  selected = false,
  onToggle,
  onRemove,
  removeLabel,
  disabled,
  tone,
  className,
}: TagProps) {
  const toneClass = tone && styles[tone];
  if (onToggle) {
    return (
      <button
        type="button"
        className={cx(styles.tag, styles.toggle, toneClass, className)}
        aria-pressed={selected}
        disabled={disabled}
        onClick={onToggle}
      >
        {tone === "suggestion" && <PlusIcon width={12} height={12} className={styles.plus} />}
        {children}
      </button>
    );
  }

  return (
    <span
      className={cx(styles.tag, onRemove && styles.removable, toneClass, className)}
      data-disabled={disabled || undefined}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          className={styles.remove}
          aria-label={removeLabel ?? `Remove ${typeof children === "string" ? children : "tag"}`}
          disabled={disabled}
          onClick={onRemove}
        >
          <CloseIcon width={12} height={12} />
        </button>
      )}
    </span>
  );
}
