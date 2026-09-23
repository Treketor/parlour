import type { ReactNode } from "react";
import styles from "./legal.module.css";

/** Shared reading layout for the terms, privacy and data sources pages. */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return <article className={styles.article}>{children}</article>;
}
