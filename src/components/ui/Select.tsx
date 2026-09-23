"use client";

import { useId, type SelectHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { ChevronDownIcon } from "./icons";
import styles from "./Field.module.css";

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  label: string;
  hideLabel?: boolean;
  hint?: string;
  error?: string | undefined;
};

/*
 * A styled native select: the platform picker is the right control on touch
 * devices and comes with keyboard and screen reader behaviour for free.
 */
export function Select({
  label,
  hideLabel = false,
  hint,
  error,
  id,
  className,
  children,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const messageId = `${selectId}-message`;
  const message = error ?? hint;

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={selectId} className={cx(styles.label, hideLabel && "visually-hidden")}>
        {label}
      </label>
      <div
        className={cx(styles.control, styles.selectControl)}
        data-invalid={error ? true : undefined}
      >
        <select
          id={selectId}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          {...rest}
        >
          {children}
        </select>
        <ChevronDownIcon className={styles.chevron} />
      </div>
      {message && (
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
