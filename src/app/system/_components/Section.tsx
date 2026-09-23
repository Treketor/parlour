import type { ReactNode } from "react";
import styles from "../system.module.css";

type SectionProps = { id: string; title: string; intro: string; children: ReactNode };

export function Section({ id, title, intro, children }: SectionProps) {
  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-title`}>
      <header className={styles.sectionHead}>
        <h2 id={`${id}-title`} className={styles.sectionTitle}>
          {title}
        </h2>
        <p className={styles.sectionIntro}>{intro}</p>
      </header>
      {children}
    </section>
  );
}
