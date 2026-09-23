"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import styles from "./error.module.css";

type ErrorPageProps = {
  error: Error & { digest?: string };
  /** Refreshes server data and re-renders the segment (the Next 16.3 prop; see DECISIONS.md 018). */
  retry: () => void;
};

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <PageHeader title="Something went wrong" />
      <Notice
        tone="error"
        title="This page could not be shown"
        action={<Button onClick={retry}>Try again</Button>}
      >
        <p>Your library is not affected. Trying again usually fixes it.</p>
        {error.digest && (
          // Server errors reach the browser without details; the digest matches the server log.
          <p className={styles.reference}>Reference {error.digest}</p>
        )}
      </Notice>
    </>
  );
}
