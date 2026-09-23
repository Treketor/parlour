import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
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

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
};

/** Navigation that looks like a button. It stays a link so it can be opened in a new tab. */
export function ButtonLink({
  variant = "secondary",
  size = "md",
  icon,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={cx(styles.button, styles[variant], styles[size], className)} {...rest}>
      <span className={styles.content}>
        {icon}
        {children}
      </span>
    </Link>
  );
}
