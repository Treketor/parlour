"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { schibstedGrotesk } from "./fonts";
import styles from "./global-error.module.css";
import "@/styles/tokens.css";
import "@/styles/global.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/*
 * Replaces the root layout when it fails, so it brings its own document,
 * tokens and font. The header and footer are not available here.
 */
export default function GlobalError({ error, retry }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className={schibstedGrotesk.variable}>
      <body>
        <main className={styles.main}>
          <p className={styles.wordmark}>Parlour</p>
          <Notice
            tone="error"
            title="Parlour could not load"
            action={<Button onClick={retry}>Try again</Button>}
          >
            <p>Something failed before the page could be drawn. Your library is not affected.</p>
            {error.digest && <p className={styles.reference}>Reference {error.digest}</p>}
          </Notice>
        </main>
      </body>
    </html>
  );
}
