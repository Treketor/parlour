"use client";

import { useId, useRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { CloseIcon } from "./icons";
import styles from "./Field.module.css";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string;
  /** Hide the label visually but keep it for assistive tech, e.g. a search bar. */
  hideLabel?: boolean;
  hint?: string;
  error?: string | undefined;
  leading?: ReactNode;
  /** Shows a clear control when the field has a value. */
  onClear?: () => void;
};

export function TextField({
  label,
  hideLabel = false,
  hint,
  error,
  leading,
  onClear,
  id,
  className,
  value,
  disabled,
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const inputRef = useRef<HTMLInputElement>(null);
  const message = error ?? hint;
  const showClear = onClear !== undefined && value !== undefined && value !== "" && !disabled;

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={inputId} className={cx(styles.label, hideLabel && "visually-hidden")}>
        {label}
      </label>
      <div className={styles.control} data-invalid={error ? true : undefined}>
        {leading && <span className={styles.leading}>{leading}</span>}
        <input
          ref={inputRef}
          id={inputId}
          className={styles.input}
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          {...rest}
        />
        {showClear && (
          <button
            type="button"
            className={styles.clear}
            aria-label={`Clear ${label.toLowerCase()}`}
            onClick={() => {
              onClear();
              inputRef.current?.focus();
            }}
          >
            <CloseIcon width={14} height={14} />
          </button>
        )}
      </div>
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
