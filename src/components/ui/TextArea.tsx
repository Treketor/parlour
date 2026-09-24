"use client";

import { useId, type TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import styles from "./Field.module.css";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hideLabel?: boolean;
  hint?: string;
  error?: string | undefined;
};

/** Multi-line text that grows with what is written, up to a limit, then scrolls. */
export function TextArea({
  label,
  hideLabel = false,
  hint,
  error,
  id,
  className,
  ...rest
}: TextAreaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const message = error ?? hint;

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={inputId} className={cx(styles.label, hideLabel && "visually-hidden")}>
        {label}
      </label>
      <div className={cx(styles.control, styles.multiline)} data-invalid={error ? true : undefined}>
        <textarea
          id={inputId}
          className={cx(styles.input, styles.textarea)}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          {...rest}
        />
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
