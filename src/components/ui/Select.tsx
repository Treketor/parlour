"use client";

import { useId } from "react";
import { cx } from "@/lib/cx";
import { MenuSelect, type MenuOption } from "./MenuSelect";
import styles from "./Field.module.css";

type SelectProps<T extends string> = {
  label: string;
  hideLabel?: boolean;
  hint?: string;
  error?: string | undefined;
  size?: "sm" | "md";
  options: ReadonlyArray<MenuOption<T>>;
  value: T | null;
  onChange: (value: T) => void;
  placeholder?: string;
  /** Submits the value with a surrounding form. */
  name?: string;
  disabled?: boolean;
  className?: string | undefined;
};

/**
 * A labelled choice from a list, drawn as a form field. The list is the
 * app's own animated menu rather than the system popup (DECISIONS.md 035).
 */
export function Select<T extends string>({
  label,
  hideLabel = false,
  hint,
  error,
  size = "md",
  className,
  ...menu
}: SelectProps<T>) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={id} className={cx(styles.label, hideLabel && "visually-hidden")}>
        {label}
      </label>
      <MenuSelect
        {...menu}
        id={id}
        label={label}
        size={size}
        field
        fullWidth
        invalid={error !== undefined}
        aria-describedby={message ? messageId : undefined}
      />
      {message && (
        // Keyed so an error replacing a hint (or a new error) plays its entrance again.
        <p
          key={error ? `error:${error}` : "hint"}
          id={messageId}
          className={cx(styles.message, error && styles.error)}
        >
          {message}
        </p>
      )}
    </div>
  );
}
