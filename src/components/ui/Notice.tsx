import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Notice.module.css";

type NoticeProps = {
  /** "empty" for nothing-here-yet states, "error" for failures the reader can act on. */
  tone?: "empty" | "error";
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string | undefined;
};

/**
 * Empty and error states. Both say what happened and what to do next; an
 * error is announced to assistive tech, an empty state is not.
 */
export function Notice({ tone = "empty", title, children, action, className }: NoticeProps) {
  return (
    <div
      className={cx(styles.notice, styles[tone], className)}
      role={tone === "error" ? "alert" : undefined}
    >
      <p className={styles.title}>{title}</p>
      {children && <div className={styles.body}>{children}</div>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
