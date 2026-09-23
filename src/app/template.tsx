import type { ReactNode } from "react";
import styles from "./template.module.css";

/*
 * A template (not a layout) remounts on every navigation, so the entrance
 * below plays each time the page changes and signals that it did.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className={styles.page}>{children}</div>;
}
