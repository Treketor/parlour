import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Button.module.css";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Keeps the button's width and label for layout, shows progress, and blocks repeat presses. */
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon,
  className,
  children,
  disabled,
  onClick,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.button, styles[variant], styles[size], className)}
      disabled={disabled}
      aria-busy={loading || undefined}
      // aria-disabled rather than disabled while loading, so focus is not lost mid-action.
      aria-disabled={loading || undefined}
      onClick={loading ? undefined : onClick}
      {...rest}
    >
      <span className={styles.content} data-hidden={loading || undefined}>
        {icon}
        {children}
      </span>
      {loading && (
        <span className={styles.spinner}>
          <Spinner />
        </span>
      )}
    </button>
  );
}

type IconButtonProps = Omit<ButtonProps, "icon" | "children" | "loading"> & {
  /** Required: an icon alone has no accessible name. */
  label: string;
  children: ReactNode;
};

export function IconButton({ label, className, children, ...rest }: IconButtonProps) {
  return (
    <Button aria-label={label} title={label} className={cx(styles.iconOnly, className)} {...rest}>
      {children}
    </Button>
  );
}
